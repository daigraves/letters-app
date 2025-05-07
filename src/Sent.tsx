// src/Sent.tsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  arrayUnion,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Letter {
  id: string;
  to: string;
  from: string;
  message: string;
  deliverAt?: Timestamp;
  readAt?: Timestamp;
  starredBy?: string[];
  deletedBySender?: string[];
}

export default function Sent({
  groupId,
  currentUser,
}: {
  groupId: string;
  currentUser: string;
}) {
  const [letters, setLetters] = useState<Letter[]>([]);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "letters"),
      where("groupId", "==", groupId),
      where("from", "==", currentUser)
    );
    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs.map<Letter>((d) => ({
        id: d.id,
        ...(d.data() as Omit<Letter, "id">),
      }));
      // hide deleted
      const visible = raw.filter(
        (l) => !(l.deletedBySender ?? []).includes(currentUser)
      );
      // sort by deliverAt
      visible.sort(
        (a, b) =>
          (a.deliverAt?.toDate().getTime() ?? 0) -
          (b.deliverAt?.toDate().getTime() ?? 0)
      );
      setLetters(visible);
    });
    return () => unsub();
  }, [groupId, currentUser]);

  // delete a letter for me
  const handleDelete = async (id: string) => {
    await updateDoc(doc(db, "letters", id), {
      deletedBySender: arrayUnion(currentUser),
    });
  };

  // edit a pending letter
  const handleEdit = async (l: Letter) => {
    const origMsg = l.message;
    const newMsg = window.prompt("Edit your message:", origMsg);
    if (newMsg == null) return;

    const origDt = l.deliverAt?.toDate().toISOString().slice(0, 16) ?? "";
    const newDtStr = window.prompt(
      "Edit delivery time (YYYY-MM-DDThh:mm):",
      origDt
    );
    if (newDtStr == null) return;

    await updateDoc(doc(db, "letters", l.id), {
      message: newMsg.trim(),
      deliverAt: Timestamp.fromDate(new Date(newDtStr)),
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Sent Letters</h2>
      {letters.length === 0 && <p>No sent letters.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {letters.map((l) => {
          const when = l.deliverAt?.toDate() ?? new Date(0);
          const pending = when > new Date();
          const status = pending
            ? "Pending"
            : l.readAt
            ? `Read at ${l.readAt.toDate().toLocaleString()}`
            : "Unread";

          return (
            <li
              key={l.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 6,
                marginBottom: 16,
                padding: 12,
                backgroundColor: pending ? "#fff8dc" : "#f5f5f5",
              }}
            >
              <div>
                <strong>To:</strong> {l.to}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Message:</strong> {l.message}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Deliver At:</strong> {when.toLocaleString()}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Status:</strong> {status}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                {pending && <button onClick={() => handleEdit(l)}>Edit</button>}
                <button onClick={() => handleDelete(l.id)}>Delete</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

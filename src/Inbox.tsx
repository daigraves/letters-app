// src/Inbox.tsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import { db } from "./firebase";

interface InboxProps {
  groupId: string;
  currentUser: string;
}

interface Letter {
  id: string;
  from: string;
  to: string;
  message: string;
  deliverAt?: Timestamp;
  readAt?: Timestamp;
  deletedByRecipient?: string[];
}

export default function Inbox({ groupId, currentUser }: InboxProps) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "letters"),
      where("groupId", "==", groupId),
      where("to", "==", currentUser)
    );
    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs
        .map<Letter>((d) => ({ id: d.id, ...(d.data() as Omit<Letter, "id">) }))
        .filter((l) => !(l.deletedByRecipient ?? []).includes(currentUser))
        .filter((l) => (l.deliverAt?.toDate().getTime() ?? 0) <= Date.now())
        .sort((a, b) => {
          const aMs = a.deliverAt?.toDate().getTime() ?? 0;
          const bMs = b.deliverAt?.toDate().getTime() ?? 0;
          return bMs - aMs; // newest first
        });
      setLetters(raw);
      setLoading(false);
      // auto-unselect removed ids
      setSelected(
        (prev) =>
          new Set([...prev].filter((id) => raw.some((l) => l.id === id)))
      );
    });
    return () => unsub();
  }, [groupId, currentUser]);

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const bulkDelete = async () => {
    await Promise.all(
      letters
        .filter((l) => selected.has(l.id))
        .map((l) =>
          updateDoc(doc(db, "letters", l.id), {
            deletedByRecipient: arrayUnion(currentUser),
          })
        )
    );
    setSelected(new Set());
  };

  const bulkMarkRead = async () => {
    await Promise.all(
      letters
        .filter((l) => selected.has(l.id))
        .map((l) =>
          updateDoc(doc(db, "letters", l.id), {
            readAt: Timestamp.now(),
          })
        )
    );
    setSelected(new Set());
  };

  const bulkExport = () => {
    if (selected.size === 0) return;
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    let y = 40;
    letters
      .filter((l) => selected.has(l.id))
      .forEach((l, idx, arr) => {
        const delivered = l.deliverAt
          ? l.deliverAt.toDate().toLocaleString()
          : "";
        pdf.setFontSize(12).text(`From: ${l.from}`, 40, y);
        y += 16;
        pdf.text(`When: ${delivered}`, 40, y);
        y += 16;
        const lines = pdf.splitTextToSize(l.message, 500);
        pdf.text(lines, 40, y);
        y += lines.length * 14 + 20;
        if (y > 720 && idx < arr.length - 1) {
          pdf.addPage();
          y = 40;
        }
      });
    pdf.save("inbox-messages.pdf");
  };

  if (loading) return <p>Loading inbox…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Inbox</h2>

      {/* Select All / Clear */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setSelected(new Set(letters.map((l) => l.id)))}
          disabled={letters.length === 0}
          style={{ marginRight: 8 }}
        >
          Select All
        </button>
        <button onClick={() => setSelected(new Set())}>Clear Selection</button>
      </div>

      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <div
          style={{
            position: "sticky",
            top: -8,
            background: "#f1f1f1",
            padding: 8,
            marginBottom: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
            zIndex: 10,
          }}
        >
          {selected.size} selected | 
          <button onClick={bulkMarkRead}>Mark Read</button> | 
          <button onClick={bulkDelete}>Delete</button> | 
          <button onClick={bulkExport}>Export PDF</button> | 
          <button onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {letters.map((l) => {
          const isRead = !!l.readAt;
          const delivered = l.deliverAt?.toDate().toLocaleString() ?? "";
          return (
            <li
              key={l.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: 12,
                marginBottom: 12,
                background: isRead ? "#fafafa" : "#fffae6",
              }}
            >
              {/* Checkbox for selection */}
              <input
                type="checkbox"
                checked={selected.has(l.id)}
                onChange={() => toggleSelect(l.id)}
                style={{ marginRight: 12, marginTop: 4 }}
              />

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>From: {l.from}</strong>
                  {!l.readAt && (
                    <span
                      style={{
                        background: "#ff3",
                        color: "#000",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 12,
                        marginLeft: 8,
                      }}
                    >
                      New
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontStyle: "italic" }}>
                    {delivered}
                  </span>
                </div>
                <div style={{ margin: "8px 0" }}>{l.message}</div>
                <div style={{ fontSize: 12 }}>
                  Status: {isRead ? "Read" : "Unread"}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

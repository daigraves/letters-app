// src/Compose.tsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

interface ComposeProps {
  groupId: string;
  currentUser: string;
}

export default function Compose({ groupId, currentUser }: ComposeProps) {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [deliverAt, setDeliverAt] = useState("");
  const [success, setSuccess] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);

  // load distinct names
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, "letters"), where("groupId", "==", groupId));
    const unsub = onSnapshot(q, (snap) => {
      const setNames = new Set<string>();
      snap.forEach((d) => {
        const { from, to } = d.data() as any;
        if (from && from !== currentUser) setNames.add(from);
        if (to && to !== currentUser) setNames.add(to);
      });
      setRecipients([...setNames]);
    });
    return () => unsub();
  }, [groupId, currentUser]);

  const clear = () => {
    setTo("");
    setMessage("");
    setDeliverAt("");
  };
  const flash = (txt: string) => {
    setSuccess(txt);
    setTimeout(() => setSuccess(""), 2500);
  };

  const sendNow = async () => {
    if (!to || !message) return;
    await addDoc(collection(db, "letters"), {
      groupId,
      to,
      from: currentUser,
      message,
      deliverAt: Timestamp.now(),
      readAt: null,
      starredBy: [],
      deletedByRecipient: [],
      deletedBySender: [],
    });
    clear();
    flash("Sent!");
  };

  const sendLater = async () => {
    if (!to || !message || !deliverAt) return;
    await addDoc(collection(db, "letters"), {
      groupId,
      to,
      from: currentUser,
      message,
      deliverAt: Timestamp.fromDate(new Date(deliverAt)),
      readAt: null,
      starredBy: [],
      deletedByRecipient: [],
      deletedBySender: [],
    });
    clear();
    flash("Scheduled!");
  };

  return (
    <div>
      {success && (
        <div
          className="card"
          style={{ backgroundColor: "#e6ffed", marginBottom: 12 }}
        >
          {success}
        </div>
      )}

      <select
        className="select"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      >
        <option value="">Select recipient…</option>
        {recipients.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <textarea
        className="textarea"
        placeholder="Your message…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <input
        type="datetime-local"
        className="input"
        value={deliverAt}
        onChange={(e) => setDeliverAt(e.target.value)}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button className="button button-primary" onClick={sendNow}>
          Send Now
        </button>
        <button className="button button-secondary" onClick={sendLater}>
          Schedule
        </button>
      </div>
    </div>
  );
}

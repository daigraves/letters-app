// src/App.tsx
import React, { useState, useEffect } from "react";
import Compose from "./Compose";
import Inbox from "./Inbox";
import Sent from "./Sent";

const LS_GROUP = "letters-groupId";
const LS_NAME = "letters-userName";
const LS_JOINED = "letters-joined";

export default function App() {
  const [groupId, setGroupId] = useState(
    () => localStorage.getItem(LS_GROUP) || ""
  );
  const [name, setName] = useState(() => localStorage.getItem(LS_NAME) || "");
  const [joined, setJoined] = useState(
    () => localStorage.getItem(LS_JOINED) === "true"
  );

  // Persist to localStorage
  useEffect(() => {
    if (joined) {
      localStorage.setItem(LS_GROUP, groupId);
      localStorage.setItem(LS_NAME, name);
      localStorage.setItem(LS_JOINED, "true");
    } else {
      localStorage.removeItem(LS_GROUP);
      localStorage.removeItem(LS_NAME);
      localStorage.removeItem(LS_JOINED);
    }
  }, [joined, groupId, name]);

  const handleEnter = () => {
    if (!groupId.trim() || !name.trim()) return;
    setGroupId(groupId.trim());
    setName(name.trim());
    setJoined(true);
  };
  const handleLeave = () => setJoined(false);

  if (!joined) {
    return (
      <div className="container" style={{ maxWidth: 360, marginTop: 80 }}>
        <div className="card">
          <h2 style={{ textAlign: "center", marginBottom: 16 }}>
            Join a Group
          </h2>
          <input
            className="input"
            placeholder="Group code"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          />
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="button button-primary"
            disabled={!groupId.trim() || !name.trim()}
            onClick={handleEnter}
            style={{ width: "100%" }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>
          Letters App <small style={{ color: "#666" }}>({groupId})</small>
        </h1>
        <button className="button button-danger" onClick={handleLeave}>
          Leave Group
        </button>
      </div>

      <div className="grid-3">
        <div className="card">
          <h2>Write a Letter</h2>
          <Compose groupId={groupId} currentUser={name} />
        </div>

        <div className="card">
          <Inbox groupId={groupId} currentUser={name} />
        </div>

        <div className="card">
          <Sent groupId={groupId} currentUser={name} />
        </div>
      </div>
    </div>
  );
}

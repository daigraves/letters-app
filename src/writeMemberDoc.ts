// src/writeMemberDoc.ts
import { 
  doc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// If your User object has more fields, add them here:
interface User {
  uid: string;
  displayName?: string;
}

export async function writeMemberDoc(
  groupCode: string,
  user: User
) {
  // Reference to groups/{groupCode}
  const groupRef = doc(db, "groups", groupCode);

  // Create the group document
  await setDoc(groupRef, {
    // Who owns this group
    ownerId:   user.uid,
    // Start with the creator as the sole member
    members:   [user.uid],
    // Timestamps & metadata
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    // …you can add more fields here if needed…
  });
}

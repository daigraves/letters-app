// src/writeMemberDoc.ts
import { 
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Adjust this interface if your user object has more fields
interface User {
  uid: string;
  displayName?: string;
}

export async function writeMemberDoc(
  groupCode: string,
  user: User
) {
  const groupRef = doc(db, "groups", groupCode);

  await setDoc(groupRef, {
    // Track who “owns” this group
    ownerId:   user.uid,
    // Seed the creator into members
    members:   [ user.uid ],
    // Timestamps and metadata
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    // …any other fields you need…
  });
}

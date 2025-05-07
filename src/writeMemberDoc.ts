// src/writeMemberDoc.ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Create (or update) the member document for the user who just joined a group.
 *
 * @param groupId      the group code entered by the user
 * @param memberId     a unique identifier for that user (displayName or uid)
 * @param displayName  the name you want other members to see
 */
export async function writeMemberDoc(
  groupId: string,
  memberId: string,
  displayName: string
) {
  await setDoc(
    doc(db, "groups", groupId, "members", memberId),
    {
      displayName,
      joinedAt: serverTimestamp(),
    },
    { merge: true } // merge = update if the doc already exists
  );
}

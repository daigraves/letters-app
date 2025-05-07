// src/useServerTime.ts
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

export function useServerTime() {
  const db = getFirestore();

  const getTime = async (): Promise<Date> => {
    const dummyRef = await addDoc(collection(db, "serverTime"), {
      timestamp: serverTimestamp(),
    });

    return new Promise((resolve) => {
      const unsub = onSnapshot(dummyRef, (snap) => {
        const data = snap.data();
        if (data?.timestamp) {
          resolve(data.timestamp.toDate());
          unsub();
        }
      });
    });
  };

  return { getTime };
}

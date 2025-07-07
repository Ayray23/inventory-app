// utils/firestoreHelpers.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const recordHistory = async ({
  productId,
  productName,
  field,
  oldValue,
  newValue,
  actionType,
  user = "anonymous",
}) => {
  try {
    await addDoc(collection(db, "history"), {
      productId,
      productName,
      field,           // "quantity" or "price"
      oldValue,
      newValue,
      actionType,      // "increase", "decrease", "manual"
      user,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error logging history:", err);
  }
};

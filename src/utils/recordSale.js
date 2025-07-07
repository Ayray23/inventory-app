import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const recordSale = async (product, quantitySold) => {
  try {
    await addDoc(collection(db, "sales"), {
      productId: product.id,
      productName: product.name,
      quantitySold: quantitySold,
      totalPrice: quantitySold * product.price,
      timestamp: serverTimestamp(),
      soldBy: "admin" // You can use auth.currentUser?.uid if using auth
    });
    alert("Sale recorded ✅");
  } catch (err) {
    console.error("Error recording sale:", err);
    alert("Failed to record sale ❌");
  }
};

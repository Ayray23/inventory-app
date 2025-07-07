import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("🔥 Firebase Error:", error);
    }
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📦 Product List</h2>
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id} className="bg-white p-4 rounded shadow">
            {p.name} — {p.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

// src/pages/AddProduct.jsx
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !quantity) return alert("Fill all fields");

    try {
      await addDoc(collection(db, "products"), {
        name,
        quantity: Number(quantity),
        timestamp: Date.now(),
      });
      alert("✅ Product added!");
      setName("");
      setQuantity("");
    } catch (err) {
      console.error("❌ Error adding product:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Product Name"
        className="border px-3 py-2 w-full rounded"
        required
      />
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity"
        className="border px-3 py-2 w-full rounded"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        ➕ Add Product
      </button>
    </form>
  );
}

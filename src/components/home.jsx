import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./navbar";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [category, setCategory] = useState("Hot Drink");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !quantity || !price) {
      alert("Please fill all fields");
      return;
    }
    try {
      await addDoc(collection(db, "products"), {
        name,
        quantity: Number(quantity),
        price: Number(price),
        discount: Number(discount || 0),
        category,
        createdAt: serverTimestamp()
      });
      alert("Product added successfully!");
      navigate("/products");
    } catch (err) {
      alert("Error adding product");
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">Add Product</h2>
          <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 p-3 border border-gray-300 rounded-md" />
          <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full mb-3 p-3 border border-gray-300 rounded-md" />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full mb-3 p-3 border border-gray-300 rounded-md" />
          <input type="number" placeholder="Discount (%)" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full mb-3 p-3 border border-gray-300 rounded-md" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mb-4 p-3 border border-gray-300 rounded-md">
            <option value="Hot Drink">Hot Drink</option>
            <option value="Soft Drink">Soft Drink</option>
          </select>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Add Product</button>
          <Link to="/products" className="block text-center text-sm text-blue-500 mt-4 hover:underline">View All Products</Link>
        </form>
      </div>
    </>
  );
};

export default AddProduct;

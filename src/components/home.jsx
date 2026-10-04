import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./navbar";
import Barcode from "./Barcode";

const createBarcode = (id) => `INV-${id.toUpperCase()}`;

const AddProduct = () => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [category, setCategory] = useState("Soft Drink");
  const [createdBarcode, setCreatedBarcode] = useState("");
  const [createdProductName, setCreatedProductName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !quantity || !price) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const productRef = await addDoc(collection(db, "products"), {
        name: name.trim(),
        quantity: Number(quantity),
        price: Number(price),
        discount: Number(discount || 0),
        category,
        barcode: "",
        createdAt: serverTimestamp(),
      });

      const barcode = createBarcode(productRef.id);
      await updateDoc(productRef, { barcode });

      setCreatedBarcode(barcode);
      setCreatedProductName(name.trim());
      setName("");
      setQuantity("");
      setPrice("");
      setDiscount("");
      alert("Product added successfully with a barcode!");
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    }
  };

  return (
    <>
      <Navbar />

      <div className="bg-gray-50 px-4 pt-20 pb-6 md:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-blue-700">📦 Add Products</h1>
          <Link
            to="/dashboard"
            className="rounded-xl bg-gray-700 px-4 py-2 text-center text-white shadow hover:bg-gray-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-xl bg-white p-6 shadow-md"
          >
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-700">
              Add Product
            </h2>

            <input
              type="text"
              placeholder="Product Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 p-3"
            />

            <input
              type="number"
              min="0"
              placeholder="Quantity *"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 p-3"
            />

            <input
              type="number"
              min="0"
              placeholder="Price *"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 p-3"
            />

            <input
              type="number"
              min="0"
              placeholder="Discount (%)"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="mb-3 w-full rounded-md border border-gray-300 p-3"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 p-3"
            >
              <option value="Hard Drink">Hard Drink</option>
              <option value="Soft Drink">Soft Drink</option>
            </select>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
            >
              Add Product & Generate Barcode
            </button>

            <Link
              to="/products"
              className="mt-4 block text-center text-sm text-blue-500 hover:underline"
            >
              View All Products
            </Link>
          </form>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              🏷️ Product Barcode
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Every new product automatically receives a unique CODE-128 barcode.
            </p>

            {createdBarcode ? (
              <Barcode value={createdBarcode} productName={createdProductName || "New Product"} />
            ) : (
              <div className="flex min-h-[180px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-400">
                Your generated barcode will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProduct;

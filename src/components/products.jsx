import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "./navbar";
import { useLocation } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [edited, setEdited] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selling, setSelling] = useState(null);
  const [quantityToSell, setQuantityToSell] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      setTimeout(() => setErrorMessage(""), 4000); // Clear after 4s
    }
  }, [location.state]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(items);
    });

    return () => unsub();
  }, []);

  const handleInputChange = (id, field, value) => {
    setEdited((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const saveChanges = async (id) => {
    if (!edited[id]) return;
    await updateDoc(doc(db, "products", id), {
      ...edited[id],
      quantity: Number(edited[id].quantity),
      price: Number(edited[id].price),
    });
    setEdited((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const updateField = (id, field, type) => {
    const product = edited[id] || products.find((p) => p.id === id);
    const step = field === "price" ? 50 : 1;
    let value =
      type === "inc"
        ? Number(product[field]) + step
        : Number(product[field]) - step;
    if (value < 0) value = 0;
    handleInputChange(id, field, value);
  };

  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
  };

  const markAsSold = (product) => {
    setSelling(product);
    setQuantityToSell("");
  };

  const confirmSale = async () => {
    const qty = Number(quantityToSell);
    if (!qty || qty <= 0 || qty > selling.quantity) {
      alert("Invalid quantity.");
      return;
    }

    const newQty = selling.quantity - qty;

    await updateDoc(doc(db, "products", selling.id), { quantity: newQty });

    await addDoc(collection(db, "sales"), {
      productId: selling.id,
      name: selling.name,
      quantitySold: qty,
      timestamp: new Date(),
    });

    setSelling(null);
  };

  const filteredProducts = products.filter((p) => {
    const productCategory = p.category?.toLowerCase() || "uncategorized";
    const matchesCategory = filter === "all" || productCategory === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mx-4 my-2 text-center">
          {errorMessage}
        </div>
      )}
      <div className="p-4 sm:p-6 mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full md:max-w-xs"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full md:max-w-xs"
          >
            <option value="all">All</option>
            <option value="hot drink">Hot Drink</option>
            <option value="soft drink">Soft Drink</option>
          </select>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((p) => {
            const isEdited = edited[p.id] || {};
            const currentQty = isEdited.quantity ?? p.quantity;
            const currentPrice = isEdited.price ?? p.price;

            return (
              <div
                key={p.id}
                className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-2"
              >
                <h3 className="text-lg font-bold">{p.name}</h3>

                <div className="text-sm text-gray-500">Quantity</div>
                <input
                  type="number"
                  value={currentQty}
                  onChange={(e) =>
                    handleInputChange(p.id, "quantity", e.target.value)
                  }
                  className="border p-1 rounded w-full"
                />

                <div className="text-sm text-gray-500">Price (₦)</div>
                <input
                  type="number"
                  value={currentPrice}
                  onChange={(e) =>
                    handleInputChange(p.id, "price", e.target.value)
                  }
                  className="border p-1 rounded w-full"
                />

                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => updateField(p.id, "quantity", "inc")}
                    className="flex-1 bg-green-500 text-white py-1 rounded"
                  >
                    +Qty
                  </button>
                  <button
                    onClick={() => updateField(p.id, "quantity", "dec")}
                    className="flex-1 bg-yellow-500 text-white py-1 rounded"
                  >
                    -Qty
                  </button>
                  <button
                    onClick={() => updateField(p.id, "price", "inc")}
                    className="flex-1 bg-green-700 text-white py-1 rounded"
                  >
                    +₦50
                  </button>
                  <button
                    onClick={() => updateField(p.id, "price", "dec")}
                    className="flex-1 bg-yellow-700 text-white py-1 rounded"
                  >
                    -₦50
                  </button>
                </div>

                {edited[p.id] && (
                  <button
                    onClick={() => saveChanges(p.id)}
                    className="mt-2 bg-blue-500 text-white w-full py-1 rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                )}

                <button
                  onClick={() => markAsSold(p)}
                  className="bg-indigo-600 text-white w-full py-1 rounded hover:bg-indigo-700"
                >
                  Mark as Sold
                </button>

                {/* DELETE button - consider hiding for non-admins if needed */}
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="bg-red-600 text-white w-full py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {selling && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h3 className="text-xl font-bold mb-4">Selling: {selling.name}</h3>
            <input
              type="number"
              value={quantityToSell}
              onChange={(e) => setQuantityToSell(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Quantity sold"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmSale}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setSelling(null)}
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

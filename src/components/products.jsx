// Final working version of Products.jsx with inline editing, edit tracking, and toast notifications
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
import toast from "react-hot-toast";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState({});
  const [drafts, setDrafts] = useState({});
  const [savedIds, setSavedIds] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selling, setSelling] = useState(null);
  const [quantityToSell, setQuantityToSell] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      setTimeout(() => setErrorMessage(""), 4000);
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

  const startEdit = (id, field) => {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [field]: true } }));
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: products.find((p) => p.id === id)[field],
      },
    }));
  };

  const finishEdit = async (id, field) => {
    const newValue = Number(drafts[id][field]);
    await updateDoc(doc(db, "products", id), { [field]: newValue });
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [field]: false } }));
    setSavedIds((prev) => [...prev, `${id}-${field}`]);
    toast.success(`✅ ${field} updated`);
    setTimeout(() => {
      setSavedIds((prev) => prev.filter((key) => key !== `${id}-${field}`));
    }, 3000);
  };

  const updateField = (id, field, type) => {
    const product = products.find((p) => p.id === id);
    const step = field === "price" ? 50 : 1;
    let value = type === "inc" ? Number(product[field]) + step : Number(product[field]) - step;
    if (value < 0) value = 0;
    updateDoc(doc(db, "products", id), { [field]: value });
    toast.success(`✅ ${field} updated`);
  };

  const deleteProduct = async (id) => {
    const isAdmin = true; // Later: Replace with auth logic
    if (!isAdmin) return toast.error("Only admin can delete");
    await deleteDoc(doc(db, "products", id));
    toast.success("🗑 Product deleted");
  };

  const markAsSold = (product) => {
    setSelling(product);
    setQuantityToSell("");
  };

  const confirmSale = async () => {
    const qty = Number(quantityToSell);
    if (!qty || qty <= 0 || qty > selling.quantity) {
      toast.error("❌ Invalid quantity");
      return;
    }

    const newQty = selling.quantity - qty;

    await updateDoc(doc(db, "products", selling.id), {
      quantity: newQty,
    });

    await addDoc(collection(db, "sales"), {
      productId: selling.id,
      name: selling.name,
      quantitySold: qty,
      price: selling.price,
      amount: selling.price * qty,
      timestamp: new Date(),
    });

    setSelling(null);
    toast.success("✅ Sale recorded");
  };

  const filteredProducts = products.filter((p) => {
    const category = p.category?.toLowerCase() || "uncategorized";
    return (filter === "all" || category === filter) &&
           p.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {errorMessage && (
        <div className="bg-red-100 border text-red-700 px-4 py-2 rounded mx-4 my-2 text-center">
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
            <option value="hot drink">Hard Drink</option>
            <option value="soft drink">Soft Drink</option>
          </select>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">{p.name}</h3>

              <div>
                Quantity: {editing[p.id]?.quantity ? (
                  <input
                    type="number"
                    value={drafts[p.id]?.quantity || ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [p.id]: { ...d[p.id], quantity: e.target.value },
                      }))
                    }
                    onBlur={() => finishEdit(p.id, "quantity")}
                    className="border p-1 w-20"
                  />
                ) : (
                  <span
                    onClick={() => startEdit(p.id, "quantity")}
                    className="cursor-pointer hover:underline"
                  >
                    {p.quantity}
                  </span>
                )}
                {savedIds.includes(`${p.id}-quantity`) && <span className="text-green-600 ml-2">✅</span>}
              </div>

              <div>
                Price (₦): {editing[p.id]?.price ? (
                  <input
                    type="number"
                    value={drafts[p.id]?.price || ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [p.id]: { ...d[p.id], price: e.target.value },
                      }))
                    }
                    onBlur={() => finishEdit(p.id, "price")}
                    className="border p-1 w-20"
                  />
                ) : (
                  <span
                    onClick={() => startEdit(p.id, "price")}
                    className="cursor-pointer hover:underline"
                  >
                    {p.price}
                  </span>
                )}
                {savedIds.includes(`${p.id}-price`) && <span className="text-green-600 ml-2">✅</span>}
              </div>

              <div className="flex gap-1 mt-2">
                <button onClick={() => updateField(p.id, "quantity", "inc")} className="flex-1 bg-green-500 text-white py-1 rounded">+Qty</button>
                <button onClick={() => updateField(p.id, "quantity", "dec")} className="flex-1 bg-yellow-500 text-white py-1 rounded">-Qty</button>
                <button onClick={() => updateField(p.id, "price", "inc")} className="flex-1 bg-green-700 text-white py-1 rounded">+₦50</button>
                <button onClick={() => updateField(p.id, "price", "dec")} className="flex-1 bg-yellow-700 text-white py-1 rounded">-₦50</button>
              </div>

              <button onClick={() => markAsSold(p)} className="bg-indigo-600 text-white w-full py-1 mt-2 rounded hover:bg-indigo-700">Mark as Sold</button>
              <button onClick={() => deleteProduct(p.id)} className="bg-red-600 text-white w-full py-1 mt-1 rounded hover:bg-red-700">Delete</button>
            </div>
          ))}
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
              <button onClick={confirmSale} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Confirm</button>
              <button onClick={() => setSelling(null)} className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
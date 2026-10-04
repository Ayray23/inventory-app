import React, { useCallback, useEffect, useState } from "react";
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
import { Barcode as BarcodeIcon, PackagePlus, ScanLine } from "lucide-react";
import Barcode from "./Barcode";
import BarcodeScanner from "./BarcodeScanner";

const createBarcode = (id) => `INV-${id.toUpperCase()}`;

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
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState("1");
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      setTimeout(() => setErrorMessage(""), 4000);
    }
  }, [location.state]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map((productDoc) => ({
        id: productDoc.id,
        ...productDoc.data(),
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
        [field]: products.find((p) => p.id === id)?.[field],
      },
    }));
  };

  const finishEdit = async (id, field) => {
    const newValue = Number(drafts[id][field]);
    if (Number.isNaN(newValue) || newValue < 0) {
      toast.error("Enter a valid value");
      return;
    }

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
    let value =
      type === "inc"
        ? Number(product[field]) + step
        : Number(product[field]) - step;

    if (value < 0) value = 0;
    updateDoc(doc(db, "products", id), { [field]: value });
    toast.success(`✅ ${field} updated`);
  };

  const deleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("🗑 Product deleted");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete product");
    }
  };

  const generateBarcode = async (product) => {
    try {
      const barcode = product.barcode || createBarcode(product.id);
      await updateDoc(doc(db, "products", product.id), { barcode });
      toast.success("🏷️ Barcode generated");
      setBarcodeProduct({ ...product, barcode });
    } catch (err) {
      console.error(err);
      toast.error("Could not generate barcode");
    }
  };

  const handleScan = useCallback(
    (decodedBarcode) => {
      setShowScanner(false);

      const product = products.find(
        (item) => item.barcode?.toString() === decodedBarcode.toString()
      );

      if (!product) {
        toast.error(
          `No product found for barcode "${decodedBarcode}". Generate a barcode for the product first.`
        );
        return;
      }

      setScannedProduct(product);
      setRestockQuantity("1");
    },
    [products]
  );

  const confirmRestock = async () => {
    const qty = Number(restockQuantity);

    if (!scannedProduct || !Number.isInteger(qty) || qty <= 0) {
      toast.error("Enter a valid whole-number quantity");
      return;
    }

    try {
      await updateDoc(doc(db, "products", scannedProduct.id), {
        quantity: Number(scannedProduct.quantity || 0) + qty,
      });

      toast.success(`✅ Added ${qty} unit${qty === 1 ? "" : "s"} to ${scannedProduct.name}`);
      setScannedProduct(null);
    } catch (err) {
      console.error(err);
      toast.error("Could not update inventory");
    }
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
    return (
      (filter === "all" || category === filter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 pt-8">
      <Navbar />

      {errorMessage && (
        <div className="mx-4 my-2 rounded border bg-red-100 px-4 py-2 text-center text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-10 p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-gray-300 p-2 md:max-w-xs"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded border border-gray-300 p-2 md:max-w-xs"
          >
            <option value="all">All</option>
            <option value="hard drink">Hard Drink</option>
            <option value="soft drink">Soft Drink</option>
          </select>

          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow hover:bg-blue-700"
          >
            <ScanLine size={19} />
            Scan & Add Stock
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-blue-900">
                <PackagePlus size={20} />
                Fast inventory restocking
              </h2>
              <p className="text-sm text-blue-700">
                Scan a product barcode, enter the quantity received, and the stock updates automatically.
              </p>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Open Scanner
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <div key={p.id} className="rounded-lg bg-white p-4 shadow-md">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <BarcodeIcon size={19} className="shrink-0 text-blue-600" />
              </div>

              <div>
                Quantity:{" "}
                {editing[p.id]?.quantity ? (
                  <input
                    type="number"
                    value={drafts[p.id]?.quantity ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [p.id]: { ...d[p.id], quantity: e.target.value },
                      }))
                    }
                    onBlur={() => finishEdit(p.id, "quantity")}
                    className="w-20 border p-1"
                  />
                ) : (
                  <span
                    onClick={() => startEdit(p.id, "quantity")}
                    className="cursor-pointer hover:underline"
                  >
                    {p.quantity}
                  </span>
                )}
                {savedIds.includes(`${p.id}-quantity`) && (
                  <span className="ml-2 text-green-600">✅</span>
                )}
              </div>

              <div>
                Price (₦):{" "}
                {editing[p.id]?.price ? (
                  <input
                    type="number"
                    value={drafts[p.id]?.price ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [p.id]: { ...d[p.id], price: e.target.value },
                      }))
                    }
                    onBlur={() => finishEdit(p.id, "price")}
                    className="w-20 border p-1"
                  />
                ) : (
                  <span
                    onClick={() => startEdit(p.id, "price")}
                    className="cursor-pointer hover:underline"
                  >
                    {p.price}
                  </span>
                )}
                {savedIds.includes(`${p.id}-price`) && (
                  <span className="ml-2 text-green-600">✅</span>
                )}
              </div>

              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => updateField(p.id, "quantity", "inc")}
                  className="flex-1 rounded bg-green-500 py-1 text-white"
                >
                  +Qty
                </button>
                <button
                  onClick={() => updateField(p.id, "quantity", "dec")}
                  className="flex-1 rounded bg-yellow-500 py-1 text-white"
                >
                  -Qty
                </button>
                <button
                  onClick={() => updateField(p.id, "price", "inc")}
                  className="flex-1 rounded bg-green-700 py-1 text-white"
                >
                  +₦50
                </button>
                <button
                  onClick={() => updateField(p.id, "price", "dec")}
                  className="flex-1 rounded bg-yellow-700 py-1 text-white"
                >
                  -₦50
                </button>
              </div>

              <button
                onClick={() => markAsSold(p)}
                className="mt-2 w-full rounded bg-indigo-600 py-1 text-white hover:bg-indigo-700"
              >
                Mark as Sold
              </button>

              <button
                onClick={() => deleteProduct(p.id)}
                className="mt-1 w-full rounded bg-red-600 py-1 text-white hover:bg-red-700"
              >
                Delete
              </button>

              {p.barcode ? (
                <button
                  onClick={() => setBarcodeProduct(p)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  <BarcodeIcon size={17} />
                  View Barcode
                </button>
              ) : (
                <button
                  onClick={() => generateBarcode(p)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-purple-200 bg-purple-50 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  <BarcodeIcon size={17} />
                  Generate Barcode
                </button>
              )}
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow">
            No products found.
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {scannedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Restock Product</h3>
            <p className="mt-1 text-gray-500">{scannedProduct.name}</p>

            <div className="my-5 rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-sm text-blue-700">Current stock</p>
              <p className="text-3xl font-bold text-blue-900">
                {scannedProduct.quantity}
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantity received
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-gray-300 p-3"
            />

            <div className="mt-5 flex gap-2">
              <button
                onClick={confirmRestock}
                className="flex-1 rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
              >
                Add to Inventory
              </button>
              <button
                onClick={() => setScannedProduct(null)}
                className="rounded-lg bg-gray-200 px-4 py-3 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {barcodeProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Product Barcode</h3>
                <p className="text-sm text-gray-500">{barcodeProduct.name}</p>
              </div>
              <button
                onClick={() => setBarcodeProduct(null)}
                className="rounded-lg bg-gray-100 px-3 py-2 text-gray-600 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            <Barcode
              value={barcodeProduct.barcode}
              productName={barcodeProduct.name}
            />

            <p className="mt-3 text-center text-xs text-gray-500">
              Barcode: {barcodeProduct.barcode}
            </p>
          </div>
        </div>
      )}

      {selling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-80 rounded bg-white p-6 shadow-md">
            <h3 className="mb-4 text-xl font-bold">Selling: {selling.name}</h3>
            <input
              type="number"
              value={quantityToSell}
              onChange={(e) => setQuantityToSell(e.target.value)}
              className="mb-4 w-full rounded border border-gray-300 p-2"
              placeholder="Quantity sold"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmSale}
                className="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setSelling(null)}
                className="flex-1 rounded bg-gray-400 py-2 text-white hover:bg-gray-500"
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

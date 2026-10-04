import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where, runTransaction, serverTimestamp, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import Navbar from "./navbar";
import BarcodeScanner from "./BarcodeScanner";
import { Search, ScanLine, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingCart, Printer, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const inputRef = useRef(null);

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { loadProducts(); setTimeout(() => inputRef.current?.focus(), 300); }, []);

  const findProduct = async (code) => {
    const clean = code.trim();
    if (!clean) return null;
    const local = products.find((p) => p.barcode === clean || p.sku === clean);
    if (local) return local;
    const snap = await getDocs(query(collection(db, "products"), where("barcode", "==", clean)));
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    const skuSnap = await getDocs(query(collection(db, "products"), where("sku", "==", clean)));
    return skuSnap.empty ? null : { id: skuSnap.docs[0].id, ...skuSnap.docs[0].data() };
  };

  const addToCart = async (product) => {
    if (!product) { toast.error("Product not found"); return; }
    if (Number(product.quantity || 0) <= 0) { toast.error("This product is out of stock"); return; }
    setCart((current) => {
      const existing = current.find((x) => x.id === product.id);
      if (existing) {
        if (existing.qty >= Number(product.quantity)) return current;
        return current.map((x) => x.id === product.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...current, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} added`);
  };

  const handleBarcode = async (e) => {
    e?.preventDefault();
    const product = await findProduct(barcode);
    await addToCart(product);
    setBarcode("");
    inputRef.current?.focus();
  };

  const changeQty = (id, delta) => setCart((c) => c.map((item) => {
    if (item.id !== id) return item;
    const next = item.qty + delta;
    if (next < 1) return item;
    if (next > Number(item.quantity)) { toast.error("Not enough stock"); return item; }
    return { ...item, qty: next };
  }));

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const paid = Number(amountPaid || 0);
  const change = Math.max(0, paid - total);

  const checkout = async () => {
    if (!cart.length) return toast.error("Cart is empty");
    if (paymentMethod === "Cash" && paid < total) return toast.error("Amount paid is less than total");
    try {
      const receiptNo = `POS-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Date.now().toString().slice(-6)}`;
      await runTransaction(db, async (tx) => {
        const refs = cart.map((item) => ({ item, ref: doc(db, "products", item.id) }));
        const snapshots = await Promise.all(refs.map(({ ref }) => tx.get(ref)));
        snapshots.forEach((snap, index) => {
          const item = refs[index].item;
          if (!snap.exists()) throw new Error(`${item.name} no longer exists`);
          const stock = Number(snap.data().quantity || 0);
          if (stock < item.qty) throw new Error(`Insufficient stock for ${item.name}`);
        });
        snapshots.forEach((snap, index) => {
          const item = refs[index].item;
          tx.update(refs[index].ref, { quantity: Number(snap.data().quantity || 0) - item.qty });
        });
        const saleRef = doc(collection(db, "sales"));
        tx.set(saleRef, {
          receiptNo,
          items: cart.map((item) => ({ productId: item.id, name: item.name, barcode: item.barcode || "", sku: item.sku || "", quantity: item.qty, price: Number(item.price || 0), total: Number(item.price || 0) * item.qty })),
          name: cart.length === 1 ? cart[0].name : `${cart.length} items`,
          quantitySold: cart.reduce((s, i) => s + i.qty, 0),
          amount: total,
          subtotal,
          discount: Number(discount || 0),
          amountPaid: paid,
          change,
          paymentMethod,
          cashier: auth.currentUser?.email || "Cashier",
          timestamp: serverTimestamp()
        });
      });
      setReceipt({ receiptNo, items: [...cart], subtotal, discount: Number(discount || 0), total, amountPaid: paid, change, paymentMethod, cashier: auth.currentUser?.email || "Cashier", date: new Date() });
      setCart([]); setAmountPaid(""); setDiscount(0); await loadProducts();
      toast.success("Sale completed");
    } catch (err) { toast.error(err.message || "Checkout failed"); }
  };

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.sku?.includes(search)).slice(0, 20);

  return <><Navbar /><div className="min-h-screen bg-slate-100 pt-20 p-3 sm:p-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-black text-slate-900">Point of Sale</h1><p className="text-sm text-slate-500">Scan products, take payment and print a receipt.</p></div>
        <button onClick={() => { setCart([]); setAmountPaid(""); setDiscount(0); }} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold shadow"><RotateCcw size={17}/> New Sale</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_390px]">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <form onSubmit={handleBarcode} className="flex gap-2">
            <div className="relative flex-1"><ScanLine className="absolute left-3 top-3 text-slate-400" size={20}/><input ref={inputRef} value={barcode} onChange={(e)=>setBarcode(e.target.value)} placeholder="Scan barcode / enter SKU and press Enter" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 outline-none focus:border-blue-500"/></div>
            <button className="rounded-xl bg-blue-600 px-5 font-bold text-white">Add</button>
            <button type="button" onClick={()=>setShowScanner(true)} className="rounded-xl border border-slate-200 px-4 font-semibold"><ScanLine size={19}/></button>
          </form>
          <div className="mt-4 flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search product..." className="w-full rounded-lg border p-2 pl-9"/></div></div>
          {search && <div className="mt-2 grid gap-2 sm:grid-cols-2">{filtered.map(p=><button key={p.id} onClick={()=>addToCart(p)} className="flex items-center justify-between rounded-xl border p-3 text-left hover:bg-blue-50"><span><b>{p.name}</b><small className="block text-slate-500">{p.barcode || p.sku || "No code"} · Stock {p.quantity}</small></span><Plus size={18}/></button>)}</div>}
          <div className="mt-6 border-t pt-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Current Cart</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{cart.reduce((s,i)=>s+i.qty,0)} items</span></div>
            {!cart.length ? <div className="rounded-xl border-2 border-dashed p-12 text-center text-slate-400"><ShoppingCart className="mx-auto mb-2" size={36}/><p>Scan a product to start the sale.</p></div> :
            <div className="space-y-2">{cart.map(item=><div key={item.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><b className="block truncate">{item.name}</b><span className="text-sm text-slate-500">{money(item.price)} each</span></div><div className="flex items-center gap-2"><button onClick={()=>changeQty(item.id,-1)} className="rounded-lg bg-slate-100 p-2"><Minus size={15}/></button><b className="w-7 text-center">{item.qty}</b><button onClick={()=>changeQty(item.id,1)} className="rounded-lg bg-slate-100 p-2"><Plus size={15}/></button></div><b className="w-24 text-right">{money(item.price*item.qty)}</b><button onClick={()=>setCart(c=>c.filter(x=>x.id!==item.id))} className="text-red-500"><Trash2 size={18}/></button></div>)}</div>}
          </div>
        </section>
        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-4 text-lg font-bold">Payment</h2>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="flex justify-between"><span>Discount</span><input type="number" min="0" value={discount} onChange={(e)=>setDiscount(e.target.value)} className="w-28 rounded border p-1 text-right"/></div><div className="flex justify-between border-t pt-3 text-xl"><b>Total</b><b>{money(total)}</b></div></div>
          <div className="mt-5 grid grid-cols-3 gap-2">{[["Cash",Banknote],["Card",CreditCard],["Transfer",Smartphone]].map(([label,Icon])=><button key={label} onClick={()=>setPaymentMethod(label)} className={`rounded-xl border p-3 text-center ${paymentMethod===label?"border-blue-600 bg-blue-50 text-blue-700":"border-slate-200"}`}><Icon className="mx-auto" size={19}/><span className="mt-1 block text-xs font-semibold">{label}</span></button>)}</div>
          <input type="number" min="0" value={amountPaid} onChange={(e)=>setAmountPaid(e.target.value)} placeholder="Amount received" className="mt-4 w-full rounded-xl border p-3"/>
          <div className="mt-3 rounded-xl bg-slate-900 p-4 text-white"><div className="flex justify-between text-sm"><span>Change</span><b>{money(change)}</b></div></div>
          <button onClick={checkout} className="mt-4 w-full rounded-xl bg-green-600 py-4 text-lg font-black text-white hover:bg-green-700">Complete Sale</button>
        </aside>
      </div>
    </div>
  </div>
  {showScanner && <BarcodeScanner onScan={async(code)=>{setShowScanner(false); const p=await findProduct(code); await addToCart(p);}} onClose={()=>setShowScanner(false)}/>}
  {receipt && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div id="receipt-print" className="bg-white text-slate-900"><div className="text-center"><h2 className="text-xl font-black">INVENTORY STORE</h2><p className="text-xs">Sales Receipt</p><p className="mt-1 text-xs">{receipt.receiptNo}</p></div><div className="my-4 border-y py-3 text-sm">{receipt.items.map((i,idx)=><div key={idx} className="mb-2 flex justify-between gap-3"><span>{i.name} × {i.qty}</span><b>{money(i.price*i.qty)}</b></div>)}<div className="mt-3 border-t pt-2"><div className="flex justify-between"><span>Subtotal</span><span>{money(receipt.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span>{money(receipt.discount)}</span></div><div className="flex justify-between text-lg font-black"><span>Total</span><span>{money(receipt.total)}</span></div><div className="flex justify-between"><span>Paid</span><span>{money(receipt.amountPaid)}</span></div><div className="flex justify-between"><span>Change</span><span>{money(receipt.change)}</span></div></div></div><p className="text-center text-xs text-slate-500">{receipt.paymentMethod} · {receipt.cashier}</p><p className="mt-2 text-center text-xs">Thank you for your patronage.</p></div><div className="mt-5 flex gap-2"><button onClick={()=>window.print()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-white"><Printer size={18}/> Print</button><button onClick={()=>setReceipt(null)} className="rounded-xl bg-slate-200 px-5 font-semibold">Close</button></div></div></div>}
</>;
};
export default POS;
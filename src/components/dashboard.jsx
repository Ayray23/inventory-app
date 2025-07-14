import React, { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom"; 
 import Navbar from "./navbar";
  import { collection, getDocs, query, orderBy } from "firebase/firestore"; 
  import { db } from "../firebase"; import dayjs from "dayjs";

const Dashboard = () => { 
  const navigate = useNavigate(); 
  const [sales, setSales] = useState([]);
   const [products, setProducts] = useState([]);

useEffect(() => { 
  const fetchData = async () => {
     const salesSnap = await getDocs(query(collection(db, "sales"), 
     orderBy("timestamp", "desc")));
      const productSnap = await 
      getDocs(collection(db, "products"));

setSales(salesSnap.docs.map(doc => doc.data()));
  setProducts(productSnap.docs.map(doc => doc.data()));
};

fetchData();

}, []);

const today = dayjs().startOf("day");
 const todaySales = sales.filter(s => dayjs(s.timestamp?.toDate?.()).isAfter(today));

const totalSalesToday = todaySales.length;
 const revenueToday = todaySales.reduce((sum, s) => sum + (s.amount || 0), 0); 
 const totalProducts = products.length; const lowStockCount = products.filter(p => p.quantity <= 5).length;

const recentSales = sales.slice(0, 5);

const cards = [ { 
  title: "➕ Add Product", 
  description: "Add a new product to inventory",
   action: () => navigate("/add"), 
   color: "bg-green-100 text-green-800", },
    { title: "📦 View Products", 
    description: "View and manage product inventory", 
    action: () => navigate("/products"), 
    color: "bg-blue-100 text-blue-800", }, 
    { title: "📈 Sales Report", 
    description: "See sold items and revenue", 
    action: () => navigate("/sales-history"), 
    color: "bg-purple-100 text-purple-800", }, 
    { title: "📊 Sales Chart", 
    description: "Visual sales data (weekly)",
     action: () => navigate("/sales-chart"),
      color: "bg-yellow-100 text-yellow-800", }, ];

return ( 
<> <Navbar />
 <div className="pt-24 px-4 sm:px-10">
   <h1 className="text-2xl font-bold mb-6">
    Welcome to Your Dashboard
    </h1>

{/* Quick Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <p className="text-sm text-gray-500">Today’s Sales</p>
        <p className="text-xl font-bold">{totalSalesToday}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <p className="text-sm text-gray-500">Revenue Today</p>
        <p className="text-xl font-bold">₦{revenueToday.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <p className="text-sm text-gray-500">Total Products</p>
        <p className="text-xl font-bold">{totalProducts}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <p className="text-sm text-gray-500">Low Stock</p>
        <p className="text-xl font-bold text-red-600">{lowStockCount}</p>
      </div>
    </div>

    {/* Action Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`rounded-xl shadow p-6 cursor-pointer transition hover:scale-[1.02] ${card.color}`}
          onClick={card.action}
        >
          <h2 className="text-xl font-semibold">{card.title}</h2>
          <p className="text-sm mt-2">{card.description}</p>
        </div>
      ))}
    </div>

    {/* Recent Sales */}
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">🧾 Recent Sales</h2>
      {recentSales.length === 0 ? (
        <p className="text-gray-500">No sales yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">Qty</th>
              <th className="text-left py-2">Amount (₦)</th>
              <th className="text-left py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-2">{sale.name}</td>
                <td className="py-2">{sale.quantitySold}</td>
                <td className="py-2">{sale.amount?.toLocaleString() || 0}</td>
                <td className="py-2">{dayjs(sale.timestamp?.toDate?.()).format("DD MMM, HH:mm")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
</>

); };

export default Dashboard;
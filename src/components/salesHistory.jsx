// components/SalesHistory.jsx
 import React, { useEffect, useState } from "react"; 
 import { db } from "../firebase"; import { collection, onSnapshot, orderBy, query, } from "firebase/firestore";
  import Navbar from "./navbar";
   import * as XLSX from "xlsx"; 
   import { saveAs } from "file-saver";
    import { Link } from "react-router-dom";

const SalesHistory = () => { const [sales, setSales] = useState([]); const [filteredSales, setFilteredSales] = useState([]); const [selectedDate, setSelectedDate] = useState(""); const [selectedCategory, setSelectedCategory] = useState("all"); const [currentPage, setCurrentPage] = useState(1); const itemsPerPage = 10;

useEffect(() => { const q = query(collection(db, "sales"), orderBy("timestamp", "desc")); const unsub = onSnapshot(q, (snapshot) => { const salesData = snapshot.docs.map((doc) => { const data = doc.data(); const amount = data.amount ?? (data.price && data.quantitySold ? data.price * data.quantitySold : 0); return { id: doc.id, ...data, amount }; }); setSales(salesData); setFilteredSales(salesData); }); return () => unsub(); }, []);

const formatDate = (timestamp) => { if (!timestamp) return ""; if (timestamp.toDate) return timestamp.toDate().toLocaleString(); if (typeof timestamp === "number") return new Date(timestamp).toLocaleString(); return ""; };

const handleDateChange = (e) => { const selected = e.target.value; setSelectedDate(selected); filterSales(selected, selectedCategory); };

const handleCategoryChange = (e) => { const selected = e.target.value; setSelectedCategory(selected); filterSales(selectedDate, selected); };

const filterSales = (date, category) => { let filtered = sales;

if (date) {
  const selectedDateObj = new Date(date);
  const nextDay = new Date(selectedDateObj);
  nextDay.setDate(selectedDateObj.getDate() + 1);

  filtered = filtered.filter((sale) => {
    if (!sale.timestamp) return false;
    const saleDate = sale.timestamp.toDate();
    return saleDate >= selectedDateObj && saleDate < nextDay;
  });
}

if (category !== "all") {
  filtered = filtered.filter((sale) => sale.category?.toLowerCase() === category);
}

setFilteredSales(filtered);
setCurrentPage(1);

};

const exportToCSV = () => { 
  const headers = ["Product", "Quantity", "Amount", "Date"]; 
  const rows = filteredSales.map((sale) => [ 
    sale.name, sale.quantitySold, sale.amount,
     formatDate(sale.timestamp), ]);
      const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n"); 
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" }); 
      saveAs(blob, `sales_history_${Date.now()}.csv`); };

const exportToExcel = () => {
   const dataToExport = filteredSales.map((sale) => ({ Product: sale.name,
     Quantity: sale.quantitySold, Amount: sale.amount || 0, 
     Date: formatDate(sale.timestamp), }));
      const ws = XLSX.utils.json_to_sheet(dataToExport); 
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Sales"); 
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
       const fileData = new Blob([excelBuffer], { type: "application/octet-stream" }); 
       saveAs(fileData, `sales_history_${Date.now()}.xlsx`); };

const totalQty = filteredSales.reduce((sum, sale) => sum + Number(sale.quantitySold || 0), 0); 
const totalAmount = filteredSales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);

const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage); const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

return ( <> <Navbar /> <div className="pt-20 px-4 sm:px-6"> <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6"> <h1 className="text-2xl font-bold text-blue-700">📦 View Products</h1> <Link to="/dashboard" className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl shadow"> Back to Dashboard </Link> </div>

<div className="bg-gray-100 rounded-lg p-4 md:p-6 shadow">
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🧾 Sales History</h2>
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-auto"
          />
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="hot drink">Hot Drink</option>
            <option value="soft drink">Soft Drink</option>
            <option value="cement">Cement</option>
          </select>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Export Excel
          </button>
          <button onClick={exportToCSV} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Export CSV
          </button>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <p className="text-center text-gray-500 mt-6">No sales found.</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
            <thead className="bg-blue-100 text-gray-600 uppercase">
              <tr>
                <th className="py-2 px-4 text-left">Product</th>
                <th className="py-2 px-4 text-left">Quantity</th>
                <th className="py-2 px-4 text-left">Amount (₦)</th>
                <th className="py-2 px-4 text-left">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="border-t border-gray-200">
                  <td className="py-2 px-4">{sale.name}</td>
                  <td className="py-2 px-4">{sale.quantitySold}</td>
                  <td className="py-2 px-4">₦{Number(sale.amount).toLocaleString()}</td>
                  <td className="py-2 px-4">{formatDate(sale.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-between flex-wrap items-center gap-4 text-sm text-gray-700">
            <div>Total Quantity Sold: {totalQty}</div>
            <div>Total Amount Made: ₦{totalAmount.toLocaleString()}</div>
          </div>

          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded border ${
                  currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
</>

); };

export default SalesHistory;
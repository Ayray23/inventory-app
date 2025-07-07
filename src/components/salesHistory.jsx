import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Navbar from "./navbar";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(salesData);
      setFilteredSales(salesData);
    });
    return () => unsub();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
  
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    } else if (typeof timestamp === "number") {
      return new Date(timestamp).toLocaleString();
    }
  
    return "";
  };
  

  const handleDateChange = (e) => {
    const selected = e.target.value;
    setSelectedDate(selected);

    if (!selected) {
      setFilteredSales(sales);
      return;
    }

    const selectedDateObj = new Date(selected);
    const nextDay = new Date(selectedDateObj);
    nextDay.setDate(selectedDateObj.getDate() + 1);

    const filtered = sales.filter((sale) => {
      if (!sale.timestamp) return false;
      const saleDate = sale.timestamp.toDate();
      return saleDate >= selectedDateObj && saleDate < nextDay;
    });

    setFilteredSales(filtered);
  };
  const exportToCSV = () => {
    const headers = ["Product", "Quantity", "Date"];
    const rows = filteredSales.map((sale) => [
      sale.name,
      sale.quantitySold,
      sale.timestamp?.toDate?.().toLocaleString() || ""
    ]);
  
    const csvContent =
      [headers, ...rows].map((e) => e.join(",")).join("\n");
  
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
  
    saveAs(blob, `sales_history_${Date.now()}.csv`);
  };
  


  const exportToExcel = () => {
    const dataToExport = filteredSales.map((sale) => {
      const ts = sale.timestamp;
  
      let dateStr = "";
      if (ts?.toDate) {
        // Firestore Timestamp object
        dateStr = ts.toDate().toLocaleString();
      } else if (typeof ts === "number") {
        // Raw timestamp in milliseconds
        dateStr = new Date(ts).toLocaleString();
      }
  
      return {
        Product: sale.name,
        Quantity: sale.quantitySold,
        Date: dateStr
      };
    });
  
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
  
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array"
    });
    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream"
    });
  
    saveAs(fileData, `sales_history_${Date.now()}.xlsx`);
  };
  

  return (
    <>
      <Navbar />
      <div className="min-h-screen mt-10 bg-gray-100 p-6">
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">🧾 Sales History</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export to Excel
            </button>
            <button onClick={exportToCSV}>Export to CSV</button>

          </div>
        </div>

        {filteredSales.length === 0 ? (
          <p className="text-gray-500">No sales found.</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-blue-100 text-left text-gray-600 uppercase text-sm">
                <tr>
                  <th className="py-2 px-4">Product</th>
                  <th className="py-2 px-4">Quantity</th>
                  <th className="py-2 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-t border-gray-200">
                    <td className="py-2 px-4">{sale.name}</td>
                    <td className="py-2 px-4">{sale.quantitySold}</td>
                    <td className="py-2 px-4">{formatDate(sale.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-right font-medium text-gray-700">
              Total Quantity Sold:{" "}
              {filteredSales.reduce(
                (sum, sale) => sum + Number(sale.quantitySold || 0),
                0
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SalesHistory;

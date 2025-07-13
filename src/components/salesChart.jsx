import React, { useEffect, useState } from "react"; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from "recharts"; 
import { collection, getDocs } from "firebase/firestore";
 import { db } from "../firebase"; 
 import Navbar from "./navbar";
  import dayjs from "dayjs";

const SalesChart = () => { 
  const [dailyData, setDailyData] = useState([]); 
  const [weeklyData, setWeeklyData] = useState([]); 
  const [monthlyData, setMonthlyData] = useState([]);
   const [activeTab, setActiveTab] = useState("daily");

useEffect(() => {
   const fetchSales = async () => { 
    const snapshot = await getDocs(collection(db, "sales"));
     const sales = snapshot.docs.map((doc) => doc.data());

const daily = {};
  const weekly = {};
  const monthly = {};

  sales.forEach((sale) => {
    const date = dayjs(sale.timestamp?.toDate?.());

    const dayKey = date.format("YYYY-MM-DD");
    const weekKey = date.startOf("week").format("YYYY-[W]WW");
    const monthKey = date.format("YYYY-MM");

    const amount = sale.amount || sale.price * sale.quantitySold || 0;

    if (!daily[dayKey]) daily[dayKey] = { date: dayKey, total: 0 };
    daily[dayKey].total += amount;

    if (!weekly[weekKey]) weekly[weekKey] = { week: weekKey, total: 0 };
    weekly[weekKey].total += amount;

    if (!monthly[monthKey]) monthly[monthKey] = { month: monthKey, total: 0 };
    monthly[monthKey].total += amount;
  });

  setDailyData(Object.values(daily).sort((a, b) => dayjs(a.date).diff(dayjs(b.date))));
  setWeeklyData(Object.values(weekly).sort((a, b) => dayjs(a.week).diff(dayjs(b.week))));
  setMonthlyData(Object.values(monthly).sort((a, b) => dayjs(a.month).diff(dayjs(b.month))));
};

fetchSales();

}, []);

const renderChart = (data, label) => (
   <ResponsiveContainer width="100%" height={300}> 
   <LineChart data={data}> 
   <CartesianGrid strokeDasharray="3 3" /> 
   <XAxis dataKey={label} />
    <YAxis />
     <Tooltip formatter={(v) => `₦${v.toLocaleString()}`} />
      <Legend /> 
      <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 6 }} />
       </LineChart> 
       </ResponsiveContainer> );

return ( <> <Navbar /> <div className="pt-24 px-6"> <h2 className="text-2xl font-bold mb-4">📊 Sales Analytics</h2>

<div className="flex gap-3 mb-4">
      <button
        onClick={() => setActiveTab("daily")}
        className={`px-4 py-2 rounded-full border ${activeTab === "daily" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600"}`}
      >
        Daily
      </button>
      <button
        onClick={() => setActiveTab("weekly")}
        className={`px-4 py-2 rounded-full border ${activeTab === "weekly" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600"}`}
      >
        Weekly
      </button>
      <button
        onClick={() => setActiveTab("monthly")}
        className={`px-4 py-2 rounded-full border ${activeTab === "monthly" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600"}`}
      >
        Monthly
      </button>
    </div>

    {activeTab === "daily" && renderChart(dailyData, "date")}
    {activeTab === "weekly" && renderChart(weeklyData, "week")}
    {activeTab === "monthly" && renderChart(monthlyData, "month")}
  </div>
</>

); };

export default SalesChart;
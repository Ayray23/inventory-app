import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AddProduct from "./components/home";
import Products from "./components/products";
import Login from "./components/login";
import Register from "./components/register";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "./components/spinner";
import SalesHistory from "./components/salesHistory";
import Dashboard from "./components/dashboard";
import SalesChart from "./components/salesChart";
import { Toaster } from "react-hot-toast";


const adminEmails = ["adebisiraymond16@gmail.com"]; // 🔒 Define admin(s)

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const isAdmin = user && adminEmails.includes(user.email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => setLoading(false), 2000);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (loading) return <Spinner />;

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      {isOffline && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm font-medium">
          ⚠️ You’re currently offline. You can still view products and mark sales,
          but changes will sync once you're back online.
        </div>
      )}

      <Routes>
        <Route path="/" element={user ? <Navigate to="/login" /> : <Login />} />

        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />

        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/login" />}
        />

        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/add"
          element={
            user ? (
              isAdmin ? (
                <AddProduct />
              ) : (
                <Navigate
                  to="/products"
                  state={{ error: "Access denied. Admins only." }}
                />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/products"
          element={user ? <Products /> : <Navigate to="/login" />}
        />

        <Route
          path="/sales-history"
          element={user ? <SalesHistory /> : <Navigate to="/login" />}
        />

        <Route
          path="/sales-chart"
          element={user ? <SalesChart /> : <Navigate to="/login" />}
        />
      </Routes>
    </>
  );
};

export default App;

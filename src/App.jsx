// App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import AddProduct from "./components/home";
import Products from "./components/products";
import Login from "./components/login";
import Register from "./components/register";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "./components/spinner";
import SalesHistory from "./components/salesHistory";

const adminEmails = ["adebisiraymond16@gmail.com"]; // 🔒 Add admin email(s) here

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && adminEmails.includes(user.email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => setLoading(false), 2000); // Show spinner briefly
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <Spinner />;

  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/products" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/products" />}
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
          path="/salesHistory"
          element={user ? <SalesHistory /> : <Navigate to="/login" />}
        />
      </Routes>
    
  );
};

export default App;

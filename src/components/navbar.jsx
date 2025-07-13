import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation(); // 👈 track current route

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Function to set active styles
  const getLinkClass = (path) =>
    location.pathname === path
      ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 pb-1"
      : "hover:text-yellow-200";

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 fixed top-0 w-full z-50 shadow-md">
      <div className="flex justify-between items-center">
        {/* Brand & Online Status */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-xl font-bold">
            📦 Inventory
          </Link>
          {!isOnline && (
            <span className="bg-red-500 text-xs px-2 py-1 rounded-full">
              Offline
            </span>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex gap-6 items-center">
          <Link to="/add" className={getLinkClass("/add")}>Add Product</Link>
          <Link to="/products" className={getLinkClass("/products")}>View Products</Link>
          <Link to="/sales-history" className={getLinkClass("/sales-history")}>View Sales</Link>
          <Link to="/dashboard" className="bg-yellow-300 text-blue-800 font-bold px-3 py-1 rounded hover:bg-yellow-400 transition">
            ⬅ Back to Dashboard
          </Link>
          <button onClick={logout} className="hover:text-yellow-200">Logout</button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="mt-4 flex flex-col gap-4 sm:hidden">
          <Link to="/add" onClick={() => setMenuOpen(false)} className={getLinkClass("/add")}>Add Product</Link>
          <Link to="/products" onClick={() => setMenuOpen(false)} className={getLinkClass("/products")}>View Products</Link>
          <Link to="/sales-history" onClick={() => setMenuOpen(false)} className={getLinkClass("/sales-history")}>View Sales</Link>
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="bg-yellow-300 text-blue-800 font-bold px-3 py-1 rounded hover:bg-yellow-400 transition text-center"
          >
            ⬅ Back to Dashboard
          </Link>
          <button onClick={() => { logout(); setMenuOpen(false); }} className="hover:text-yellow-200">Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
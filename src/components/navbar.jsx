import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Menu, X } from "lucide-react"; // requires: npm i lucide-react

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 fixed top-0 w-full z-50 shadow-md">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold">📦 Inventory</div>

        {/* Mobile menu button */}
        <div className="sm:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop menu */}
        <div className="hidden sm:flex gap-6">
          <Link to="/add" className="hover:underline">Add Product</Link>
          <Link to="/products" className="hover:underline">View Products</Link>
          <Link to="/salesHistory" className="hover:underline">Sales</Link>
          <button onClick={logout} className="hover:underline">Logout</button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="mt-4 flex flex-col gap-4 sm:hidden">
          <Link to="/add" onClick={() => setMenuOpen(false)} className="hover:underline">Add Product</Link>
          <Link to="/products" onClick={() => setMenuOpen(false)} className="hover:underline">View Products</Link>
          <Link to="/salesHistory" onClick={()=> setMenuOpen(false)} className="hover:underline">Sales</Link>
          <button onClick={() => { logout(); setMenuOpen(false); }} className="hover:underline">Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

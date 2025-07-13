import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      alert("Error creating account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">
          Register
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-3 border border-gray-300 rounded-md"
        />

        {/* Password Input */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Confirm Password Input */}
        <div className="relative mb-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
          Register
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-green-500 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
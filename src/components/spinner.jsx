import React from "react";
import "./spinner.css";

const Spinner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="sk-folding-cube">
        <div className="sk-cube1 sk-cube"></div>
        <div className="sk-cube2 sk-cube"></div>
        <div className="sk-cube4 sk-cube"></div>
        <div className="sk-cube3 sk-cube"></div>
      </div>
        <h1 className="text-2xl ">Inventory app</h1>
    </div>
  );
};

export default Spinner;

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const Barcode = ({ value, productName, className = "" }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      displayValue: true,
      text: value,
      fontSize: 14,
      height: 70,
      width: 2,
      margin: 8,
      background: "#ffffff",
      lineColor: "#111827",
    });
  }, [value]);

  if (!value) return null;

  return (
    <div className={`bg-white rounded-lg p-3 border border-gray-200 ${className}`}>
      <p className="text-xs font-semibold text-gray-500 mb-2 text-center">
        {productName || "Product Barcode"}
      </p>
      <div className="flex justify-center overflow-x-auto">
        <svg ref={svgRef} aria-label={`Barcode for ${productName || value}`} />
      </div>
    </div>
  );
};

export default Barcode;

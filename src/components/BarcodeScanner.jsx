import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, ScanLine } from "lucide-react";

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);
  const handledRef = useRef(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    handledRef.current = false;

    const scanner = new Html5Qrcode("inventory-barcode-reader");
    scannerRef.current = scanner;

    const stopScanner = async () => {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn("Scanner stop:", err);
      }
    };

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 140 },
            aspectRatio: 1.777778,
          },
          async (decodedText) => {
            if (!mountedRef.current || handledRef.current) return;
            handledRef.current = true;

            const value = String(decodedText || "").trim();
            if (!value) {
              handledRef.current = false;
              return;
            }

            await stopScanner();

            if (mountedRef.current) {
              onScan(value);
            }
          },
          () => {}
        );

        if (mountedRef.current) setStarting(false);
      } catch (err) {
        console.error("Barcode scanner error:", err);
        if (mountedRef.current) {
          setStarting(false);
          setError(
            "Camera could not start. Allow camera access and make sure the site is using HTTPS or localhost."
          );
        }
      }
    };

    startScanner();

    return () => {
      mountedRef.current = false;
      stopScanner().finally(() => {
        scanner.clear().catch(() => {});
      });
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <ScanLine className="text-blue-600" size={22} />
              Scan Product Barcode
            </h2>
            <p className="text-sm text-gray-500">
              Point the camera at the product barcode.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close scanner">
            <CameraOff size={20} />
          </button>
        </div>

        <div className="p-5">
          <div id="inventory-barcode-reader" className="min-h-[260px] overflow-hidden rounded-xl border-2 border-dashed border-blue-200 bg-gray-950" />

          {error ? (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : starting ? (
            <p className="mt-4 text-center text-sm text-gray-500">Starting camera...</p>
          ) : (
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-gray-500">
              <Camera size={16} />
              Camera is active. Align the barcode inside the box.
            </p>
          )}
        </div>

        <div className="flex justify-between gap-3 border-t bg-gray-50 px-5 py-4">
          <span className="self-center text-xs text-gray-400">Camera scanning is ready.</span>
          <button onClick={onClose} className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { Button, LoadingSpinner } from './ui';
import { Camera, X, AlertCircle } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose, onError }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const detectedCodes = useRef(new Set());

  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setError(null);

    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment', // Use back camera on mobile
          },
        },
        decoder: {
          readers: [
            'ean_reader',      // EAN-13 (most common)
            'ean_8_reader',    // EAN-8
            'upc_reader',      // UPC-A
            'upc_e_reader',    // UPC-E
            'code_128_reader', // Code 128
            'code_39_reader',  // Code 39
          ],
        },
        locate: true,
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
      },
      (err) => {
        if (err) {
          console.error('Failed to initialize scanner:', err);
          setError('Failed to access camera. Please ensure you have granted camera permissions.');
          setScanning(false);
          if (onError) onError(err);
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected(handleDetected);
  };

  const stopScanner = () => {
    if (Quagga) {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    }
    setScanning(false);
  };

  const handleDetected = (result) => {
    if (result && result.codeResult && result.codeResult.code) {
      const code = result.codeResult.code;
      
      // Prevent duplicate scans (debounce)
      if (detectedCodes.current.has(code)) {
        return;
      }
      
      detectedCodes.current.add(code);
      
      // Clear the code from the set after 3 seconds
      setTimeout(() => {
        detectedCodes.current.delete(code);
      }, 3000);

      // Play a beep sound (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuAzvLZiTYIGGS56+mbUQ4MW6vm77BiGQc8j9XvyX0tBCh+zPLaizsIHWu97OObTw0PVKv97G1fGgo8ldb2wnQoBSp/zvLaiTYIGGW56+maTQ4NW6vm77BiGQc8j9XuyH0tBCh+zPLaizsIHWu97OObTw0PVKv97G1fGgo8ldbywnUoBSp/zvLaiTYIGGW56+maThANU6vm77BiGQc9j9XuyH0tBCh+zPLaizsIHWu97OObTw0PVKv97G1fGgo8ldbywnQoBSl/zvLaizsIGGS56+mbUQ4MW6vm77BiGQc8j9Xv'); 
        audio.play().catch(e => console.log('Could not play sound'));
      } catch (e) {
        // Ignore audio errors
      }

      // Report the scan
      onScan(code);
      
      // Stop scanner after successful scan
      stopScanner();
    }
  };

  const handleClose = () => {
    stopScanner();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-2xl mx-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-neutral-100 transition-colors"
        >
          <X size={24} className="text-neutral-800" />
        </button>

        {/* Scanner container */}
        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-pink to-primary-blue p-4 text-white">
            <div className="flex items-center gap-3">
              <Camera size={24} />
              <div>
                <h3 className="text-lg font-bold">Scan Barcode</h3>
                <p className="text-sm text-white/90">
                  Position barcode within the frame
                </p>
              </div>
            </div>
          </div>

          {/* Scanner view */}
          <div className="relative bg-black" style={{ minHeight: '400px' }}>
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">Camera Error</h4>
                      <p className="text-sm text-red-700">{error}</p>
                      <p className="text-xs text-red-600 mt-3">
                        Make sure you've allowed camera access in your browser settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : scanning ? (
              <>
                <div ref={scannerRef} className="w-full h-full" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner markers */}
                  <div className="absolute top-1/4 left-1/4 w-16 h-16 border-t-4 border-l-4 border-primary-pink"></div>
                  <div className="absolute top-1/4 right-1/4 w-16 h-16 border-t-4 border-r-4 border-primary-pink"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-16 h-16 border-b-4 border-l-4 border-primary-pink"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border-b-4 border-r-4 border-primary-pink"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-1/4 top-1/4 bottom-1/4 overflow-hidden">
                    <div className="h-1 bg-primary-pink animate-scan-line"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200">
            <div className="flex items-start gap-3 text-sm text-neutral-700">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-blue text-white rounded-full flex items-center justify-center font-bold text-xs">
                i
              </div>
              <div>
                <p className="font-medium mb-1">Tips for best results:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Hold your device steady</li>
                  <li>• Ensure good lighting</li>
                  <li>• Keep the barcode in focus</li>
                  <li>• If scanning fails, you can enter the code manually</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Manual entry option */}
          <div className="p-4 border-t border-neutral-200">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="w-full"
            >
              Enter Barcode Manually
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;


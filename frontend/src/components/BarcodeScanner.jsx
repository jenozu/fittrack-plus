import { useEffect, useRef, useState } from 'react';
import { BarcodeDetector as PolyDetector, prepareZXingModule } from 'barcode-detector/ponyfill';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { Camera, X, Zap } from 'lucide-react';
import { Button } from './ui';

// iPhone Safari has no native BarcodeDetector; use the ZXing ponyfill with a self-hosted .wasm.
prepareZXingModule({
  overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
});

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

const BarcodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [manual, setManual] = useState('');

  useEffect(() => {
    let stream;
    let timer;
    let cancelled = false;
    let last = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        setCanTorch(!!track.getCapabilities?.().torch);
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const Detector = 'BarcodeDetector' in window ? window.BarcodeDetector : PolyDetector;
        const detector = new Detector({ formats: FORMATS });
        let busy = false;
        timer = setInterval(async () => {
          if (busy || video.readyState < 2) return;
          busy = true;
          try {
            const found = await detector.detect(video);
            const code = found[0]?.rawValue;
            if (!code) { last = null; return; }
            if (code !== last) { last = code; return; } // need the same code twice in a row
            clearInterval(timer);
            navigator.vibrate?.(50);
            onScan(code);
          } catch { /* ignore a failed frame */ } finally { busy = false; }
        }, 150);
      } catch (e) {
        console.error('Scanner failed:', e);
        setError('Could not open the camera. Allow camera access, or type the number below.');
      }
    };
    start();

    return () => {
      cancelled = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  const toggleTorch = async () => {
    try {
      await trackRef.current.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch (e) {
      console.error('Torch failed:', e);
    }
  };

  const submitManual = (e) => {
    e.preventDefault();
    if (manual.trim()) onScan(manual.trim());
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2"><Camera size={22} /><h3 className="font-bold">Scan barcode</h3></div>
        <div className="flex gap-2">
          {canTorch && (
            <button onClick={toggleTorch} aria-label="Torch" className={`rounded-full p-3 ${torchOn ? 'bg-yellow-300 text-black' : 'bg-white/20'}`}>
              <Zap size={20} />
            </button>
          )}
          <button onClick={onClose} aria-label="Close" className="rounded-full p-3 bg-white/20"><X size={20} /></button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
        {error && <p className="absolute inset-x-4 top-4 bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</p>}
        <div className="absolute inset-x-[10%] top-1/3 h-1/3 border-2 border-white/70 rounded-lg pointer-events-none" />
      </div>
      <form onSubmit={submitManual} className="p-4 flex gap-2 bg-white" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="Or type the number"
          className="flex-1 border border-neutral-300 rounded-lg px-3 py-3 text-base"
        />
        <Button type="submit" className="min-h-[44px]">Look up</Button>
      </form>
    </div>
  );
};

export default BarcodeScanner;

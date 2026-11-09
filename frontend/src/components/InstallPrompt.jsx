import React, { useState } from 'react';

const KEY = 'installPromptSeen';
const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const InstallPrompt = () => {
  const [open, setOpen] = useState(() => !standalone() && !localStorage.getItem(KEY));
  if (!open) return null;
  const close = () => {
    localStorage.setItem(KEY, '1');
    setOpen(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold">Install the app</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          <li><b>iPhone:</b> open in Safari, tap Share, then Add to Home Screen.</li>
          <li><b>Android:</b> in Chrome, open the menu, then Install app.</li>
        </ul>
        <button onClick={close} className="mt-4 w-full rounded-lg bg-neutral-900 py-2 text-white">Got it</button>
      </div>
    </div>
  );
};

export default InstallPrompt;

'use client'

import { useState } from 'react';
import { X } from 'lucide-react';

export default function WarningModal() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const lastShown = localStorage.getItem('warningModalLastShown');
      if (!lastShown) {
        return true;
      } else {
        const lastTime = parseInt(lastShown);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return now - lastTime > twentyFourHours;
      }
    }
    return false;
  });

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem('warningModalLastShown', Date.now().toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-red-600">Important Warning</h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="text-gray-700 space-y-3">
          <p className="font-semibold text-red-600">
            We do not guarantee the resale of accounts.
          </p>
          <p>
            Any accounts purchased from us must not be used for illegal activities.
          </p>
          <p>
            We are not responsible for any issues that may arise from their use. All accounts are provided strictly for socialization and business development purposes and must not be used for fraudulent or unlawful actions.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

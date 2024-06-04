// src/components/LoadingModal.js
import React from "react";

const LoadingModal = ({ show }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Loading</h2>
        <p className="text-gray-700">May take up to 15 seconds to catch up</p>
      </div>
    </div>
  );
};

export default LoadingModal;

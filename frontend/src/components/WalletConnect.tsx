// src/components/WalletConnect.tsx
import React from "react";
import { useWallet } from "../context/WalletContext";
import { FiAlertTriangle } from "react-icons/fi";

const WalletConnect: React.FC = () => {
  const { address, balance, connect, chainId, switchToSepolia } = useWallet();

  const wrongNetwork = chainId !== undefined && Number(chainId) !== 11155111;

  if (!address) {
    return (
      <button
        onClick={connect}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Connect MetaMask
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {wrongNetwork && (
        <span className="flex items-center text-yellow-600">
          <FiAlertTriangle className="mr-1" /> Wrong network
        </span>
      )}
      <span className="text-sm text-gray-600">
        {address?.slice(0, 6)}…{address?.slice(-4)} ({Number(balance).toFixed(4)} ETH)
      </span>
    </div>
  );
};

export default WalletConnect;


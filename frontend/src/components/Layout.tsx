// src/components/Layout.tsx
import React from "react";
import { useWallet } from "../context/WalletContext";
import WalletConnect from "./WalletConnect";
import { CHAIN_ID } from "../config";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { chainId, switchToSepolia } = useWallet();
  const wrongNetwork = chainId && Number(chainId) !== CHAIN_ID;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 bg-white shadow-md z-10 flex items-center justify-between px-6 py-3">
        <h1 className="text-2xl font-semibold text-primary">FreelanceChain</h1>
        <WalletConnect />
      </header>
      {wrongNetwork && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex items-center justify-between">
          <span>Wrong network detected. Please switch to Sepolia.</span>
          <button onClick={switchToSepolia} className="ml-4 bg-primary text-white px-3 py-1 rounded hover:bg-indigo-700">
            Switch to Sepolia
          </button>
        </div>
      )}
      <main className="flex-1 container mx-auto p-6">{children}</main>
      <footer className="bg-white text-center py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} FreelanceChain – Trustless freelancing payments.
      </footer>
    </div>
  );
};

export default Layout;

// src/components/Navbar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Home", to: "/" },
  { name: "Explore Jobs", to: "/" }, // assuming landing page shows steps
  { name: "My Jobs", to: "/my-jobs" },
  { name: "Create Job", to: "/create" },
];

export const Navbar: React.FC = () => {
  const { address, balance, connect, chainId, switchToSepolia } = useWallet();
  const [open, setOpen] = React.useState(false);
  const wrongNetwork = chainId && Number(chainId) !== 11155111;

  return (
    <header className="sticky top-0 z-20 bg-gray-900/70 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">FreelancePay</h1>
          <nav className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="text-gray-300 hover:text-white focus:outline-none">
            {open ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
        {/* Wallet info */}
        <div className="flex items-center space-x-3">
          {wrongNetwork && (
            <button
              onClick={switchToSepolia}
              className="bg-yellow-600 text-white px-2 py-1 rounded text-xs"
            >
              Switch to Sepolia
            </button>
          )}
          {address ? (
            <span className="text-sm text-gray-200">
              {address.slice(0, 6)}…{address.slice(-4)} ({Number(balance).toFixed(4)} ETH)
            </span>
          ) : (
            <button
              onClick={connect}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      {/* Mobile nav */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-gray-900 border-t border-gray-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};


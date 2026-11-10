// src/context/WalletContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

interface WalletContextProps {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  balance: string | null; // ETH string
  chainId: number | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const updateBalance = async (addr: string, prov: ethers.BrowserProvider) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error(e);
      setBalance(null);
    }
  };

  const init = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Install it first.");
      return;
    }
    const prov = new ethers.BrowserProvider(window.ethereum);
    setProvider(prov);
    const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      const addr = ethers.getAddress(accounts[0]);
      setAddress(addr);
      const sig = await prov.getSigner();
      setSigner(sig);
      const net = await prov.getNetwork();
      setChainId(Number(net.chainId));
      await updateBalance(addr, prov);
    }
    // listeners
    const handleAccounts = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setSigner(null);
        setBalance(null);
        setChainId(null);
      } else {
        const addr = ethers.getAddress(accounts[0]);
        setAddress(addr);
        const sig = await provider!.getSigner();
        setSigner(sig);
        await updateBalance(addr, provider!);
        const net = await provider!.getNetwork();
        setChainId(Number(net.chainId));
      }
    };
    const handleChain = (chainIdHex: string) => {
      const id = parseInt(chainIdHex, 16);
      setChainId(id);
    };
    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
  };

  useEffect(() => {
    init();
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected.");
      return;
    }
    const prov = new ethers.BrowserProvider(window.ethereum);
    await prov.send("eth_requestAccounts", []);
    const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      const addr = ethers.getAddress(accounts[0]);
      setAddress(addr);
      const sig = await prov.getSigner();
      setSigner(sig);
      const net = await prov.getNetwork();
      setChainId(Number(net.chainId));
      setProvider(prov);
      await updateBalance(addr, prov);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setSigner(null);
    setBalance(null);
    setChainId(null);
    // keep provider for possible reconnection
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia hex
      });
    } catch (e: any) {
      if (e.code === 4902) {
        // chain not added, add it
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://sepolia.infura.io/v3/"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
    // Refresh chain ID after switch
    const newChainHex = await window.ethereum.request({ method: "eth_chainId" });
    const newId = parseInt(newChainHex, 16);
    setChainId(newId);
  };

  const value: WalletContextProps = {
    provider,
    signer,
    address,
    balance,
    chainId,
    isConnected: !!address,
    connect,
    disconnect,
    switchToSepolia,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
};

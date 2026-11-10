// src/hooks/useEthers.ts
import { ethers } from "ethers";
import { useState, useEffect, useCallback } from "react";
import { CHAIN_ID } from "../config";

export const useEthers = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [network, setNetwork] = useState<ethers.Network | null>(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    const prov = new ethers.BrowserProvider(window.ethereum);
    await prov.send("eth_requestAccounts", []);
    const sig = await prov.getSigner();
    const addr = await sig.getAddress();
    const bal = ethers.formatEther(await prov.getBalance(addr));
    const net = await prov.getNetwork();
    setProvider(prov);
    setSigner(sig);
    setAddress(addr);
    setBalance(bal);
    setNetwork(net);
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // 11155111 hex
      });
    } catch (e: any) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              rpcUrls: ["https://sepolia.infura.io/v3/"],
            },
          ],
        });
      } else {
        throw e;
      }
    }
    await connect();
  }, [connect]);

  // refresh balance periodically
  useEffect(() => {
    if (!provider || !address) return;
    const id = setInterval(async () => {
      const bal = ethers.formatEther(await provider.getBalance(address));
      setBalance(bal);
    }, 10000);
    return () => clearInterval(id);
  }, [provider, address]);

  return { provider, signer, address, balance, network, connect, switchToSepolia };
};


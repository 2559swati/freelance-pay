import { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

const CONTRACT_ADDRESS = "0xF8c960347A32Dbf8191aDdAA09b1BAFd826952c1";
const SEPOLIA_CHAIN_ID = 11155111;
const ABI = [
  "function createJob(string _title, address _freelancer, uint256 _deadline) payable returns (uint256)",
];

// Adhoori value (jaise "0.") par bhi crash nahi hoga
function safeParse(v: string): bigint | null {
  try {
    if (!v || Number(v) <= 0) return null;
    return ethers.parseEther(v);
  } catch {
    return null;
  }
}

export default function JobForm() {
  const [title, setTitle] = useState("");
  const [freelancer, setFreelancer] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const wei = safeParse(amount);
  const fee = wei ? wei / 100n : null; // 1% fee
  const payout = wei && fee !== null ? wei - fee : null;

  const today = new Date().toISOString().split("T")[0];

  function onAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (/^\d*\.?\d{0,18}$/.test(v)) setAmount(v); // sirf number aur ek dot
  }

  async function createJob() {
    if (busy) return;

    if (!title.trim()) return toast.error("Job title likho");
    if (!ethers.isAddress(freelancer)) return toast.error("Freelancer address galat hai");
    if (!wei) return toast.error("Amount 0 se zyada hona chahiye");
    if (!date) return toast.error("Deadline chuno");

    const deadline = Math.floor(new Date(date + "T23:59:59").getTime() / 1000);
    if (deadline <= Math.floor(Date.now() / 1000))
      return toast.error("Deadline future ki honi chahiye");

    const eth = (window as any).ethereum;
    if (!eth) return toast.error("MetaMask install nahi hai");

    setBusy(true);
    const id = toast.loading("MetaMask mein confirm karo...");
    try {
      const provider = new ethers.BrowserProvider(eth);
      const net = await provider.getNetwork();
      if (Number(net.chainId) !== SEPOLIA_CHAIN_ID) {
        toast.error("MetaMask mein Sepolia network chuno", { id });
        setBusy(false);
        return;
      }
      const signer = await provider.getSigner();
      if (freelancer.toLowerCase() === (await signer.getAddress()).toLowerCase()) {
        toast.error("Apna hi address freelancer nahi ho sakta", { id });
        setBusy(false);
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.createJob(title.trim(), freelancer, deadline, {
        value: wei,
      });
      toast.loading("Transaction chal raha hai...", { id });
      await tx.wait();
      toast.success("Job ban gaya! Funds lock ho gaye.", { id });
      setTitle("");
      setFreelancer("");
      setAmount("");
      setDate("");
    } catch (err: any) {
      const rejected = err?.code === "ACTION_REJECTED" || err?.code === 4001;
      toast.error(
        rejected ? "Aapne transaction cancel kar diya" : err?.shortMessage || "Transaction fail ho gaya",
        { id }
      );
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">Create new job</h1>
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">Job title</label>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Logo Design" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">Freelancer wallet address</label>
            <input className={input} value={freelancer} onChange={(e) => setFreelancer(e.target.value.trim())} placeholder="0x..." />
            {freelancer && !ethers.isAddress(freelancer) && (
              <p className="mt-1 text-sm text-red-600">Ye valid address nahi hai</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-600">Amount (ETH)</label>
              <input className={input} type="text" inputMode="decimal" value={amount} onChange={onAmountChange} placeholder="0.001" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-600">Deadline</label>
              <input className={input} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <button
            type="button"
            onClick={createJob}
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-300/50 transition hover:opacity-95 disabled:opacity-50"
          >
            {busy ? "Please wait..." : "Lock funds & create job"}
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold">Summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">You lock</span>
            <b>{wei ? ethers.formatEther(wei) + " ETH" : "Enter an amount"}</b>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Platform fee (1%)</span>
            <b>{fee !== null ? ethers.formatEther(fee) + " ETH" : "-"}</b>
          </div>
          <div className="flex justify-between border-t pt-3 text-sm">
            <span className="text-gray-500">Freelancer receives</span>
            <b className="text-emerald-700">{payout !== null ? ethers.formatEther(payout) + " ETH" : "-"}</b>
          </div>
          <p className="pt-2 text-xs text-gray-500">
            Funds contract mein lock rehte hain jab tak aap approve na karo ya deadline na nikle.
          </p>
        </div>
      </div>
    </div>
  );
}
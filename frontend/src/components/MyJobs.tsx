import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

const CONTRACT_ADDRESS = "0xF8c960347A32Dbf8191aDdAA09b1BAFd826952c1";
const ABI = [
  "function jobCount() view returns (uint256)",
  "function jobs(uint256) view returns (address client, address freelancer, uint256 amount, uint256 deadline, string workCid, string title, uint256 createdAt, uint8 status)",
  "function submitWork(uint256 id, string cid)",
  "function approve(uint256 id)",
  "function refund(uint256 id)",
  "function raiseDispute(uint256 id)",
];

const STATUS = ["Funded", "Submitted", "Completed", "Refunded", "Disputed"];
const PILL: Record<string, string> = {
  Funded: "bg-amber-100 text-amber-800",
  Submitted: "bg-blue-100 text-blue-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Refunded: "bg-gray-200 text-gray-700",
  Disputed: "bg-red-100 text-red-800",
};

type Job = {
  id: number;
  title: string;
  client: string;
  freelancer: string;
  amount: bigint;
  deadline: number;
  workCid: string;
  status: string;
};

const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4);

export default function MyJobs() {
  const [account, setAccount] = useState<string>("");
  const [tab, setTab] = useState<"client" | "freelancer">("client");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [cidInputs, setCidInputs] = useState<Record<number, string>>({});

  const eth = (window as any).ethereum;

  const loadJobs = useCallback(async (acc: string) => {
    if (!eth || !acc) return;
    setLoading(true);
    setError("");
    try {
      const provider = new ethers.BrowserProvider(eth);
      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const count = Number(await c.jobCount());
      const list: Job[] = [];
      for (let i = 1; i <= count; i++) {
        const j = await c.jobs(i);
        const job: Job = {
          id: i,
          title: j.title,
          client: j.client,
          freelancer: j.freelancer,
          amount: j.amount,
          deadline: Number(j.deadline),
          workCid: j.workCid,
          status: STATUS[Number(j.status)] ?? "Unknown",
        };
        if (
          job.client.toLowerCase() === acc.toLowerCase() ||
          job.freelancer.toLowerCase() === acc.toLowerCase()
        ) {
          list.push(job);
        }
      }
      setJobs(list.reverse());
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Jobs load nahi hue");
    } finally {
      setLoading(false);
    }
  }, [eth]);

  // Page khulte hi connected account lo (popup nahi aayega)
  useEffect(() => {
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
      if (accs[0]) setAccount(accs[0]);
    });
    const onAcc = (accs: string[]) => setAccount(accs[0] || "");
    eth.on?.("accountsChanged", onAcc);
    return () => eth.removeListener?.("accountsChanged", onAcc);
  }, [eth]);

  useEffect(() => {
    if (account) loadJobs(account);
  }, [account, loadJobs]);

  async function connect() {
    try {
      const accs = await eth.request({ method: "eth_requestAccounts" });
      setAccount(accs[0]);
    } catch {
      toast.error("Connect cancel hua");
    }
  }

  async function act(job: Job, kind: "submit" | "approve" | "refund" | "dispute") {
    if (busyId !== null) return;
    setBusyId(job.id);
    const tid = toast.loading("MetaMask mein confirm karo...");
    try {
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      let tx;
      if (kind === "submit") {
        const cid = (cidInputs[job.id] || "").trim();
        if (!cid) {
          toast.error("Pehle CID likho (jaise QmTest123)", { id: tid });
          setBusyId(null);
          return;
        }
        tx = await c.submitWork(job.id, cid);
      } else if (kind === "approve") tx = await c.approve(job.id);
      else if (kind === "refund") tx = await c.refund(job.id);
      else tx = await c.raiseDispute(job.id);

      toast.loading("Transaction chal raha hai...", { id: tid });
      await tx.wait();
      toast.success("Ho gaya!", { id: tid });
      await loadJobs(account);
    } catch (e: any) {
      const rejected = e?.code === "ACTION_REJECTED" || e?.code === 4001;
      toast.error(rejected ? "Aapne cancel kar diya" : e?.reason || e?.shortMessage || "Transaction fail", { id: tid });
    } finally {
      setBusyId(null);
    }
  }

  if (!eth) return <div className="p-10 text-center">MetaMask install karo.</div>;

  if (!account)
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="mb-4 text-2xl font-bold">My jobs</h1>
        <button onClick={connect} className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white">
          Connect wallet
        </button>
      </div>
    );

  const me = account.toLowerCase();
  const shown = jobs.filter((j) =>
    tab === "client" ? j.client.toLowerCase() === me : j.freelancer.toLowerCase() === me
  );
  const now = Math.floor(Date.now() / 1000);
  const locked = shown
    .filter((j) => j.status === "Funded" || j.status === "Submitted" || j.status === "Disputed")
    .reduce((s, j) => s + j.amount, 0n);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My jobs</h1>
          <p className="text-sm text-gray-500">Connected: {short(account)}</p>
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 text-sm font-semibold">
          {(["client", "freelancer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={"rounded-lg px-4 py-2 " + (tab === t ? "bg-indigo-600 text-white" : "text-gray-500")}
            >
              {t === "client" ? "As Client" : "As Freelancer"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          ["Total", shown.length],
          ["Completed", shown.filter((j) => j.status === "Completed").length],
          ["ETH in escrow", ethers.formatEther(locked)],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">{k}</div>
            <div className="text-2xl font-bold">{String(v)}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Error: {error}
          <button onClick={() => loadJobs(account)} className="ml-3 underline">Try again</button>
        </div>
      )}
      {loading && <p className="text-gray-500">Loading jobs...</p>}
      {!loading && !error && shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Is tab mein abhi koi job nahi hai.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((j) => {
          const isClient = j.client.toLowerCase() === me;
          const isFreelancer = j.freelancer.toLowerCase() === me;
          const busy = busyId === j.id;
          return (
            <div key={j.id} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <b className="text-lg">#{j.id} {j.title}</b>
                <span className={"rounded-full px-3 py-1 text-xs font-semibold " + PILL[j.status]}>{j.status}</span>
              </div>
              <div className="text-2xl font-bold">{ethers.formatEther(j.amount)} ETH</div>
              <div className="text-xs text-gray-500">
                Client {short(j.client)} · Freelancer {short(j.freelancer)}
                <br />
                Deadline: {new Date(j.deadline * 1000).toLocaleDateString()}
                {j.workCid && <><br />Work CID: {j.workCid}</>}
              </div>

              {isFreelancer && j.status === "Funded" && (
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="IPFS CID (QmTest123)"
                    value={cidInputs[j.id] || ""}
                    onChange={(e) => setCidInputs({ ...cidInputs, [j.id]: e.target.value })}
                  />
                  <button disabled={busy} onClick={() => act(j, "submit")} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    Submit Work
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {isClient && j.status === "Submitted" && (
                  <button disabled={busy} onClick={() => act(j, "approve")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    Approve &amp; pay
                  </button>
                )}
                {isClient && j.status === "Funded" && now > j.deadline && (
                  <button disabled={busy} onClick={() => act(j, "refund")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">
                    Refund
                  </button>
                )}
                {(isClient || isFreelancer) && j.status === "Submitted" && (
                  <button disabled={busy} onClick={() => act(j, "dispute")} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">
                    Raise dispute
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
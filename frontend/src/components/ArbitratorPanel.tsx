// src/components/ArbitratorPanel.tsx
import React, { useEffect, useState } from "react";
import { useEthers } from "../hooks/useEthers";
import { getArbitrator, getJobsByClient, resolveDispute } from "../contract/escrow";
import JobCard from "./JobCard";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const ArbitratorPanel: React.FC = () => {
  const { provider, address, signer } = useEthers();
  const [isArbitrator, setIsArbitrator] = useState(false);
  const [disputedJobs, setDisputedJobs] = useState<any[]>([]);

  const loadData = async () => {
    if (!provider) return;
    const arb = await getArbitrator(provider);
    const isArb = address?.toLowerCase() === arb?.toLowerCase();
    setIsArbitrator(isArb);
    if (isArb) {
      // arbitrator can view all jobs – we'll fetch by client address (self) and filter disputes
      const all = await getJobsByClient(provider, address);
      setDisputedJobs(all.filter((j: any) => j.status === 4)); // Disputed enum = 4
    }
  };

  useEffect(() => {
    loadData();
  }, [provider, address]);

  const handleResolve = async (jobId: number, payFreelancer: boolean) => {
    if (!signer) return toast.error("Connect wallet");
    await toast.promise(
      resolveDispute(signer, jobId, payFreelancer),
      {
        loading: "Resolving…",
        success: "Dispute resolved",
        error: (e) => e.message || "Failed",
      }
    );
    await loadData();
  };

  if (!isArbitrator) {
    return (
      <p className="text-center text-gray-600">
        Only the designated arbitrator can access this page.
      </p>
    );
  }

  return (
    <section className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Arbitrator Dashboard</h2>
      {disputedJobs.length === 0 ? (
        <p className="text-gray-600">No disputed jobs at the moment.</p>
      ) : (
        disputedJobs.map((job) => (
          <div key={job.id} className="mb-6">
            <JobCard job={job} role="client" onAction={() => {}} />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleResolve(job.id, true)}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <FiCheckCircle /> Pay Freelancer
              </button>
              <button
                onClick={() => handleResolve(job.id, false)}
                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <FiXCircle /> Refund Client
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
};

export default ArbitratorPanel;


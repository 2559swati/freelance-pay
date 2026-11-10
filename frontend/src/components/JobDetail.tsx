// src/components/JobDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useEthers } from "../hooks/useEthers";
import { getJob, approve, refund, raiseDispute } from "../contract/escrow";
import StatusPill from "./StatusPill";
import SubmitWork from "./SubmitWork";
import toast from "react-hot-toast";
import { formatDate, weiToEth } from "../utils";
import { FiExternalLink } from "react-icons/fi";

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);
  const { provider, address, signer } = useEthers();
  const [job, setJob] = useState<any>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const loadJob = async () => {
    if (!provider) return;
    const data = await getJob(provider, jobId);
    setJob(data);
  };

  useEffect(() => {
    loadJob();
  }, [provider, jobId]);

  const handleApprove = async () => {
    if (!signer) return toast.error("Connect wallet");
    await toast.promise(approve(signer, jobId), {
      loading: "Approving…",
      success: "Payment released",
      error: (e) => e.message || "Failed",
    });
    loadJob();
  };

  const handleRefund = async () => {
    if (!signer) return toast.error("Connect wallet");
    await toast.promise(refund(signer, jobId), {
      loading: "Refunding…",
      success: "Funds refunded",
      error: (e) => e.message || "Failed",
    });
    loadJob();
  };

  const handleDispute = async () => {
    if (!signer) return toast.error("Connect wallet");
    await toast.promise(raiseDispute(signer, jobId), {
      loading: "Raising dispute…",
      success: "Dispute raised",
      error: (e) => e.message || "Failed",
    });
    loadJob();
  };

  if (!job) return <p className="text-center py-8">Loading…</p>;

  const isClient = address?.toLowerCase() === job.client?.toLowerCase();
  const isFreelancer = address?.toLowerCase() === job.freelancer?.toLowerCase();

  return (
    <section className="max-w-3xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-2">
        #{job.id} – {job.title}
      </h2>
      <StatusPill status={job.status} className="mb-4" />

      {/* Job metadata */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-3 mb-6">
        <p><strong>Client:</strong> {job.client}</p>
        <p><strong>Freelancer:</strong> {job.freelancer}</p>
        <p><strong>Amount:</strong> {weiToEth(job.amount)} ETH</p>
        <p><strong>Deadline:</strong> {formatDate(job.deadline)}</p>
        {job.workCid && (
          <p>
            <strong>Work CID:</strong>{" "}
            <a
              href={`https://gateway.ipfs.io/ipfs/${job.workCid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline flex items-center"
            >
              View on IPFS <FiExternalLink className="ml-1" />
            </a>
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {isFreelancer && job.status === 1 && (
          <button
            onClick={() => setShowSubmit(true)}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-indigo-700"
          >
            Submit Work
          </button>
        )}
        {isClient && job.status === 1 && (
          <>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={handleDispute}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Raise Dispute
            </button>
          </>
        )}
        {isClient && job.status === 0 && new Date().getTime() / 1000 > job.deadline && (
          <button
            onClick={handleRefund}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refund
          </button>
        )}
      </div>

      {/* Timeline (simple list) */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold mb-2">Timeline</h3>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li>📅 <strong>Created</strong> – {formatDate(job.createdAt)}</li>
          {job.workCid && <li>📁 <strong>Work submitted</strong> – {formatDate(job.deadline)}</li>}
          {job.status === 2 && <li>✅ <strong>Completed</strong></li>}
          {job.status === 3 && <li>🔄 <strong>Refunded</strong></li>}
          {job.status === 4 && <li>⚖️ <strong>Disputed</strong></li>}
        </ul>
      </div>

      {showSubmit && (
        <SubmitWork
          jobId={job.id}
          onClose={() => setShowSubmit(false)}
          onSubmitted={loadJob}
        />
      )}
    </section>
  );
};

export default JobDetail;


// src/components/JobCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import StatusPill from "./StatusPill";
import { formatDate } from "../utils";
import { differenceInSeconds } from "date-fns";

interface Job {
  id: number;
  client: string;
  freelancer: string;
  amount: string; // wei string
  deadline: number;
  workCid: string;
  title: string;
  createdAt: number;
  status: number;
}

const JobCard: React.FC<{ job: Job; role: "client" | "freelancer"; onAction: (action: string) => void }> = ({ job, role, onAction }) => {
  const navigate = useNavigate();
  const deadlineRemaining = Math.max(0, differenceInSeconds(job.deadline * 1000, Date.now()));
  const deadlineStr = deadlineRemaining > 0 ? `${Math.floor(deadlineRemaining / 3600)}h ${Math.floor((deadlineRemaining % 3600) / 60)}m` : "Expired";

  const amountEth = (Number(job.amount) / 1e18).toFixed(4);

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-800">#{job.id} – {job.title}</h3>
          <p className="text-sm text-gray-600">Amount: {amountEth} ETH</p>
          <p className="text-sm text-gray-600">Deadline: {formatDate(job.deadline)}</p>
        </div>
        <StatusPill status={job.status} />
      </div>
      <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
        <span>{deadlineStr}</span>
        {job.workCid && (
          <a
            href={`https://gateway.ipfs.io/ipfs/${job.workCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            IPFS Link
          </a>
        )}
      </div>
      <div className="mt-4 flex space-x-2">
        {role === "freelancer" && job.status === 1 && (
          <button
            onClick={() => onAction("submit")}
            className="bg-primary text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            Submit Work
          </button>
        )}
        {role === "client" && job.status === 1 && (
          <button
            onClick={() => onAction("approve")}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Approve
          </button>
        )}
        {role === "client" && job.status === 0 && deadlineRemaining === 0 && (
          <button
            onClick={() => onAction("refund")}
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
          >
            Refund
          </button>
        )}
        {job.status === 1 && (
          <button
            onClick={() => onAction("dispute")}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Raise Dispute
          </button>
        )}
        <button
          onClick={() => navigate(`/job/${job.id}`)}
          className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
        >
          Details
        </button>
      </div>
    </div>
  );
};

export default JobCard;


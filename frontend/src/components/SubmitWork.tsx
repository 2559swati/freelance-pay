import React, { useState } from "react";
import { submitWork } from "../contract/escrow";
import { useEthers } from "../hooks/useEthers";
import toast from "react-hot-toast";

interface SubmitWorkProps {
  jobId: number;
  onClose: () => void;
  onSubmitted?: () => void | Promise<void>;
}

const SubmitWork: React.FC<SubmitWorkProps> = ({
  jobId,
  onClose,
  onSubmitted,
}) => {
  const { signer } = useEthers();
  const [cid, setCid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cid.trim()) {
      toast.error("Please enter IPFS CID");
      return;
    }

    if (!signer) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);

      await toast.promise(submitWork(signer, jobId, cid.trim()), {
        loading: "Submitting work...",
        success: "Work submitted successfully!",
        error: (err) => err?.reason || err?.message || "Failed",
      });

      await onSubmitted?.();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Submit Completed Work</h2>

        <form onSubmit={handleSubmit}>
          <label className="mb-2 block font-semibold">
            IPFS CID
          </label>

          <input
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            placeholder="Enter your IPFS CID"
            disabled={loading}
            className="w-full rounded-lg border p-3"
          />

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose}>
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !cid.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
            >
              {loading ? "Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitWork;
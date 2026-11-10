
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

        const cleanCid = cid.trim();

        if (!cleanCid) {
            toast.error("Please enter your IPFS CID");
            return;
        }

        if (!signer) {
            toast.error("Please connect your wallet");
            return;
        }

        try {
            setLoading(true);

            await toast.promise(
                submitWork(signer, jobId, cleanCid),
                {
                    loading: "Submitting work to blockchain...",
                    success: "Work submitted successfully!",
                    error: (err) => err?.reason || err?.message || "Submission failed",
                }
            );

            if (onSubmitted) {
                await onSubmitted();
            }

            onClose();
        } catch (error) {
            console.error("Submit work error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        Submit Completed Work
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="text-2xl text-gray-500 hover:text-gray-900"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        IPFS Content ID (CID)
                    </label>

                    <input
                        type="text"
                        value={cid}
                        onChange={(e) => setCid(e.target.value)}
                        placeholder="Enter your IPFS CID..."
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-indigo-500"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                        Upload your completed work to IPFS first, then paste its CID here.
                    </p>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !cid.trim()}
                            className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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

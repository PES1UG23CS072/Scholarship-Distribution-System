import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract, getSigner, formatAmount } from "../utils/ethers";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/contract";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

interface Scholarship {
  uid: string;
  studentAddress: string;
  amount: string;
  status: number;
  timestamp: number;
}

export const ManagerDashboard: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [formMode, setFormMode] = useState<"post" | "verify" | "release" | null>(null);
  const [uid, setUid] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [amount, setAmount] = useState("");

  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadAdminInfo();
    loadScholarships();

    // Poll for updates
    const interval = setInterval(loadScholarships, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminInfo = async () => {
    try {
      const contract = getContract();
      const owner = await contract.owner();
      setAdminAddress(owner);

      const signer = getSigner();
      if (signer) {
        const userAddress = await signer.getAddress();
        setIsAdmin(userAddress.toLowerCase() === owner.toLowerCase());
      }
    } catch (err) {
      console.error("Failed to load admin info:", err);
    }
  };

  const loadScholarships = async () => {
    try {
      const contract = getContract();
      const ids = await contract.getAllScholarships();

      const scholarshipsData: Scholarship[] = [];
      for (const id of ids) {
        const data = await contract.getScholarship(id);
        scholarshipsData.push({
          uid: data.uid,
          studentAddress: data.studentAddress,
          amount: await formatAmount(data.amount),
          status: Number(data.status),
          timestamp: Number(data.timestamp),
        });
      }

      setScholarships(scholarshipsData);
    } catch (err) {
      console.error("Failed to load scholarships:", err);
    }
  };

  const handlePostAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !studentAddress || !amount) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract();
      const signer = getSigner();

      if (!signer) {
        throw new Error("No signer available");
      }

      const contractWithSigner = contract.connect(signer);
      const amountInWei = ethers.parseEther(amount);

      const tx = await contractWithSigner.postAllocation(uid, studentAddress, amountInWei);
      await tx.wait();

      setSuccess(`✅ Scholarship "${uid}" allocated successfully!`);
      setUid("");
      setStudentAddress("");
      setAmount("");
      setFormMode(null);
      loadScholarships();
    } catch (err: any) {
      setError(`❌ Error: ${err.message || "Failed to post allocation"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEligibility = async (scholarshipUid: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract();
      const signer = getSigner();

      if (!signer) {
        throw new Error("No signer available");
      }

      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.verifyEligibility(scholarshipUid);
      await tx.wait();

      setSuccess(`✅ Scholarship "${scholarshipUid}" verified successfully!`);
      loadScholarships();
    } catch (err: any) {
      setError(`❌ Error: ${err.message || "Failed to verify"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async (scholarship: Scholarship) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract();
      const signer = getSigner();

      if (!signer) {
        throw new Error("No signer available");
      }

      const contractWithSigner = contract.connect(signer);
      const amountInWei = ethers.parseEther(scholarship.amount);

      const tx = await contractWithSigner.releaseFunds(scholarship.uid, {
        value: amountInWei,
      });

      await tx.wait();

      setSuccess(`✅ Funds released to ${scholarship.uid}!`);
      loadScholarships();
    } catch (err: any) {
      setError(`❌ Error: ${err.message || "Failed to release funds"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 p-6 text-center">
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-100 mb-2 uppercase tracking-[0.08em]">Access Denied</h2>
        <p className="text-neutral-300">
          Only the admin can access the Manager Dashboard.
          <br />
          Current Admin: {adminAddress && adminAddress.substring(0, 10)}...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-950 text-neutral-100 border border-neutral-700 p-6">
        <h1 className="text-3xl font-bold mb-2 uppercase tracking-[0.08em]">Manager Dashboard</h1>
        <p className="text-neutral-300">Manage scholarship allocations and disbursements</p>
        <p className="text-sm text-neutral-500 mt-2 font-mono">Admin: {adminAddress && adminAddress.substring(0, 15)}...</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-neutral-950 border border-neutral-700 p-4 text-neutral-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-neutral-950 border border-neutral-700 p-4 text-neutral-200 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-neutral-400" />
          {success}
        </div>
      )}

      {/* Form Section */}
      <div className="bg-neutral-900 border border-neutral-700 p-6">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-[0.08em] text-neutral-100">New Action</h2>

        {!formMode ? (
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setFormMode("post")}
              className="bg-neutral-100 hover:bg-neutral-300 text-neutral-950 py-2 px-4 font-semibold transition"
            >
              Post Allocation
            </button>
            <button
              onClick={() => setFormMode("verify")}
              className="bg-neutral-100 hover:bg-neutral-300 text-neutral-950 py-2 px-4 font-semibold transition"
            >
              Verify Eligibility
            </button>
            <button
              onClick={() => setFormMode("release")}
              className="bg-neutral-100 hover:bg-neutral-300 text-neutral-950 py-2 px-4 font-semibold transition"
            >
              Release Funds
            </button>
          </div>
        ) : formMode === "post" ? (
          <form onSubmit={handlePostAllocation} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-neutral-300">Scholarship UID</label>
              <input
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="e.g., SCHOL-2024-001"
                className="w-full px-4 py-2 border border-neutral-700 bg-neutral-950 text-neutral-100 focus:outline-none focus:border-neutral-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-neutral-300">Student Address</label>
              <input
                type="text"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-neutral-700 bg-neutral-950 text-neutral-100 focus:outline-none focus:border-neutral-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-neutral-300">Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.5"
                className="w-full px-4 py-2 border border-neutral-700 bg-neutral-950 text-neutral-100 focus:outline-none focus:border-neutral-500"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-neutral-100 hover:bg-neutral-300 text-neutral-950 py-2 px-4 font-semibold transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 py-2 px-4 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : formMode === "verify" ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-400 mb-3">Select a scholarship to verify:</p>
            {scholarships
              .filter((s) => s.status === 0)
              .map((scholarship) => (
                <div key={scholarship.uid} className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-700">
                  <span className="font-semibold text-neutral-200">{scholarship.uid}</span>
                  <button
                    onClick={() => {
                      handleVerifyEligibility(scholarship.uid);
                      setFormMode(null);
                    }}
                    disabled={loading}
                    className="bg-neutral-100 hover:bg-neutral-300 text-neutral-950 py-1 px-3 font-semibold transition disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              ))}
            {scholarships.filter((s) => s.status === 0).length === 0 && (
              <p className="text-neutral-500">No pending scholarships</p>
            )}
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-neutral-100 py-2 px-4 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-400 mb-3">Select a scholarship to release funds:</p>
            {scholarships
              .filter((s) => s.status === 1)
              .map((scholarship) => (
                <div key={scholarship.uid} className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-700">
                  <div>
                    <div className="font-semibold text-neutral-200">{scholarship.uid}</div>
                    <div className="text-sm text-neutral-500">{scholarship.amount} ETH</div>
                  </div>
                  <button
                    onClick={() => {
                      handleReleaseFunds(scholarship);
                      setFormMode(null);
                    }}
                    disabled={loading}
                    className="bg-neutral-100 hover:bg-neutral-300 text-neutral-950 py-1 px-3 font-semibold transition disabled:opacity-50"
                  >
                    Release
                  </button>
                </div>
              ))}
            {scholarships.filter((s) => s.status === 1).length === 0 && (
              <p className="text-neutral-500">No verified scholarships</p>
            )}
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-neutral-100 py-2 px-4 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Scholarships Table */}
      <div className="bg-neutral-900 border border-neutral-700 overflow-hidden">
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-100 uppercase tracking-[0.08em]">
            <TrendingUp className="w-5 h-5" />
            All Scholarships ({scholarships.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-950 border-b border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-neutral-300">UID</th>
                <th className="px-6 py-3 text-left font-semibold text-neutral-300">Student</th>
                <th className="px-6 py-3 text-left font-semibold text-neutral-300">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-neutral-300">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-neutral-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {scholarships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    No scholarships yet
                  </td>
                </tr>
              ) : (
                scholarships.map((scholarship) => (
                  <tr key={scholarship.uid} className="border-b border-neutral-800 hover:bg-neutral-800 transition">
                    <td className="px-6 py-4 font-semibold text-neutral-100">{scholarship.uid}</td>
                    <td className="px-6 py-4 text-sm text-neutral-300">{scholarship.studentAddress.substring(0, 10)}...</td>
                    <td className="px-6 py-4 font-semibold text-neutral-200">{scholarship.amount} ETH</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold tracking-[0.08em] border ${STATUS_COLORS[scholarship.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_LABELS[scholarship.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {new Date(scholarship.timestamp * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { getContract, formatAmount } from "../utils/ethers";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/contract";
import { AlertCircle, Search, Award } from "lucide-react";

interface Scholarship {
  uid: string;
  studentAddress: string;
  amount: string;
  status: number;
  timestamp: number;
}

export const StudentView: React.FC = () => {
  const [studentAddress, setStudentAddress] = useState("");
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAddress) {
      setError("Please enter a valid wallet address");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Validate address format
      if (!studentAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid wallet address format");
      }

      const contract = getContract();
      const ids = await contract.getStudentScholarships(studentAddress);

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

      if (scholarshipsData.length === 0) {
        setError("No scholarships found for this address");
      }
    } catch (err: any) {
      setError(`❌ Error: ${err.message || "Failed to fetch scholarships"}`);
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    return scholarships.reduce((sum, s) => {
      const amount = parseFloat(s.amount);
      return sum + amount;
    }, 0);
  };

  const calculateTotalReleased = () => {
    return scholarships
      .filter((s) => s.status === 2)
      .reduce((sum, s) => {
        const amount = parseFloat(s.amount);
        return sum + amount;
      }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-950 text-neutral-100 border border-neutral-700 p-6">
        <h1 className="text-3xl font-bold mb-2 uppercase tracking-[0.08em]">Student Portal</h1>
        <p className="text-neutral-300">Check your scholarship allocation and status</p>
      </div>

      {/* Search Form */}
      <div className="bg-neutral-900 border border-neutral-700 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-neutral-100 uppercase tracking-[0.08em]">
          <Search className="w-5 h-5" />
          Search Scholarships
        </h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-neutral-300">Your Wallet Address</label>
            <input
              type="text"
              value={studentAddress}
              onChange={(e) => setStudentAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border border-neutral-700 bg-neutral-950 text-neutral-100 focus:outline-none focus:border-neutral-500 text-lg"
              required
            />
            <p className="text-xs text-neutral-500 mt-2">
              Enter your wallet address to view all scholarships associated with it.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-100 hover:bg-neutral-300 text-neutral-950 py-3 px-4 font-semibold transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-neutral-950 border border-neutral-700 p-4 text-neutral-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-neutral-400" />
          {error}
        </div>
      )}

      {/* Results */}
      {searched && scholarships.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 border border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 font-semibold uppercase tracking-[0.08em]">Total Allocations</p>
              <p className="text-2xl font-bold text-neutral-100">{scholarships.length}</p>
            </div>
            <div className="bg-neutral-950 border border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 font-semibold uppercase tracking-[0.08em]">Total Amount</p>
              <p className="text-2xl font-bold text-neutral-100">{calculateTotalAmount().toFixed(4)} ETH</p>
            </div>
            <div className="bg-neutral-950 border border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 font-semibold uppercase tracking-[0.08em]">Released Amount</p>
              <p className="text-2xl font-bold text-neutral-100">{calculateTotalReleased().toFixed(4)} ETH</p>
            </div>
          </div>

          {/* Scholarships List */}
          <div className="bg-neutral-900 border border-neutral-700 overflow-hidden">
            <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-700">
              <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-100 uppercase tracking-[0.08em]">
                <Award className="w-5 h-5" />
                Your Scholarships
              </h2>
            </div>
            <div className="space-y-3 p-6">
              {scholarships.map((scholarship) => (
                <div
                  key={scholarship.uid}
                  className="border border-neutral-700 bg-neutral-950 p-4 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-100">{scholarship.uid}</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        Applied: {new Date(scholarship.timestamp * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold tracking-[0.08em] border ${STATUS_COLORS[scholarship.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[scholarship.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold">Amount</p>
                      <p className="text-xl font-bold text-neutral-100">{scholarship.amount} ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold">Student Address</p>
                      <p className="text-sm font-mono text-neutral-300">
                        {scholarship.studentAddress.substring(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div className={`flex items-center gap-1 ${scholarship.status >= 0 ? "text-neutral-200" : "text-neutral-600"}`}>
                      Posted
                    </div>
                    <div className="flex-1 h-[1px] mx-2 bg-neutral-700"></div>
                    <div className={`flex items-center gap-1 ${scholarship.status >= 1 ? "text-neutral-200" : "text-neutral-600"}`}>
                      Verified
                    </div>
                    <div className="flex-1 h-[1px] mx-2 bg-neutral-700"></div>
                    <div className={`flex items-center gap-1 ${scholarship.status >= 2 ? "text-neutral-200" : "text-neutral-600"}`}>
                      Released
                    </div>
                  </div>

                  {scholarship.status === 2 && (
                    <div className="mt-3 bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-neutral-300">
                      Funds have been released to your wallet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {searched && scholarships.length === 0 && !error && (
        <div className="bg-neutral-950 border border-neutral-700 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-300">No scholarships found for this address.</p>
          <p className="text-sm text-neutral-500 mt-2">Try another wallet address or contact the administrator.</p>
        </div>
      )}
    </div>
  );
};

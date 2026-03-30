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
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">👨‍🎓 Student Portal</h1>
        <p className="text-purple-100">Check your scholarship allocation and status</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Search className="w-6 h-6" />
          Search Scholarships
        </h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your Wallet Address</label>
            <input
              type="text"
              value={studentAddress}
              onChange={(e) => setStudentAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Enter your wallet address to view all scholarships associated with it
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Results */}
      {searched && scholarships.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-semibold">Total Allocations</p>
              <p className="text-2xl font-bold text-blue-900">{scholarships.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-semibold">Total Amount</p>
              <p className="text-2xl font-bold text-green-900">{calculateTotalAmount().toFixed(4)} ETH</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 font-semibold">Released Amount</p>
              <p className="text-2xl font-bold text-yellow-900">{calculateTotalReleased().toFixed(4)} ETH</p>
            </div>
          </div>

          {/* Scholarships List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-6 h-6" />
                Your Scholarships
              </h2>
            </div>
            <div className="space-y-3 p-6">
              {scholarships.map((scholarship) => (
                <div
                  key={scholarship.uid}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-blue-600">{scholarship.uid}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {new Date(scholarship.timestamp * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[scholarship.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[scholarship.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Amount</p>
                      <p className="text-xl font-bold text-gray-900">{scholarship.amount} ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Student Address</p>
                      <p className="text-sm font-mono text-gray-700">
                        {scholarship.studentAddress.substring(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div className={`flex items-center gap-1 ${scholarship.status >= 0 ? "text-green-600" : "text-gray-400"}`}>
                      ✓ Posted
                    </div>
                    <div className="flex-1 h-1 mx-2 bg-gray-200"></div>
                    <div className={`flex items-center gap-1 ${scholarship.status >= 1 ? "text-green-600" : "text-gray-400"}`}>
                      ✓ Verified
                    </div>
                    <div className="flex-1 h-1 mx-2 bg-gray-200"></div>
                    <div className={`flex items-center gap-1 ${scholarship.status >= 2 ? "text-green-600" : "text-gray-400"}`}>
                      ✓ Released
                    </div>
                  </div>

                  {scholarship.status === 2 && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded px-3 py-2 text-xs text-green-700">
                      ✅ Funds have been released to your wallet!
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <p className="text-blue-700">No scholarships found for this address.</p>
          <p className="text-sm text-blue-600 mt-2">Try another wallet address or contact the administrator.</p>
        </div>
      )}
    </div>
  );
};

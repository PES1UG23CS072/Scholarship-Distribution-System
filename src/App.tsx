import React, { useState, useEffect } from "react";
import { initializeProvider, connectMetaMask, getConnectedAddress, formatAddress } from "./utils/ethers";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { StudentView } from "./components/StudentView";
import { BookOpen, Wallet } from "lucide-react";

type View = "manager" | "student";

function App() {
  const [currentView, setCurrentView] = useState<View>("student");
  const [connected, setConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await initializeProvider();
        setConnected(true);

        const address = await getConnectedAddress();
        if (address) {
          setConnectedAddress(address);
        }
      } catch (err) {
        setError("Failed to connect to blockchain. Make sure Hardhat node is running on localhost:8545");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handleConnectMetaMask = async () => {
    try {
      const address = await connectMetaMask();
      setConnectedAddress(address);
      setConnected(true);
      setError(null);
    } catch (err: any) {
      setError(`Failed to connect MetaMask: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white mt-4">Connecting to blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Scholarship Distribution System</h1>
          </div>

          <div className="flex items-center gap-4">
            {connectedAddress && (
              <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-mono">
                  {formatAddress(connectedAddress).then((addr) => addr).catch(() => connectedAddress.substring(0, 10))}
                </span>
              </div>
            )}
            {!connected && (
              <button
                onClick={handleConnectMetaMask}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Connect MetaMask
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setCurrentView("student")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === "student"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            👨‍🎓 Student Portal
          </button>
          <button
            onClick={() => setCurrentView("manager")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === "manager"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            📊 Manager Dashboard
          </button>
        </div>

        {/* View Content */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          {currentView === "manager" ? <ManagerDashboard /> : <StudentView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6 text-center text-gray-400">
        <p>🔐 Scholarship Distribution System v1.0 - Built with Hardhat, React & Ethers.js</p>
        <p className="text-sm mt-2">
          Network: <span className="text-green-400">localhost:8545</span> | Smart Contract on Ethereum
        </p>
      </footer>
    </div>
  );
}

export default App;

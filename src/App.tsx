import React, { useState, useEffect } from "react";
import { initializeProvider, connectMetaMask, getConnectedAddress } from "./utils/ethers";
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
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await initializeProvider();
        setConnected(true);

        const address = await getConnectedAddress();
        if (address) {
          setConnectedAddress(address);
          setDisplayAddress(`${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
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
      setDisplayAddress(`${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
      setConnected(true);
      setError(null);
    } catch (err: any) {
      setError(`Failed to connect MetaMask: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-2 border-neutral-700 border-t-neutral-200"></div>
          <p className="text-neutral-200 mt-4 uppercase tracking-[0.12em] text-xs">Connecting to blockchain</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-neutral-300" />
            <h1 className="text-xl font-bold text-neutral-100 tracking-wide">Scholarship Distribution System</h1>
          </div>

          <div className="flex items-center gap-4">
            {connectedAddress && (
              <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 px-4 py-2">
                <Wallet className="w-4 h-4 text-neutral-300" />
                <span className="text-neutral-200 text-sm font-mono">
                  {displayAddress || `${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}`}
                </span>
              </div>
            )}
            {!connected && (
              <button
                onClick={handleConnectMetaMask}
                className="bg-neutral-100 hover:bg-neutral-300 text-neutral-950 px-4 py-2 font-semibold transition"
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
          <div className="mb-6 bg-neutral-900 border border-neutral-700 p-4 text-neutral-300">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border border-neutral-700 p-2 bg-neutral-900">
          <button
            onClick={() => setCurrentView("student")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all uppercase tracking-[0.08em] text-xs ${
              currentView === "student"
                ? "bg-neutral-100 text-neutral-950"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Student View
          </button>
          <button
            onClick={() => setCurrentView("manager")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all uppercase tracking-[0.08em] text-xs ${
              currentView === "manager"
                ? "bg-neutral-100 text-neutral-950"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            Manager Dashboard
          </button>
        </div>

        {/* View Content */}
        <div className="bg-neutral-900 border border-neutral-700 overflow-hidden">
          {currentView === "manager" ? <ManagerDashboard /> : <StudentView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-12 py-6 text-center text-neutral-500">
        <p>Scholarship Distribution System v1.0</p>
        <p className="text-sm mt-2">
          Network: <span className="text-neutral-300">localhost:8545</span>
        </p>
      </footer>
    </div>
  );
}

export default App;

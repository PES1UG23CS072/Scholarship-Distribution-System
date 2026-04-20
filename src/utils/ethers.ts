import { ethers } from "ethers";
import { CONTRACT_CONFIG, SCHOLARSHIP_ABI } from "./contract";

let provider: ethers.BrowserProvider | null = null;
let rpcProvider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Signer | null = null;
let contract: ethers.Contract | null = null;

const DEV_NO_WALLET = import.meta.env.VITE_DEV_NO_WALLET === "true";
const DEV_ACCOUNT_INDEX = Number(import.meta.env.VITE_DEV_ACCOUNT_INDEX ?? "0");

export function isNoWalletDevMode() {
  return DEV_NO_WALLET;
}

export function getNoWalletDevAccountIndex() {
  if (Number.isInteger(DEV_ACCOUNT_INDEX) && DEV_ACCOUNT_INDEX >= 0) {
    return DEV_ACCOUNT_INDEX;
  }
  return 0;
}

async function syncSignerAndContract() {
  if (!provider || typeof window === "undefined" || !(window as any).ethereum) {
    return null;
  }

  const accounts: string[] = await (window as any).ethereum.request({
    method: "eth_accounts",
  });

  if (!accounts || accounts.length === 0) {
    signer = null;
    return null;
  }

  signer = await provider.getSigner(accounts[0]);
  return await signer.getAddress();
}

export async function initializeProvider() {
  try {
    if (!rpcProvider) {
      rpcProvider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.PROVIDER_URL);
    }

    contract = new ethers.Contract(CONTRACT_CONFIG.ADDRESS, SCHOLARSHIP_ABI, rpcProvider);

    if (DEV_NO_WALLET) {
      signer = await rpcProvider.getSigner(getNoWalletDevAccountIndex());
      console.log("✅ Connected to local RPC signer (no-wallet mode)");
      return { provider: null, signer, contract };
    }

    // Check for injected provider (MetaMask, etc.)
    if (typeof window !== "undefined" && (window as any).ethereum) {
      provider = new ethers.BrowserProvider((window as any).ethereum);
      await syncSignerAndContract();
      console.log("✅ Connected to MetaMask");
      return { provider, signer, contract };
    } else {
      console.log("✅ Connected to RPC provider");
      return { provider: null, signer: null, contract };
    }
  } catch (error) {
    console.error("❌ Failed to initialize provider:", error);
    throw new Error("Failed to connect to blockchain");
  }
}

export function getProvider() {
  return provider;
}

export function getSigner() {
  return signer;
}

export function getContract() {
  if (!contract) {
    throw new Error("Contract not initialized. Call initializeProvider() first");
  }
  return contract;
}

export async function connectMetaMask() {
  try {
    if (DEV_NO_WALLET) {
      const address = await getConnectedAddress();
      if (!address) {
        throw new Error("No local RPC signer available");
      }
      return address;
    }

    if (typeof window !== "undefined" && (window as any).ethereum) {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      
      // Re-initialize provider with MetaMask
      await initializeProvider();
      await syncSignerAndContract();
      
      console.log("✅ Connected to MetaMask with account:", accounts[0]);
      return accounts[0];
    } else {
      throw new Error("MetaMask is not installed");
    }
  } catch (error) {
    console.error("❌ Failed to connect MetaMask:", error);
    throw error;
  }
}

export async function getConnectedAddress() {
  try {
    if (DEV_NO_WALLET) {
      if (!rpcProvider) {
        rpcProvider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.PROVIDER_URL);
      }

      signer = await rpcProvider.getSigner(getNoWalletDevAccountIndex());
      return await signer.getAddress();
    }

    if (typeof window !== "undefined" && (window as any).ethereum) {
      if (!provider) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
      }

      const syncedAddress = await syncSignerAndContract();
      if (syncedAddress) {
        return syncedAddress;
      }
    }

    if (signer) {
      return await signer.getAddress();
    }
    return null;
  } catch (error) {
    console.error("❌ Failed to get connected address:", error);
    return null;
  }
}

export async function formatAddress(address: string) {
  return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

export async function formatAmount(amount: bigint | string) {
  const value = typeof amount === "string" ? BigInt(amount) : amount;
  return ethers.formatEther(value);
}

export async function parseAmount(amount: string) {
  return ethers.parseEther(amount);
}

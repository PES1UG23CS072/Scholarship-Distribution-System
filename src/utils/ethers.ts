import { ethers } from "ethers";
import { CONTRACT_CONFIG, SCHOLARSHIP_ABI } from "./contract";

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let contract: ethers.Contract | null = null;

export async function initializeProvider() {
  try {
    // Check for injected provider (MetaMask, etc.)
    if (typeof window !== "undefined" && (window as any).ethereum) {
      provider = new ethers.BrowserProvider((window as any).ethereum);
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_CONFIG.ADDRESS, SCHOLARSHIP_ABI, signer);
      console.log("✅ Connected to MetaMask");
      return { provider, signer, contract };
    } else {
      // Fallback to RPC provider
      provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.PROVIDER_URL);
      contract = new ethers.Contract(CONTRACT_CONFIG.ADDRESS, SCHOLARSHIP_ABI, provider);
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
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      
      // Re-initialize provider with MetaMask
      await initializeProvider();
      
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

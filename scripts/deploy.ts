import { network } from "hardhat";

async function main() {
  console.log("🚀 Deploying Scholarship Distribution System...\n");

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();

  // Deploy using the viem toolbox (Hardhat 3)
  const scholarship = await viem.deployContract("Scholarship");

  console.log("✅ Scholarship contract deployed successfully!");
  console.log(`📜 Contract Address: ${scholarship.address}`);
  console.log(`🔗 Network: localhost:8545\n`);

  console.log(`👤 Deployer Address: ${deployer.account.address}\n`);

  // Output contract details for frontend
  console.log("========== FRONTEND CONFIGURATION ==========");
  console.log(`const CONTRACT_ADDRESS = "${scholarship.address}";`);
  console.log(`const PROVIDER_URL = "http://localhost:8545";`);
  console.log(`const ADMIN_ADDRESS = "${deployer.account.address}";\n`);

  console.log("========== NEXT STEPS ==========");
  console.log("1. Copy the CONTRACT_ADDRESS to your React frontend");
  console.log("2. Ensure Hardhat node is running: npx hardhat node");
  console.log("3. Import at least 1 ETH to your student account for testing");
  console.log("4. Start the React development server: npm run dev");
  console.log("==========================================\n");

  return scholarship.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

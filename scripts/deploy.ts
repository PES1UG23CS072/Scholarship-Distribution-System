import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Scholarship Distribution System...\n");

  // Get the contract factory
  const Scholarship = await ethers.getContractFactory("Scholarship");

  // Deploy the contract
  const scholarship = await Scholarship.deploy();
  
  console.log("⏳ Waiting for deployment transaction...");
  const deploymentTx = await scholarship.deploymentTransaction();
  
  if (deploymentTx) {
    await deploymentTx.wait(1);
  }

  console.log("✅ Scholarship contract deployed successfully!");
  console.log(`📜 Contract Address: ${scholarship.target}`);
  console.log(`🔗 Network: localhost:8545\n`);

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer Address: ${deployer.address}\n`);

  // Output contract details for frontend
  console.log("========== FRONTEND CONFIGURATION ==========");
  console.log(`const CONTRACT_ADDRESS = "${scholarship.target}";`);
  console.log(`const PROVIDER_URL = "http://localhost:8545";`);
  console.log(`const ADMIN_ADDRESS = "${deployer.address}";\n`);

  console.log("========== NEXT STEPS ==========");
  console.log("1. Copy the CONTRACT_ADDRESS to your React frontend");
  console.log("2. Ensure Hardhat node is running: npx hardhat node");
  console.log("3. Import at least 1 ETH to your student account for testing");
  console.log("4. Start the React development server: npm run dev");
  console.log("==========================================\n");

  return scholarship.target;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

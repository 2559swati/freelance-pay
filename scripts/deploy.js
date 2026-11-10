const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const F = await ethers.getContractFactory("FreelanceEscrow");

  // Constructor ko kitni values chahiye, ABI se pata karte hain
  const argCount = F.interface.deploy.inputs.length;
  console.log("Constructor arguments needed:", argCount);

  // 1 value chahiye to arbitrator = deployer (aapka wallet)
  const args = argCount === 1 ? [deployer.address] : [];
  const c = await F.deploy(...args);
  await c.waitForDeployment();

  console.log("Deployed to:", c.target);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
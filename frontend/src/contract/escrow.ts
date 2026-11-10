// src/contract/escrow.ts
import { ethers } from "ethers";
import abi from "./FreelanceEscrow.json";
import { CONTRACT_ADDRESS, CHAIN_ID } from "../config";

// Helper to get contract instance
const getContract = (signerOrProvider: ethers.Signer | ethers.Provider) =>
  new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signerOrProvider);

// ---------- WRITE ACTIONS ----------
export const createJob = async (
  signer: ethers.Signer,
  title: string,
  freelancer: string,
  deadline: number,
  valueEth: string
) => {
  const contract = getContract(signer);
  const tx = await contract.createJob(title, freelancer, deadline, {
    value: ethers.parseEther(valueEth),
    chainId: CHAIN_ID,
  });
  return await tx.wait();
};

export const submitWork = async (
  signer: ethers.Signer,
  jobId: number,
  cid: string
) => {
  const contract = getContract(signer);
  const tx = await contract.submitWork(jobId, cid, { chainId: CHAIN_ID });
  return await tx.wait();
};

export const approve = async (signer: ethers.Signer, jobId: number) => {
  const contract = getContract(signer);
  const tx = await contract.approve(jobId, { chainId: CHAIN_ID });
  return await tx.wait();
};

export const refund = async (signer: ethers.Signer, jobId: number) => {
  const contract = getContract(signer);
  const tx = await contract.refund(jobId, { chainId: CHAIN_ID });
  return await tx.wait();
};

export const raiseDispute = async (signer: ethers.Signer, jobId: number) => {
  const contract = getContract(signer);
  const tx = await contract.raiseDispute(jobId, { chainId: CHAIN_ID });
  return await tx.wait();
};

export const resolveDispute = async (
  signer: ethers.Signer,
  jobId: number,
  payFreelancer: boolean
) => {
  const contract = getContract(signer);
  const tx = await contract.resolveDispute(jobId, payFreelancer, {
    chainId: CHAIN_ID,
  });
  return await tx.wait();
};

// ---------- READ HELPERS ----------
export const getJobsByClient = async (
  provider: ethers.Provider,
  client: string
) => {
  const contract = getContract(provider);
  return await contract.getJobsByClient(client);
};

export const getJobsByFreelancer = async (
  provider: ethers.Provider,
  freelancer: string
) => {
  const contract = getContract(provider);
  return await contract.getJobsByFreelancer(freelancer);
};

export const getJob = async (provider: ethers.Provider, id: number) => {
  const contract = getContract(provider);
  return await contract.jobs(id);
};

export const getJobCount = async (provider: ethers.Provider) => {
  const contract = getContract(provider);
  return await contract.jobCount();
};

export const getArbitrator = async (provider: ethers.Provider) => {
  const contract = getContract(provider);
  return await contract.arbitrator();
};

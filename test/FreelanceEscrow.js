const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FreelanceEscrow", function () {
    let escrow, owner, arbitrator, client, freelancer, stranger;
    const amount = ethers.parseEther("1");

    beforeEach(async () => {
        [owner, arbitrator, client, freelancer, stranger] = await ethers.getSigners();
        const F = await ethers.getContractFactory("FreelanceEscrow");
        escrow = await F.deploy(arbitrator.address);
    });

    async function newJob() {
        const deadline = (await time.latest()) + 7 * 24 * 3600;
        await escrow.connect(client).createJob("Logo", freelancer.address, deadline, { value: amount });
        return deadline;
    }

    it("job create hota hai aur funds lock hote hain", async () => {
        await newJob();
        expect(await ethers.provider.getBalance(escrow.target)).to.equal(amount);
    });

    it("freelancer ke alawa koi submit nahi kar sakta", async () => {
        await newJob();
        await expect(escrow.connect(stranger).submitWork(1, "Qm123"))
            .to.be.revertedWith("Not freelancer");
    });

    it("approve par freelancer ko 99% aur owner ko 1% fee milti hai", async () => {
        await newJob();
        await escrow.connect(freelancer).submitWork(1, "Qm123");
        await expect(escrow.connect(client).approve(1))
            .to.changeEtherBalances([freelancer, owner], [(amount * 99n) / 100n, amount / 100n]);
    });

    it("deadline se pehle refund fail hota hai", async () => {
        await newJob();
        await expect(escrow.connect(client).refund(1))
            .to.be.revertedWith("Not refundable");
    });

    it("deadline ke baad client ko refund milta hai", async () => {
        const d = await newJob();
        await time.increaseTo(d + 1);
        await expect(escrow.connect(client).refund(1))
            .to.changeEtherBalance(client, amount);
    });

    it("dispute: arbitrator freelancer ko pay kar sakta hai", async () => {
        await newJob();
        await escrow.connect(freelancer).submitWork(1, "Qm123");
        await escrow.connect(client).raiseDispute(1);
        await expect(escrow.connect(arbitrator).resolveDispute(1, true))
            .to.changeEtherBalance(freelancer, (amount * 99n) / 100n);
    });

    it("dispute: arbitrator client ko refund de sakta hai", async () => {
        await newJob();
        await escrow.connect(freelancer).submitWork(1, "Qm123");
        await escrow.connect(freelancer).raiseDispute(1);
        await expect(escrow.connect(arbitrator).resolveDispute(1, false))
            .to.changeEtherBalance(client, amount);
    });

    it("arbitrator ke alawa koi dispute resolve nahi kar sakta", async () => {
        await newJob();
        await escrow.connect(freelancer).submitWork(1, "Qm123");
        await escrow.connect(client).raiseDispute(1);
        await expect(escrow.connect(stranger).resolveDispute(1, true))
            .to.be.revertedWith("Not arbitrator");
    });

    it("getJobsByClient sahi jobs deta hai", async () => {
        await newJob();
        const list = await escrow.getJobsByClient(client.address);
        expect(list.length).to.equal(1);
        expect(list[0].title).to.equal("Logo");
    });
});
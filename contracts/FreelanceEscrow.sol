// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FreelanceEscrow is Ownable, ReentrancyGuard {
    enum Status { Funded, Submitted, Completed, Refunded, Disputed }

    struct Job {
        address client;
        address freelancer;
        uint256 amount;
        uint256 deadline;
        string workCid;
        string title;          // <-- new
        uint256 createdAt;     // <-- new
        Status status;
    }

    uint256 public jobCount;
    uint256 public platformFee = 100; // basis points = 1%
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5%
    address public arbitrator;

    mapping(uint256 => Job) public jobs;

    // ------- Events -------
    event JobCreated(
        uint256 indexed id,
        address client,
        address freelancer,
        uint256 amount,
        string title,
        uint256 createdAt
    );
    event WorkSubmitted(uint256 indexed id, string cid);
    event PaymentReleased(uint256 indexed id);
    event Refunded(uint256 indexed id);
    event DisputeRaised(uint256 indexed id, address raiser);
    event DisputeResolved(uint256 indexed id, bool payFreelancer);
    event PlatformFeeChanged(uint256 newFee);

    // ------- Constructor -------
    constructor(address _arbitrator) Ownable(msg.sender) {
        require(_arbitrator != address(0), "Arbitrator address zero");
        arbitrator = _arbitrator;
    }

    // ------- Owner‑only setters -------
    function setArbitrator(address _arb) external onlyOwner {
        require(_arb != address(0), "Arbitrator zero");
        arbitrator = _arb;
    }

    function setPlatformFee(uint256 _feeBasisPoints) external onlyOwner {
        require(_feeBasisPoints <= MAX_PLATFORM_FEE, "Fee > 5%");
        platformFee = _feeBasisPoints;
        emit PlatformFeeChanged(_feeBasisPoints);
    }

    // ------- Core workflow -------
    function createJob(
        string calldata _title,
        address _freelancer,
        uint256 _deadline
    ) external payable returns (uint256) {
        require(msg.value > 0, "Send funds");
        require(_freelancer != address(0) && _freelancer != msg.sender, "Bad freelancer");
        require(_deadline > block.timestamp, "Bad deadline");

        jobCount++;
        jobs[jobCount] = Job(
            msg.sender,
            _freelancer,
            msg.value,
            _deadline,
            "",
            _title,
            block.timestamp,
            Status.Funded
        );

        emit JobCreated(jobCount, msg.sender, _freelancer, msg.value, _title, block.timestamp);
        return jobCount;
    }

    function submitWork(uint256 id, string calldata cid) external {
        Job storage job = jobs[id];
        require(msg.sender == job.freelancer, "Not freelancer");
        require(job.status == Status.Funded, "Not funded");
        job.workCid = cid;
        job.status = Status.Submitted;
        emit WorkSubmitted(id, cid);
    }

    function approve(uint256 id) external nonReentrant {
        Job storage job = jobs[id];
        require(msg.sender == job.client, "Only client");
        require(job.status == Status.Submitted, "Work not submitted");

        // ---- platform fee ----
        uint256 fee = (job.amount * platformFee) / 10_000; // basis points
        uint256 toFreelancer = job.amount - fee;

        job.status = Status.Completed;
        payable(job.freelancer).transfer(toFreelancer);
        if (fee > 0) {
            payable(owner()).transfer(fee);
        }
        emit PaymentReleased(id);
    }

    function refund(uint256 id) external nonReentrant {
        Job storage job = jobs[id];
        require(msg.sender == job.client, "Only client");
        require(job.status == Status.Funded, "Not refundable");
        require(block.timestamp > job.deadline, "Not refundable");

        job.status = Status.Refunded;
        payable(job.client).transfer(job.amount);
        emit Refunded(id);
    }

    // ------- Dispute flow -------
    function raiseDispute(uint256 id) external {
        Job storage job = jobs[id];
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Only participant"
        );
        require(job.status == Status.Submitted, "Can dispute only after submit");
        job.status = Status.Disputed;
        emit DisputeRaised(id, msg.sender);
    }

    function resolveDispute(uint256 id, bool payFreelancer) external nonReentrant {
        require(msg.sender == arbitrator, "Not arbitrator");
        Job storage job = jobs[id];
        require(job.status == Status.Disputed, "Not disputed");

        uint256 fee = (job.amount * platformFee) / 10_000;
        if (payFreelancer) {
            uint256 payout = job.amount - fee;
            job.status = Status.Completed;
            payable(job.freelancer).transfer(payout);
            if (fee > 0) {
                payable(owner()).transfer(fee);
            }
        } else {
            // Refund client full amount, no platform fee deducted
            job.status = Status.Refunded;
            payable(job.client).transfer(job.amount);
        }
        emit DisputeResolved(id, payFreelancer);
    }

    // ------- View helpers -------
    function getJobsByClient(address client) external view returns (Job[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].client == client) count++;
        }
        Job[] memory result = new Job[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].client == client) {
                result[idx++] = jobs[i];
            }
        }
        return result;
    }

    function getJobsByFreelancer(address freelancer) external view returns (Job[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].freelancer == freelancer) count++;
        }
        Job[] memory result = new Job[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].freelancer == freelancer) {
                result[idx++] = jobs[i];
            }
        }
        return result;
    }
}

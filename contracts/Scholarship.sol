// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Scholarship Distribution System
 * @dev Smart contract for managing scholarship allocations with Proof of Authority (PoA) model
 */
contract Scholarship is Ownable {
    /**
     * @dev Initialize the contract with the deployer as the admin (PoA authority)
     */
    constructor() Ownable(msg.sender) {}

    // Scholarship status enum
    enum ScholarshipStatus {
        PENDING,
        VERIFIED,
        RELEASED
    }

    // Scholarship struct with all required details
    struct ScholarshipRecord {
        string uid;                  // Unique scholarship ID
        address studentAddress;       // Student's wallet address
        uint256 amount;              // Scholarship amount in wei
        ScholarshipStatus status;    // Current status
        uint256 timestamp;           // Record creation timestamp
    }

    // Mappings
    mapping(string => ScholarshipRecord) public scholarships;
    mapping(address => string[]) public studentScholarships;
    string[] public allScholarshipIds;

    // Events for immutable audit trail
    event ScholarshipAllocated(
        string indexed uid,
        address indexed studentAddress,
        uint256 amount,
        uint256 timestamp
    );

    event ScholarshipVerified(
        string indexed uid,
        address indexed studentAddress,
        uint256 timestamp
    );

    event ScholarshipReleased(
        string indexed uid,
        address indexed studentAddress,
        uint256 amount,
        uint256 timestamp
    );

    event StatusChanged(
        string indexed uid,
        uint8 newStatus,
        uint256 timestamp
    );

    /**
     * @dev Modifier to ensure only admin (owner) can execute critical functions
     */
    modifier onlyAdmin() {
        require(msg.sender == owner(), "Only admin can perform this action");
        _;
    }

    /**
     * @dev Admin posts a new scholarship allocation
     * @param _uid Unique scholarship ID
     * @param _studentAddress Address of the scholarship recipient
     * @param _amount Scholarship amount in wei
     */
    function postAllocation(
        string memory _uid,
        address _studentAddress,
        uint256 _amount
    ) external onlyAdmin {
        require(_studentAddress != address(0), "Invalid student address");
        require(_amount > 0, "Amount must be greater than 0");
        require(scholarships[_uid].timestamp == 0, "Scholarship UID already exists");

        ScholarshipRecord memory newScholarship = ScholarshipRecord({
            uid: _uid,
            studentAddress: _studentAddress,
            amount: _amount,
            status: ScholarshipStatus.PENDING,
            timestamp: block.timestamp
        });

        scholarships[_uid] = newScholarship;
        studentScholarships[_studentAddress].push(_uid);
        allScholarshipIds.push(_uid);

        emit ScholarshipAllocated(_uid, _studentAddress, _amount, block.timestamp);
        emit StatusChanged(_uid, uint8(ScholarshipStatus.PENDING), block.timestamp);
    }

    /**
     * @dev Admin verifies a student's eligibility
     * @param _uid Unique scholarship ID
     */
    function verifyEligibility(string memory _uid) external onlyAdmin {
        require(scholarships[_uid].timestamp != 0, "Scholarship not found");
        require(
            scholarships[_uid].status == ScholarshipStatus.PENDING,
            "Scholarship is not in PENDING status"
        );

        scholarships[_uid].status = ScholarshipStatus.VERIFIED;
        emit ScholarshipVerified(
            _uid,
            scholarships[_uid].studentAddress,
            block.timestamp
        );
        emit StatusChanged(_uid, uint8(ScholarshipStatus.VERIFIED), block.timestamp);
    }

    /**
     * @dev Admin releases funds to a verified scholarship
     * @param _uid Unique scholarship ID
     */
    function releaseFunds(string memory _uid) external payable onlyAdmin {
        require(scholarships[_uid].timestamp != 0, "Scholarship not found");
        require(
            scholarships[_uid].status == ScholarshipStatus.VERIFIED,
            "Scholarship is not VERIFIED"
        );

        uint256 amount = scholarships[_uid].amount;
        address studentAddress = scholarships[_uid].studentAddress;

        scholarships[_uid].status = ScholarshipStatus.RELEASED;

        // Transfer funds to the student
        (bool success, ) = payable(studentAddress).call{value: amount}("");
        require(success, "Fund transfer failed");

        emit ScholarshipReleased(_uid, studentAddress, amount, block.timestamp);
        emit StatusChanged(_uid, uint8(ScholarshipStatus.RELEASED), block.timestamp);
    }

    /**
     * @dev Get scholarship details by UID
     * @param _uid Unique scholarship ID
     */
    function getScholarship(string memory _uid)
        external
        view
        returns (ScholarshipRecord memory)
    {
        require(scholarships[_uid].timestamp != 0, "Scholarship not found");
        return scholarships[_uid];
    }

    /**
     * @dev Get all scholarship IDs for a student
     * @param _studentAddress Student's wallet address
     */
    function getStudentScholarships(address _studentAddress)
        external
        view
        returns (string[] memory)
    {
        return studentScholarships[_studentAddress];
    }

    /**
     * @dev Get total number of scholarships
     */
    function getTotalScholarships() external view returns (uint256) {
        return allScholarshipIds.length;
    }

    /**
     * @dev Get all scholarship IDs (pagination support)
     */
    function getAllScholarships()
        external
        view
        returns (string[] memory)
    {
        return allScholarshipIds;
    }

    /**
     * @dev Receive ETH transfers
     */
    receive() external payable {}
}

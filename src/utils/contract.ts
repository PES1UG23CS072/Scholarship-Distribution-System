// Contract ABI generated from Scholarship.sol
export const SCHOLARSHIP_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_uid", type: "string" },
      { internalType: "address", name: "_studentAddress", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "postAllocation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_uid", type: "string" }],
    name: "verifyEligibility",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_uid", type: "string" }],
    name: "releaseFunds",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_uid", type: "string" }],
    name: "getScholarship",
    outputs: [
      {
        components: [
          { internalType: "string", name: "uid", type: "string" },
          { internalType: "address", name: "studentAddress", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "enum Scholarship.ScholarshipStatus", name: "status", type: "uint8" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct Scholarship.ScholarshipRecord",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_studentAddress", type: "address" }],
    name: "getStudentScholarships",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllScholarships",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalScholarships",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "uid", type: "string" },
      { indexed: true, internalType: "address", name: "studentAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ScholarshipAllocated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "uid", type: "string" },
      { indexed: true, internalType: "address", name: "studentAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ScholarshipVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "uid", type: "string" },
      { indexed: true, internalType: "address", name: "studentAddress", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ScholarshipReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "uid", type: "string" },
      { indexed: false, internalType: "uint8", name: "newStatus", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "StatusChanged",
    type: "event",
  },
];

// Contract configuration - UPDATE THESE AFTER DEPLOYMENT
export const CONTRACT_CONFIG = {
  // Get this from the deploy script output
  ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afccda63c02B74812e94f9b167F9",
  PROVIDER_URL: import.meta.env.VITE_PROVIDER_URL || "http://localhost:8545",
};

// Status mapping
export const STATUS_LABELS = {
  0: "PENDING",
  1: "VERIFIED",
  2: "RELEASED",
};

export const STATUS_COLORS = {
  0: "bg-neutral-900 text-neutral-300 border-neutral-700",
  1: "bg-neutral-800 text-neutral-200 border-neutral-600",
  2: "bg-neutral-100 text-neutral-900 border-neutral-300",
};

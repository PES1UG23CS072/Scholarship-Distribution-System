import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ScholarshipModule = buildModule("ScholarshipModule", (m) => {
  const scholarship = m.contract("Scholarship");

  return { scholarship };
});

export default ScholarshipModule;

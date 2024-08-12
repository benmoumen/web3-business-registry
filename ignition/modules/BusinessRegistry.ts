import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BusinessRegistryModule = buildModule("BusinessRegistryModule", (m) => {
  const br = m.contract("BusinessRegistry");

  return { br };
});

export default BusinessRegistryModule;

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_OWNER = "0xbd77EdfF1C0428aD49F1B465E926EEA36d52b09F";

const BRModule = buildModule("TokenizedBusinessRegistry", (m) => {
  const br = m.contract("TokenizedBusinessRegistry", [CONTRACT_OWNER]);

  return { br };
});

export default BRModule;

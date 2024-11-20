import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_OWNER = "0xbd77EdfF1C0428aD49F1B465E926EEA36d52b09F";

const ProxyModule = buildModule("ProxyModule", (builder) => {
  // Deploy the implementation contract
  const implementation = builder.contract("CompanySharesAsTokens");

  // Encode the initialize function call for the contract.
  const initialize = builder.encodeFunctionCall(implementation, "initialize", [
    CONTRACT_OWNER,
    "https://govchain.technology/tokens/",
  ]);

  // Deploy the ERC1967 Proxy, pointing to the implementation
  const proxy = builder.contract("ERC1967Proxy", [implementation, initialize]);

  return { proxy };
});

export const CompanySharesAsTokensModule = buildModule(
  "CompanySharesAsTokensModule",
  (builder) => {
    // Get the proxy from the previous module.
    const { proxy } = builder.useModule(ProxyModule);

    // Create a contract instance using the deployed proxy's address.
    const instance = builder.contractAt("CompanySharesAsTokens", proxy);

    return { instance, proxy };
  }
);

export default CompanySharesAsTokensModule;

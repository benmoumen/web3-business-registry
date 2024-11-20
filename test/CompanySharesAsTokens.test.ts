// test/CompanySharesAsTokens.test.ts

import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { CompanySharesAsTokens } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("CompanySharesAsTokens", function () {
  type CompanyStruct = {
    name: string;
    registrationData: string;
    totalShares: number;
  };

  const companyData: CompanyStruct = {
    name: "My Company",
    registrationData: "123456789",
    totalShares: 1000,
  };

  async function deployFixture() {
    let br: CompanySharesAsTokens;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addr3: SignerWithAddress;
    let otherAccounts: SignerWithAddress[];

    [owner, addr1, addr2, addr3, ...otherAccounts] = await ethers.getSigners();

    // Deploy the implementation contract
    const implementationFactory = await ethers.getContractFactory(
      "CompanySharesAsTokens"
    );
    const implementation = await implementationFactory.deploy();
    await implementation.waitForDeployment();

    // Encode the initialize function call
    const initializeData = implementationFactory.interface.encodeFunctionData(
      "initialize",
      [owner.address, "https://govchain.technology/tokens/"]
    );

    // Deploy the ERC1967 Proxy, pointing to the implementation
    const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await proxyFactory.deploy(
      implementation.getAddress(),
      initializeData
    );
    await proxy.waitForDeployment();

    // Create a contract instance using the deployed proxy's address
    br = (await ethers.getContractAt(
      "CompanySharesAsTokens",
      await proxy.getAddress()
    )) as CompanySharesAsTokens;

    return { br, owner, addr1, addr2, addr3, otherAccounts };
  }

  describe("Deployment", function () {
    it("should initialize correctly", async function () {
      const { br } = await loadFixture(deployFixture);
      expect(await br.name()).to.equal("Company Tokens");
      expect(await br.symbol()).to.equal("COTO");
    });

    it("should set the correct owner", async function () {
      const { br, owner } = await loadFixture(deployFixture);
      expect(await br.owner()).to.equal(owner.address);
    });

    it("should have the correct initial URI", async function () {
      const { br } = await loadFixture(deployFixture);
      const initialURI = await br.uri(1);
      expect(initialURI).to.equal("https://govchain.technology/tokens/1.json");
    });
  });

  describe("Company Registration", function () {
    it("should register a company and emit CompanyRegistered event", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      const tx = await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(tx)
        .to.emit(br, "CompanyRegistered")
        .withArgs(1, companyData.name, companyData.registrationData);

      const companyDetails = await br.getCompanyDetails(1);
      expect(companyDetails._name).to.equal(companyData.name);
      expect(companyDetails._registrationData).to.equal(
        companyData.registrationData
      );
      expect(companyDetails._shareholders[0]).to.equal(owner.address);
      expect(companyDetails._shareAmounts[0]).to.equal(companyData.totalShares);
      expect(companyDetails._totalShares).to.equal(companyData.totalShares);
    });

    it("should increment nextCompanyId after registration", async function () {
      const { br } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      // Since nextCompanyId is internal, we can't access it directly.
      // Instead, we can register another company and check that its ID is incremented.
      await br.registerCompany("Another Company", "987654321", [], []);

      const companyDetails = await br.getCompanyDetails(2);
      expect(companyDetails._name).to.equal("Another Company");
    });

    it("should revert if shareholders and shares lengths mismatch", async function () {
      const { br } = await loadFixture(deployFixture);

      await expect(
        br.registerCompany(
          companyData.name,
          companyData.registrationData,
          [ethers.ZeroAddress],
          []
        )
      ).to.be.revertedWith("Shareholders and amounts length mismatch");
    });

    it("should only allow owner to register companies", async function () {
      const { br, addr1 } = await loadFixture(deployFixture);

      await expect(
        br
          .connect(addr1)
          .registerCompany(
            companyData.name,
            companyData.registrationData,
            [],
            []
          )
      ).to.be.reverted;
    });
  });

  describe("Share Issuance", function () {
    it("should issue shares to existing shareholders", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await br.issueShares(1, [owner.address], [500]);

      const companyDetails = await br.getCompanyDetails(1);
      expect(companyDetails._shareAmounts[0]).to.equal(
        companyData.totalShares + 500
      );
      expect(companyDetails._totalShares).to.equal(
        companyData.totalShares + 500
      );
    });

    it("should emit SharesMinted event when issuing shares", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(br.issueShares(1, [owner.address], [500]))
        .to.emit(br, "SharesMinted")
        .withArgs(1, [owner.address], [500n]);
    });

    it("should revert if non-owner tries to issue shares", async function () {
      const { br, owner, addr1 } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(br.connect(addr1).issueShares(1, [addr1.address], [100])).to
        .be.reverted;
    });

    it("should revert if arrays length mismatch in issueShares", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(br.issueShares(1, [owner.address], [])).to.be.revertedWith(
        "Shareholders and amounts length mismatch"
      );
    });
  });

  describe("Enumerable Behavior", function () {
    it("should return owned token IDs for an address", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      // Register a company and assign tokens to the owner
      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      // Check owned tokens for the owner
      const ownedTokens = await br.getOwnedTokens(owner.address);
      expect(ownedTokens.length).to.equal(1);
      expect(ownedTokens[0]).to.equal(1); // Company ID is 1
    });

    it("should update owned tokens on transfer", async function () {
      const { br, owner, addr1 } = await loadFixture(deployFixture);

      // Register a company and assign tokens to the owner
      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      // Transfer tokens to another account
      await br.safeTransferFrom(owner.address, addr1.address, 1, 100, "0x");

      // Verify tokens of the other account
      const otherOwnedTokens = await br.getOwnedTokens(addr1.address);
      expect(otherOwnedTokens.length).to.equal(1);
      expect(otherOwnedTokens[0]).to.equal(1);

      // Verify tokens of the owner
      const ownerOwnedTokens = await br.getOwnedTokens(owner.address);
      expect(ownerOwnedTokens.length).to.equal(1);
      expect(ownerOwnedTokens[0]).to.equal(1);
    });

    it("should clear token ID when balance reaches zero", async function () {
      const { br, owner, addr1 } = await loadFixture(deployFixture);

      // Register a company and assign tokens to the owner
      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      // Transfer all tokens to another account
      await br.safeTransferFrom(
        owner.address,
        addr1.address,
        1,
        companyData.totalShares,
        "0x"
      );

      // Verify the owner's tokens are cleared
      const ownerOwnedTokens = await br.getOwnedTokens(owner.address);
      expect(ownerOwnedTokens.length).to.equal(0);

      // Verify the other account now owns the token
      const otherOwnedTokens = await br.getOwnedTokens(addr1.address);
      expect(otherOwnedTokens.length).to.equal(1);
      expect(otherOwnedTokens[0]).to.equal(1);
    });

    it("should handle multiple token IDs correctly", async function () {
      const { br, owner, addr1 } = await loadFixture(deployFixture);

      // Register multiple companies and assign tokens to the owner
      await br.registerCompany("Company A", "Data A", [owner.address], [500]);
      await br.registerCompany("Company B", "Data B", [owner.address], [300]);
      await br.registerCompany("Company C", "Data C", [addr1.address], [200]);

      // Check owned tokens for the owner
      const ownerOwnedTokens = await br.getOwnedTokens(owner.address);
      expect(
        ownerOwnedTokens.map((tokenId: BigInt) => Number(tokenId))
      ).to.include.members([1, 2]);

      // Check owned tokens for the other account
      const otherOwnedTokens = await br.getOwnedTokens(addr1.address);
      expect(
        otherOwnedTokens.map((tokenId: BigInt) => Number(tokenId))
      ).to.include(3);
    });
  });

  describe("Role Management", function () {
    it("should assign a role and emit RoleAssigned event", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      const tx = await br.assignRole(1, owner.address, "Admin");

      await expect(tx)
        .to.emit(br, "RoleAssigned")
        .withArgs(1, owner.address, "Admin", anyValue);

      const roles = await br.getAssignedRoles(1, owner.address);
      expect(roles.length).to.equal(1);
      expect(roles[0].roleName).to.equal("Admin");
      expect(roles[0].isActive).to.be.true;
    });

    it("should revoke a role and emit RoleRevoked event", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await br.assignRole(1, owner.address, "Admin");
      const tx = await br.revokeRole(1, owner.address, "Admin");

      await expect(tx)
        .to.emit(br, "RoleRevoked")
        .withArgs(1, owner.address, "Admin", anyValue);

      const roles = await br.getAssignedRoles(1, owner.address);
      expect(roles.length).to.equal(1);
      expect(roles[0].roleName).to.equal("Admin");
      expect(roles[0].isActive).to.be.false;
    });

    it("should prevent double assignment of roles", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await br.assignRole(1, owner.address, "Manager");

      await expect(
        br.assignRole(1, owner.address, "Manager")
      ).to.be.revertedWith("Role already assigned");
    });

    it("should prevent revoking unassigned roles", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(
        br.revokeRole(1, owner.address, "Manager")
      ).to.be.revertedWith("Role not assigned");
    });

    it("should only allow owner to assign roles", async function () {
      const { br, addr1 } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(br.connect(addr1).assignRole(1, addr1.address, "Manager")).to
        .be.reverted;
    });
  });

  describe("Token Transfers", function () {
    it("should transfer shares and update holders", async function () {
      const { br, owner, addr1 } = await loadFixture(deployFixture);

      // Register a company and issue shares
      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [100]
      );

      // Transfer shares from owner to addr1
      await br
        .connect(owner)
        .safeTransferFrom(owner.address, addr1.address, 1, 50, "0x");

      // Check balances
      expect(await br.balanceOf(owner.address, 1)).to.equal(50);
      expect(await br.balanceOf(addr1.address, 1)).to.equal(50);

      // Check token holders
      const tokenHolders = await br.getTokenHolders(1);
      expect(tokenHolders).to.include.members([owner.address, addr1.address]);

      // Check owned tokens
      const ownerTokens = await br.getOwnedTokens(owner.address);
      const addr1Tokens = await br.getOwnedTokens(addr1.address);
      expect(ownerTokens.map((id: BigInt) => Number(id))).to.include(1);
      expect(addr1Tokens.map((id: BigInt) => Number(id))).to.include(1);
    });
  });

  describe("Total Supply Management", function () {
    it("should update total supply on mint and burn", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      // Register a company and issue shares
      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [500]
      );

      // Total supply should be 100
      expect(await br.totalSupply(1)).to.equal(500);

      // Burn some tokens
      await br.connect(owner).burn(owner.address, 1, 200);

      // Total supply should be 80
      expect(await br.totalSupply(1)).to.equal(300);

      // Balance of owner should be 80
      expect(await br.balanceOf(owner.address, 1)).to.equal(300);
    });

    it("should return correct totalSupply and exists", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      // Before any companies are registered
      expect(await br.exists(1)).to.be.false;
      expect(await br.totalSupply(1)).to.equal(0);

      // Register a company and issue shares
      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [100]
      );

      expect(await br.exists(1)).to.be.true;
      expect(await br.totalSupply(1)).to.equal(100);
    });
  });

  describe("URI Management", function () {
    it("should return the correct URI for a registered company", async function () {
      const { br } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      const companyId = 1;
      const expectedUri = `https://govchain.technology/tokens/${companyId}.json`;
      expect(await br.uri(companyId)).to.equal(expectedUri);
    });

    it("should allow the owner to update the base URI", async function () {
      const { br } = await loadFixture(deployFixture);

      await br.setBaseURI("https://newuri.com/tokens/");
      expect(await br.uri(1)).to.equal("https://newuri.com/tokens/1.json");
    });

    it("should only allow owner to set base URI", async function () {
      const { br, addr1 } = await loadFixture(deployFixture);

      await expect(br.connect(addr1).setBaseURI("https://unauthorized.com/")).to
        .be.reverted;
    });
  });

  describe("Edge Case Tests", function () {
    it("should not allow zero address in assignRole", async function () {
      const { br } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(
        br.assignRole(1, ethers.ZeroAddress, "Manager")
      ).to.be.revertedWith("Invalid address");
    });

    it("should not allow empty role name", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(br.assignRole(1, owner.address, "")).to.be.revertedWith(
        "Role name is empty"
      );
    });

    it("should not allow zero address in share issuance", async function () {
      const { br } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(
        br.issueShares(1, [ethers.ZeroAddress], [100])
      ).to.be.revertedWith("Invalid address");
    });

    it("should not allow zero share amount in share issuance", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(br.issueShares(1, [owner.address], [0])).to.be.revertedWith(
        "Amount must be greater than zero"
      );
    });

    it("should not allow mismatched arrays in share issuance", async function () {
      const { br, owner } = await loadFixture(deployFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(
        br.issueShares(1, [owner.address], [100, 200])
      ).to.be.revertedWith("Shareholders and amounts length mismatch");
    });
  });
});

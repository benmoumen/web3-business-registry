import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenizedBusinessRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("TokenizedBusinessRegistry", function () {
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

  async function deployBRFixture() {
    let br: TokenizedBusinessRegistry;
    let owner: SignerWithAddress;
    let otherAccount: SignerWithAddress;

    [owner, otherAccount] = await ethers.getSigners();

    br = await ethers.deployContract(
      "TokenizedBusinessRegistry",
      [owner.address],
      {}
    );

    await br.waitForDeployment();

    return { br, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("should initialize correctly", async function () {
      const { br } = await loadFixture(deployBRFixture);
      expect(await br.nextCompanyId()).to.equal(1);
    });

    it("should set the correct owner", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);
      expect(await br.owner()).to.equal(owner.address);
    });
  });

  describe("Company Registration", function () {
    it("should register a company and emit CompanyRegistered event", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

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
      expect(companyDetails[0]).to.equal(companyData.name);
      expect(companyDetails[1]).to.equal(companyData.registrationData);
      expect(companyDetails[2][0]).to.equal(owner.address);
      expect(companyDetails[3][0]).to.equal(companyData.totalShares);
      expect(companyDetails[4]).to.equal(companyData.totalShares);
    });

    it("should increment the nextCompanyId after registration", async function () {
      const { br } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      expect(await br.nextCompanyId()).to.equal(2);
    });

    it("should revert if shareholders and shares lengths mismatch", async function () {
      const { br } = await loadFixture(deployBRFixture);

      await expect(
        br.registerCompany(
          companyData.name,
          companyData.registrationData,
          [ethers.ZeroAddress],
          []
        )
      ).to.be.revertedWith(
        "CompanyShares: Shareholders and amounts length mismatch"
      );
    });

    it("should revert if trying to mint shares to the zero address", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await expect(
        br.registerCompany(
          companyData.name,
          companyData.registrationData,
          [ethers.ZeroAddress],
          [companyData.totalShares]
        )
      ).to.be.revertedWith("address cant be 0");

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(
        br.issueShares(1, [ethers.ZeroAddress], [500])
      ).to.be.revertedWith("address cant be 0");
    });

    it("should handle multiple companies correctly", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        "Company One",
        "Data One",
        [owner.address],
        [500]
      );

      await br.registerCompany(
        "Company Two",
        "Data Two",
        [owner.address],
        [1000]
      );

      const companyOneDetails = await br.getCompanyDetails(1);
      const companyTwoDetails = await br.getCompanyDetails(2);

      expect(companyOneDetails[0]).to.equal("Company One");
      expect(companyOneDetails[4]).to.equal(500);

      expect(companyTwoDetails[0]).to.equal("Company Two");
      expect(companyTwoDetails[4]).to.equal(1000);
    });
  });

  describe("Share Issuance", function () {
    it("should issue shares to existing shareholders", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await br.issueShares(1, [owner.address], [500]);

      const companyDetails = await br.getCompanyDetails(1);
      expect(companyDetails[3][0]).to.equal(companyData.totalShares + 500);
      expect(companyDetails[4]).to.equal(companyData.totalShares + 500);
    });

    it("should emit SharesMinted event when issuing shares", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(br.issueShares(1, [owner.address], [500]))
        .to.emit(br, "SharesMinted")
        .withArgs(1, [owner.address], [500]);
    });

    it("should revert if trying to issue shares for a non-existent company", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await expect(
        br.issueShares(2, [owner.address], [500])
      ).to.be.revertedWith("CompanyShares: Company does not exist");
    });

    it("should revert if shareholders and shares lengths mismatch during issuance", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(br.issueShares(1, [owner.address], [])).to.be.revertedWith(
        "CompanyShares: Shareholders and amounts length mismatch"
      );
    });

    it("should revert if trying to mint zero shares", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await expect(
        br.registerCompany(
          companyData.name,
          companyData.registrationData,
          [owner.address],
          [0] // Minting zero shares
        )
      ).to.be.reverted;

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(br.issueShares(1, [owner.address], [0])).to.be.reverted;
    });

    it("should increase the correct amount of shares to the balance of the shareholder", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await br.issueShares(1, [owner.address, owner.address], [500, 500]);

      // connect to the owner.address and get the balance of the token ID 1
      const balance = await br.balanceOf(owner.address, 1);
      expect(balance).to.equal(500 + 500 + companyData.totalShares);
    });
  });

  describe("Role Management", function () {
    it("should assign a role to an account and emit RoleAssigned event", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      // Assign the role
      const tx = await br.assignRole(1, owner.address, "Admin");

      // Get the block timestamp from the transaction receipt
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(
        receipt?.blockNumber || "latest"
      );
      const blockTimestamp = block?.timestamp;

      // Expect the RoleAssigned event with the correct arguments
      await expect(tx)
        .to.emit(br, "RoleAssigned")
        .withArgs(1, owner.address, "Admin", blockTimestamp);
    });

    it("should revert when trying to assign an already assigned role", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await br.assignRole(1, owner.address, "Admin");

      await expect(br.assignRole(1, owner.address, "Admin")).to.be.revertedWith(
        "CompanyShares: Role already assigned"
      );
    });

    it("should revoke a role from an account and emit RoleRevoked event", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      // Assign a role first
      await br.assignRole(1, owner.address, "Admin");

      // Revoke the role
      const tx = await br.revokeRole(1, owner.address, "Admin");

      // Get the block timestamp from the transaction receipt
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(
        receipt?.blockNumber || "latest"
      );
      const blockTimestamp = block?.timestamp;

      // Expect the RoleRevoked event with the correct arguments
      await expect(tx)
        .to.emit(br, "RoleRevoked")
        .withArgs(1, owner.address, "Admin", blockTimestamp);
    });

    it("should revert when trying to revoke a non-existent role", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(br.revokeRole(1, owner.address, "Admin")).to.be.revertedWith(
        "CompanyShares: Role not assigned"
      );
    });

    it("should correctly re-assign a role after it has been revoked", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await br.assignRole(1, owner.address, "Admin");
      await br.revokeRole(1, owner.address, "Admin");

      await expect(br.assignRole(1, owner.address, "Admin")).to.emit(
        br,
        "RoleAssigned"
      );
    });

    it("should revert when trying to assign an empty role name", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      await expect(br.assignRole(1, owner.address, "")).to.be.reverted;
    });

    it("should revert when trying to assign a role to the zero address", async function () {
      const { br } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [],
        []
      );

      await expect(br.assignRole(1, ethers.ZeroAddress, "Admin")).to.be
        .reverted;
    });

    it("should return an empty list if no roles are assigned to an address", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      const roles = await br.getAssignedRoles(1, owner.address);
      expect(roles.length).to.equal(0);
    });
  });

  describe("URI Management", function () {
    it("should return the correct URI for a registered company", async function () {
      const { br } = await loadFixture(deployBRFixture);

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
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.setBaseURI("https://newuri.com/tokens/");

      expect(await br.uri(1)).to.equal("https://newuri.com/tokens/1.json");
    });

    it("should correctly set the base URI before any company is registered", async function () {
      const { br, owner } = await loadFixture(deployBRFixture);

      await br.setBaseURI("https://newbaseuri.com/tokens/");

      await br.registerCompany(
        companyData.name,
        companyData.registrationData,
        [owner.address],
        [companyData.totalShares]
      );

      const companyId = 1;
      const expectedUri = `https://newbaseuri.com/tokens/${companyId}.json`;
      expect(await br.uri(companyId)).to.equal(expectedUri);
    });
  });
});

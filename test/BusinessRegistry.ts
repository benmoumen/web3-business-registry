import { expect } from "chai";
import { ethers } from "hardhat";
import { BusinessRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { BigNumberish } from "ethers";

describe("BusinessRegistry", function () {
  type CompanyStruct = {
    name: string;
    registrationNumber: string;
    totalShares: number;
    companyTokenId: BigNumberish;
    governanceTokenId: BigNumberish;
  };
  const companyUUID: string = "9bc6e122-a717-495e-832d-40542a7c6a14";
  const companyData: CompanyStruct = {
    name: "My Company",
    registrationNumber: "123456",
    totalShares: 1000,
    companyTokenId: 0,
    governanceTokenId: 0,
  };
  async function deployBusinessRegistryFixture() {
    let businessRegistry: BusinessRegistry;
    let owner: SignerWithAddress;
    let otherAccount: SignerWithAddress;

    [owner, otherAccount] = await ethers.getSigners();

    businessRegistry = await ethers.deployContract(
      "BusinessRegistry",
      [owner.address],
      {}
    );

    await businessRegistry.waitForDeployment();

    console.log("Contract deployed at:", businessRegistry.getAddress());

    return { businessRegistry, owner, otherAccount };
  }

  it("should initialize correctly", async function () {
    const { businessRegistry } = await loadFixture(
      deployBusinessRegistryFixture
    );
    expect(await businessRegistry.nextTokenId()).to.equal(1);
  });

  it("should register a company", async function () {
    const { businessRegistry, owner } = await loadFixture(
      deployBusinessRegistryFixture
    );

    await expect(businessRegistry.registerCompany(companyUUID, companyData))
      .to.emit(businessRegistry, "CompanyRegistered")
      .withArgs(companyUUID, {
        name: companyData.name,
        registrationNumber: companyData.registrationNumber,
        totalShares: companyData.totalShares,
        companyTokenId: 1,
        governanceTokenId: 2,
      });

    const company = await businessRegistry.getCompany(companyUUID);
    expect(company.name).to.equal(companyData.name);
    expect(company.registrationNumber).to.equal(companyData.registrationNumber);
    expect(company.totalShares).to.equal(companyData.totalShares);
    expect(company.companyTokenId).to.equal(1);
    expect(company.governanceTokenId).to.equal(2);

    expect(await businessRegistry.balanceOf(owner.address, 1)).to.equal(1); // Company NFT
    expect(await businessRegistry.balanceOf(owner.address, 2)).to.equal(
      companyData.totalShares
    ); // Governance tokens
  });

  it("should revert if company already registered", async function () {
    const { businessRegistry } = await loadFixture(
      deployBusinessRegistryFixture
    );

    await businessRegistry.registerCompany(companyUUID, companyData);

    await expect(
      businessRegistry.registerCompany(companyUUID, companyData)
    ).to.be.revertedWith("Company already registered");
  });

  it("should revert if not owner tries to register", async function () {
    const { businessRegistry, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );

    await expect(
      businessRegistry
        .connect(otherAccount)
        .registerCompany(companyUUID, companyData)
    ).to.be.revertedWithCustomError(
      businessRegistry,
      "OwnableUnauthorizedAccount"
    );
  });

  it("should revert with invalid inputs", async function () {
    const { businessRegistry } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const emptyUUID = "";

    await expect(
      businessRegistry.registerCompany(emptyUUID, companyData)
    ).to.be.revertedWith("Invalid UUID format");

    await expect(
      businessRegistry.registerCompany(companyUUID, {
        name: "",
        registrationNumber: "12345",
        totalShares: 100,
        companyTokenId: 0,
        governanceTokenId: 0,
      })
    ).to.be.revertedWith("Company name must be provided");

    await expect(
      businessRegistry.registerCompany(companyUUID, {
        name: "Company Name",
        registrationNumber: "",
        totalShares: 100,
        companyTokenId: 0,
        governanceTokenId: 0,
      })
    ).to.be.revertedWith("Registration number must be provided");

    await expect(
      businessRegistry.registerCompany(companyUUID, {
        name: "Company Name",
        registrationNumber: "1234",
        totalShares: 0,
        companyTokenId: 0,
        governanceTokenId: 0,
      })
    ).to.be.revertedWith("Total shares must be greater than zero");
  });

  it("should allow owner to mint", async function () {
    const { businessRegistry, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );
    await businessRegistry.mint(otherAccount.address, 3, 50, "0x");
    expect(await businessRegistry.balanceOf(otherAccount.address, 3)).to.equal(
      50
    );
  });

  it("should revert if not owner tries to mint", async function () {
    const { businessRegistry, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );
    await expect(
      businessRegistry
        .connect(otherAccount)
        .mint(otherAccount.address, 3, 50, "0x")
    ).to.be.revertedWithCustomError(
      businessRegistry,
      "OwnableUnauthorizedAccount"
    );
  });

  it("should allow the owner to set the URI", async function () {
    const { businessRegistry, owner } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const newURI = "https://new.uri/{id}.json";

    await businessRegistry.setURI(newURI);
    expect(await businessRegistry.uri(1)).to.equal(newURI); // Assuming you want to check the URI for token ID 1

    // You might also want to test that the URI is updated for newly minted tokens after setting the new URI.
  });

  it("should revert if not the owner tries to set the URI", async function () {
    const { businessRegistry, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const newURI = "https://new.uri/{id}.json";

    await expect(
      businessRegistry.connect(otherAccount).setURI(newURI)
    ).to.be.revertedWithCustomError(
      businessRegistry,
      "OwnableUnauthorizedAccount"
    );
  });

  it("should allow the owner to mint a batch of tokens", async function () {
    const { businessRegistry, owner, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const ids = [3, 4, 5];
    const amounts = [10, 20, 30];

    await businessRegistry.mintBatch(otherAccount.address, ids, amounts, "0x");

    expect(await businessRegistry.balanceOf(otherAccount.address, 3)).to.equal(
      10
    );
    expect(await businessRegistry.balanceOf(otherAccount.address, 4)).to.equal(
      20
    );
    expect(await businessRegistry.balanceOf(otherAccount.address, 5)).to.equal(
      30
    );
  });

  it("should revert if not the owner tries to mint a batch", async function () {
    const { businessRegistry, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const ids = [3, 4, 5];
    const amounts = [10, 20, 30];

    await expect(
      businessRegistry
        .connect(otherAccount)
        .mintBatch(otherAccount.address, ids, amounts, "0x")
    ).to.be.revertedWithCustomError(
      businessRegistry,
      "OwnableUnauthorizedAccount"
    );
  });

  it("should update the URI for newly minted tokens after setting a new URI", async function () {
    const { businessRegistry, owner, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const newURI = "https://new.uri/{id}.json";

    // Mint a token before setting the new URI
    await businessRegistry.mint(otherAccount.address, 6, 1, "0x");
    expect(await businessRegistry.uri(6)).to.equal(
      "https://govchain.technology/tokens/{id}.json"
    ); // Check the initial URI

    // Set the new URI
    await businessRegistry.setURI(newURI);

    // Mint another token after setting the new URI
    await businessRegistry.mint(otherAccount.address, 7, 1, "0x");
    expect(await businessRegistry.uri(7)).to.equal(newURI); // Check that the new token has the updated URI
  });
});

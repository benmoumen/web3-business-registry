import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BusinessRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("BusinessRegistryUpgradable", function () {
  const companyUUID: string = "9bc6e122-a717-495e-832d-40542a7c6a14";
  async function deployBusinessRegistryFixture() {
    let businessRegistry: BusinessRegistry;
    let owner: SignerWithAddress;
    let otherAccount: SignerWithAddress;

    [owner, otherAccount] = await ethers.getSigners();

    const BusinessRegistryFactory = await ethers.getContractFactory(
      "BusinessRegistry"
    );
    businessRegistry = (await upgrades.deployProxy(
      BusinessRegistryFactory,
      [owner.address],
      {
        kind: "uups",
      }
    )) as unknown as BusinessRegistry;

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
    const uuid = companyUUID;
    const name = "My Company";
    const registrationNumber = "123456";
    const totalShares = 1000;

    await expect(
      businessRegistry.registerCompany(
        uuid,
        name,
        registrationNumber,
        totalShares
      )
    )
      .to.emit(businessRegistry, "CompanyRegistered")
      .withArgs(uuid, name, registrationNumber, totalShares, 1, 2);

    const company = await businessRegistry.getCompany(uuid);
    expect(company.name).to.equal(name);
    expect(company.registrationNumber).to.equal(registrationNumber);
    expect(company.totalShares).to.equal(totalShares);
    expect(company.companyTokenId).to.equal(1);
    expect(company.governanceTokenId).to.equal(2);

    expect(await businessRegistry.balanceOf(owner.address, 1)).to.equal(1); // Company NFT
    expect(await businessRegistry.balanceOf(owner.address, 2)).to.equal(
      totalShares
    ); // Governance tokens
  });

  it("should revert if company already registered", async function () {
    const { businessRegistry } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const uuid = companyUUID;
    const name = "My Company";
    const registrationNumber = "123456";
    const totalShares = 1000;

    await businessRegistry.registerCompany(
      uuid,
      name,
      registrationNumber,
      totalShares
    );

    await expect(
      businessRegistry.registerCompany(
        uuid,
        name,
        registrationNumber,
        totalShares
      )
    ).to.be.revertedWith("Company already registered");
  });

  it("should revert if not owner tries to register", async function () {
    const { businessRegistry, otherAccount } = await loadFixture(
      deployBusinessRegistryFixture
    );
    const uuid = companyUUID;
    const name = "My Company";
    const registrationNumber = "123456";
    const totalShares = 1000;

    await expect(
      businessRegistry
        .connect(otherAccount)
        .registerCompany(uuid, name, registrationNumber, totalShares)
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
    const emptyName = "";
    const emptyRegNumber = "";
    const emptyShares = 0;

    await expect(
      businessRegistry.registerCompany(
        emptyUUID,
        emptyName,
        emptyRegNumber,
        emptyShares
      )
    ).to.be.revertedWith("Invalid UUID format");

    await expect(
      businessRegistry.registerCompany(
        companyUUID,
        emptyName,
        emptyRegNumber,
        emptyShares
      )
    ).to.be.revertedWith("Company name must be provided");

    await expect(
      businessRegistry.registerCompany(
        companyUUID,
        "Company Name",
        emptyRegNumber,
        emptyShares
      )
    ).to.be.revertedWith("Registration number must be provided");

    await expect(
      businessRegistry.registerCompany(
        companyUUID,
        "Company Name",
        "123456",
        emptyShares
      )
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
      "https://static.govchain.technology/tokens/{id}.json"
    ); // Check the initial URI

    // Set the new URI
    await businessRegistry.setURI(newURI);

    // Mint another token after setting the new URI
    await businessRegistry.mint(otherAccount.address, 7, 1, "0x");
    expect(await businessRegistry.uri(7)).to.equal(newURI); // Check that the new token has the updated URI
  });
});

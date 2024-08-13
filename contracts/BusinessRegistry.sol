// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

/// @title Business Registry Contract
/// @notice This contract allows for the registration of companies and issuance of token shares using ERC1155 standard.
/// @dev Inherits from ERC1155, Ownable, and ERC1155Burnable from OpenZeppelin.
contract BusinessRegistry is ERC1155, Ownable, ERC1155Burnable {
    uint256 public nextTokenId;

    struct Company {
        string name;
        string registrationNumber;
        uint256 totalShares;
        uint256 companyTokenId;
        uint256 governanceTokenId;
    }

    // Use a mapping from the Keccak256 hash of the UUID to the Company struct
    mapping(bytes32 => Company) public companies;

    event CompanyRegistered(string indexed uuid, Company company);

    /**
     * @notice Constructor to initialize the contract with the initial owner and base URI
     * @param initialOwner The address of the initial owner
     */
    constructor(
        address initialOwner
    )
        ERC1155("https://govchain.technology/tokens/{id}.json")
        Ownable(initialOwner)
    {
        nextTokenId = 1;
    }

    /**
     * @notice Registers a new company
     * @param uuid The UUID of the company
     * @param company The company details
     */
    function registerCompany(
        string memory uuid,
        Company memory company
    ) public onlyOwner {
        // Validate UUID format (basic check, you might want to add more robust validation if needed)
        require(bytes(uuid).length == 36, "Invalid UUID format");

        // Additional validations
        require(
            bytes(company.name).length > 0,
            "Company name must be provided"
        );
        require(
            bytes(company.registrationNumber).length > 0,
            "Registration number must be provided"
        );
        require(
            company.totalShares > 0,
            "Total shares must be greater than zero"
        );

        // Calculate Keccak256 hash of the UUID
        bytes32 uuidHash = keccak256(abi.encodePacked(uuid));

        // Check if company already exists using the hash
        require(
            bytes(companies[uuidHash].name).length == 0,
            "Company already registered"
        );

        company.companyTokenId = nextTokenId;
        company.governanceTokenId = nextTokenId + 1;

        nextTokenId += 2;

        // Store the company data indexed by the UUID's hash
        companies[uuidHash] = company;

        // Mint the unique company NFT
        _mint(msg.sender, company.companyTokenId, 1, "");

        // Mint ownership tokens corresponding to the number of shares
        _mint(msg.sender, company.governanceTokenId, company.totalShares, "");

        emit CompanyRegistered(uuid, company);
    }

    /**
     * @notice Gets company details by UUID
     * @param uuid The UUID of the company
     * @return The company details
     */
    function getCompany(
        string memory uuid
    ) public view returns (Company memory) {
        bytes32 uuidHash = keccak256(abi.encodePacked(uuid));
        return companies[uuidHash];
    }

    /**
     * @notice Returns the URI for a given token ID
     * @param tokenId The token ID
     * @return The URI string
     */
    function uri(uint256 tokenId) public pure override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://govchain.technology/tokens/",
                    Strings.toString(tokenId),
                    ".json"
                )
            );
    }

    /**
     * @notice Sets a new URI for all tokens
     * @param newuri The new URI string
     */
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    /**
     * @notice Mints a new token
     * @param account The address of the recipient
     * @param id The token ID to mint
     * @param amount The amount of tokens to mint
     * @param data Additional data with no specified format
     */
    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(account, id, amount, data);
    }

    /**
     * @notice Mints multiple new tokens in a batch
     * @param to The address of the recipient
     * @param ids An array of token IDs to mint
     * @param amounts An array of amounts of tokens to mint
     * @param data Additional data with no specified format
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
}

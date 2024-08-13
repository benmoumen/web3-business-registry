// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

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

    constructor(
        address initialOwner
    )
        ERC1155("https://govchain.technology/tokens/{id}.json")
        Ownable(initialOwner)
    {
        nextTokenId = 1;
    }

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

        emit CompanyRegistered(            uuid,             company        );
    }

    // Function to get company details by UUID string
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

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
}

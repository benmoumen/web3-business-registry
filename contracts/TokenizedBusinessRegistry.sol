// SPDX-License-Identifier: MIT

/**

  /$$$$$$                                                                       
 /$$__  $$                                                                      
| $$  \__/  /$$$$$$  /$$$$$$/$$$$   /$$$$$$   /$$$$$$  /$$$$$$$  /$$   /$$      
| $$       /$$__  $$| $$_  $$_  $$ /$$__  $$ |____  $$| $$__  $$| $$  | $$      
| $$      | $$  \ $$| $$ \ $$ \ $$| $$  \ $$  /$$$$$$$| $$  \ $$| $$  | $$      
| $$    $$| $$  | $$| $$ | $$ | $$| $$  | $$ /$$__  $$| $$  | $$| $$  | $$      
|  $$$$$$/|  $$$$$$/| $$ | $$ | $$| $$$$$$$/|  $$$$$$$| $$  | $$|  $$$$$$$      
 \______/  \______/ |__/ |__/ |__/| $$____/  \_______/|__/  |__/ \____  $$      
                                  | $$                           /$$  | $$      
                                  | $$                          |  $$$$$$/      
                                  |__/                           \______/       
  /$$$$$$  /$$                                                                  
 /$$__  $$| $$                                                                  
| $$  \__/| $$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$$                    
|  $$$$$$ | $$__  $$ |____  $$ /$$__  $$ /$$__  $$ /$$_____/                    
 \____  $$| $$  \ $$  /$$$$$$$| $$  \__/| $$$$$$$$|  $$$$$$                     
 /$$  \ $$| $$  | $$ /$$__  $$| $$      | $$_____/ \____  $$                    
|  $$$$$$/| $$  | $$|  $$$$$$$| $$      |  $$$$$$$ /$$$$$$$/                    
 \______/ |__/  |__/ \_______/|__/       \_______/|_______/                     
                                                                                
                                                                                
                                                                                
  /$$$$$$                                                                       
 /$$__  $$                                                                      
| $$  \ $$  /$$$$$$$                                                            
| $$$$$$$$ /$$_____/                                                            
| $$__  $$|  $$$$$$                                                             
| $$  | $$ \____  $$                                                            
| $$  | $$ /$$$$$$$/                                                            
|__/  |__/|_______/                                                             
                                                                                
                                                                                
                                                                                
 /$$$$$$$$        /$$                                                           
|__  $$__/       | $$                                                           
   | $$  /$$$$$$ | $$   /$$  /$$$$$$  /$$$$$$$   /$$$$$$$                       
   | $$ /$$__  $$| $$  /$$/ /$$__  $$| $$__  $$ /$$_____/                       
   | $$| $$  \ $$| $$$$$$/ | $$$$$$$$| $$  \ $$|  $$$$$$                        
   | $$| $$  | $$| $$_  $$ | $$_____/| $$  | $$ \____  $$                       
   | $$|  $$$$$$/| $$ \  $$|  $$$$$$$| $$  | $$ /$$$$$$$/                       
   |__/ \______/ |__/  \__/ \_______/|__/  |__/|_______/                        
                                                                                
                                                                                
                                                                            
 */
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TokenizedBusinessRegistry
 * @notice A contract for managing tokenized shares of companies
 * The contract allows for registering companies, minting shares, assigning roles to shareholders and third parties.
 * The contract is based on the ERC1155 standard.
 */
contract TokenizedBusinessRegistry is ERC1155, Ownable, ERC1155Supply {
    using Strings for uint256;

    string public name = "Company Shares";
    string public symbol = "SHARE";
    string public baseURI = "https://govchain.technology/tokens/";

    /**
     * @dev Struct to store company details
     * @param id The unique identifier of the company
     * @param name The name of the company
     * @param registrationData Any additional data about the company
     * @param shareholders List of addresses holding shares in the company
     * @param shares Mapping of shares held by each address
     * @param totalShares Total shares issued by the company
     * @param roles Mapping of roles assigned to each address
     * @param roleList Dynamic list of roles assigned to each address
     */
    struct Company {
        uint256 id;
        string name;
        string registrationData;
        address[] shareholders;
        mapping(address => uint256) shares;
        uint256 totalShares;
        mapping(address => mapping(string => bool)) roles; // Track roles assigned to each address
        mapping(address => string[]) roleList;
    }

    /**
     * @dev Struct to store role information
     * @param roleName The name of the role (e.g. CEO, CFO, Lawyer, Auditor, etc.)
     * @param isActive The status of the role (active or revoked)
     */
    struct RoleInfo {
        string roleName;
        bool isActive;
    }

    mapping(uint256 => Company) public companies;
    uint256 public nextCompanyId;

    /**
     * @dev Event to track company registration
     * @param companyId The unique identifier of the company
     * @param name The name of the company
     * @param registrationData Any additional data about the company
     */
    event CompanyRegistered(
        uint256 indexed companyId,
        string name,
        string registrationData
    );
    /**
     * @dev Event to track share issuance
     * @param companyTokenId The unique identifier of the company
     * @param shareholders List of addresses holding shares in the company
     * @param amounts List of share amounts minted for each shareholder
     */
    event SharesMinted(
        uint256 indexed companyTokenId,
        address[] shareholders,
        uint256[] amounts
    );
    /**
     * @dev Event to track role assignment
     * @param companyId The unique identifier of the company
     * @param account The address to which the role is assigned
     * @param role The name of the role assigned
     * @param assignedDate The timestamp when the role was assigned
     */
    event RoleAssigned(
        uint256 indexed companyId,
        address indexed account,
        string role,
        uint256 assignedDate
    );
    /**
     * @dev Event to track role revocation
     * @param companyId The unique identifier of the company
     * @param account The address from which the role is revoked
     * @param role The name of the role revoked
     * @param revokedDate The timestamp when the role was revoked
     */
    event RoleRevoked(
        uint256 indexed companyId,
        address indexed account,
        string role,
        uint256 revokedDate
    );

    /**
     * @dev Constructor to initialize the ERC1155 contract with the owner address
     * @param initialOwner The address of the Business Registry Wallet that will operate the contract
     */
    constructor(address initialOwner) ERC1155(baseURI) Ownable(initialOwner) {
        nextCompanyId = 1; // Start IDs from 1 for clarity
    }

    /**
     * @notice Function to register a new company
     * @param _name The name of the company
     * @param _registrationData Any additional data about the company
     * @param _shareholders List of addresses holding shares in the company
     * @param _shareAmounts List of share amounts to be minted for each shareholder
     * @dev Modifier to restrict access to the owner of the contract
     */
    function registerCompany(
        string memory _name,
        string memory _registrationData,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) public onlyOwner {
        require(
            _shareholders.length == _shareAmounts.length,
            "CompanyShares: Shareholders and amounts length mismatch"
        );

        uint256 companyId = nextCompanyId;
        nextCompanyId++;

        // Create a new company
        Company storage newCompany = companies[companyId];
        newCompany.id = companyId;
        newCompany.name = _name;
        newCompany.registrationData = _registrationData;
        newCompany.shareholders = _shareholders;

        // Mint initial shares to shareholders
        if (_shareholders.length > 0)
            _mintShares(companyId, _shareholders, _shareAmounts);

        emit CompanyRegistered(companyId, _name, _registrationData);
    }

    /**
     * @notice Function to issue shares to existing or new shareholders
     * @param companyId The unique identifier of the company
     * @param _shareholders List of addresses holding shares in the company
     * @param _shareAmounts List of share amounts to be minted for each shareholder
     * @dev Modifier to restrict access to the owner of the contract
     */
    function issueShares(
        uint256 companyId,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) public onlyOwner {
        require(
            _shareholders.length == _shareAmounts.length,
            "CompanyShares: Shareholders and amounts length mismatch"
        );
        require(
            companies[companyId].id != 0,
            "CompanyShares: Company does not exist"
        );

        // Mint additional shares
        _mintShares(companyId, _shareholders, _shareAmounts);
    }

    /**
     * @dev Internal function to mint shares and update company data
     * @param companyId The unique identifier of the company
     * @param _shareholders List of addresses holding shares in the company
     * @param _shareAmounts List of share amounts to be minted for each shareholder
     */
    function _mintShares(
        uint256 companyId,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) internal {
        Company storage company = companies[companyId];

        for (uint256 i = 0; i < _shareholders.length; i++) {
            company.shares[_shareholders[i]] += _shareAmounts[i];
            company.totalShares += _shareAmounts[i];

            require(_shareholders[i] != address(0), "address cant be 0");
            require(_shareAmounts[i] != 0, "share amount cant be 0");
            // Mint tokens to each shareholder individually
            _mint(_shareholders[i], companyId, _shareAmounts[i], "");
        }

        // Emit event for tracking share issuance
        emit SharesMinted(companyId, _shareholders, _shareAmounts);
    }

    /**
     * @notice Function to get a company's details stored on the Blockchain
     * @param companyId The unique identifier of the company
     * @return _name The name of the company
     * @return _registrationData Any additional data about the company
     * @return _shareholders List of addresses holding shares in the company
     * @return _shareAmounts List of share amounts held by each shareholder
     * @return _totalShares Total shares issued by the company
     */
    function getCompanyDetails(
        uint256 companyId
    )
        public
        view
        returns (
            string memory _name,
            string memory _registrationData,
            address[] memory _shareholders,
            uint256[] memory _shareAmounts,
            uint256 _totalShares
        )
    {
        Company storage company = companies[companyId];
        uint256 shareholderCount = company.shareholders.length;
        uint256[] memory shareAmounts = new uint256[](shareholderCount);

        for (uint256 i = 0; i < shareholderCount; i++) {
            shareAmounts[i] = company.shares[company.shareholders[i]];
        }

        return (
            company.name,
            company.registrationData,
            company.shareholders,
            shareAmounts,
            company.totalShares
        );
    }

    /**
     * @notice Function to register the relationship between a company and a shareholder or a third party
     * @param companyId The unique identifier of the company
     * @param account The address to which the role is assigned
     * @param roleName The name of the role assigned (e.g. CEO, CFO, Lawyer, Auditor, etc.)
     * @dev Modifier to restrict access to the owner of the contract
     */
    function assignRole(
        uint256 companyId,
        address account,
        string memory roleName
    ) public onlyOwner {
        require(
            bytes(roleName).length > 0,
            "CompanyShares: Role name is empty"
        );
        require(account != address(0), "address cant be 0");

        Company storage company = companies[companyId];
        require(
            !company.roles[account][roleName],
            "CompanyShares: Role already assigned"
        );

        company.roles[account][roleName] = true;
        company.roleList[account].push(roleName);

        emit RoleAssigned(companyId, account, roleName, block.timestamp);
    }

    /**
     * @notice Function to revoke an assigned role from a shareholder or a third party
     * @param companyId The unique identifier of the company
     * @param account The address from which the role is revoked
     * @param roleName The name of the role revoked (e.g. CEO, CFO, Lawyer, Auditor, etc.)
     * @dev Modifier to restrict access to the owner of the contract
     */
    function revokeRole(
        uint256 companyId,
        address account,
        string memory roleName
    ) public onlyOwner {
        Company storage company = companies[companyId];
        require(
            company.roles[account][roleName],
            "CompanyShares: Role not assigned"
        );

        company.roles[account][roleName] = false;

        emit RoleRevoked(companyId, account, roleName, block.timestamp);
    }

    /**
     * @notice Function to get all roles assigned to an address in a specific company
     * @param companyId The unique identifier of the company
     * @param account The address to which the roles are assigned
     * @return roleInfos List of role information (role name and status) assigned to the address
     */
    function getAssignedRoles(
        uint256 companyId,
        address account
    ) public view returns (RoleInfo[] memory) {
        Company storage company = companies[companyId];
        uint256 roleCount = company.roleList[account].length;

        RoleInfo[] memory roleInfos = new RoleInfo[](roleCount);

        for (uint256 i = 0; i < roleCount; i++) {
            string memory roleName = company.roleList[account][i];
            roleInfos[i] = RoleInfo({
                roleName: roleName,
                isActive: company.roles[account][roleName]
            });
        }

        return roleInfos;
    }

    /**
     * @dev Function to return the dynamic URI for each company
     * @param companyId The unique identifier of the company
     * @return URI for the company's metadata
     */
    function uri(
        uint256 companyId
    ) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, companyId.toString(), ".json"));
    }

    /**
     * @notice Function to update the base URI for the company metadata
     * @param newBaseURI The new base URI for the company metadata
     * @dev Modifier to restrict access to the owner of the contract
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    /**
     * @dev ERC1155Supply allows to track the total token supply by overriding the _update function
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}

// SPDX-License-Identifier: MIT

/**

  /$$$$$$                                       The Web3 Business Registry                                                                  
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

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./interfaces/ICompanySharesAsTokens.sol";
import "./modules/CompanyRegistration.sol";
import "./modules/RoleManagement.sol";
import "./modules/SupplyManagement.sol";
import "./libraries/Events.sol";
import "./libraries/DataTypes.sol";
import "./libraries/AddressArrayUtils.sol";
import "./libraries/Uint256ArrayUtils.sol";

contract CompanySharesAsTokens is
    Initializable,
    ERC1155Upgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ICompanySharesAsTokens,
    CompanyRegistration,
    RoleManagement,
    SupplyManagement
{
    using Strings for uint256;
    using AddressArrayUtils for address[];
    using Uint256ArrayUtils for uint256[];

    string public name;
    string public symbol;

    string private _baseURI;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with the owner address and the base URI.
     * @param initialOwner The address of the owner that will operate the contract.
     * @param baseURI The base URI for the company metadata.
     */
    function initialize(
        address initialOwner,
        string memory baseURI
    ) public initializer {
        __ERC1155_init(baseURI);
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        _initializeCompanyRegistration();

        name = "Company Tokens";
        symbol = "COTO";
        _baseURI = baseURI;
    }

    /**
     * @notice Function to register a new company.
     */
    function registerCompany(
        string memory _name,
        string memory _registrationData,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) public override onlyOwner {
        uint256 companyId = _registerCompany(_name, _registrationData);

        if (_shareholders.length > 0) {
            _mintAndIncreaseSupply(companyId, _shareholders, _shareAmounts);
        }
    }

    /**
     * @notice Function to issue shares to existing or new shareholders.
     */
    function issueShares(
        uint256 companyId,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) public override onlyOwner {
        require(companies[companyId].id != 0, "Company does not exist");

        _mintAndIncreaseSupply(companyId, _shareholders, _shareAmounts);
    }

    /**
     * @dev Internal function to mint shares and increase total supply.
     */
    function _mintAndIncreaseSupply(
        uint256 companyId,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) internal {
        require(_shareholders.length > 0, "No shareholders provided");
        require(
            _shareholders.length == _shareAmounts.length,
            "Shareholders and amounts length mismatch"
        );

        _mintShares(companyId, _shareholders, _shareAmounts);

        // Mint tokens and update supply
        for (uint256 i = 0; i < _shareholders.length; i++) {
            _mint(_shareholders[i], companyId, _shareAmounts[i], "");
        }
    }

    /**
     * @notice Function to get a company's details stored on the blockchain.
     * @param companyId The unique identifier of the company.
     * @return _name The name of the company.
     * @return _registrationData Any additional data about the company.
     * @return _shareholders List of addresses holding shares in the company.
     * @return _shareAmounts List of share amounts held by each shareholder.
     * @return _totalShares Total shares issued by the company.
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
        DataTypes.Company storage company = companies[companyId];
        address[] memory shareholders = _tokenHolders[companyId];
        uint256 shareholderCount = shareholders.length;
        uint256[] memory shareAmounts = new uint256[](shareholderCount);

        for (uint256 i = 0; i < shareholderCount; i++) {
            shareAmounts[i] = balanceOf(shareholders[i], companyId);
        }

        return (
            company.name,
            company.registrationData,
            shareholders,
            shareAmounts,
            company.totalShares
        );
    }

    /**
     * @notice Updates the base URI for the company metadata.
     */
    function setBaseURI(string memory newBaseURI) public override onlyOwner {
        _baseURI = newBaseURI;
        _setURI(newBaseURI);
    }

    /**
     * @dev Returns the dynamic URI for each company token.
     */
    function uri(
        uint256 companyId
    ) public view override returns (string memory) {
        return
            string(abi.encodePacked(_baseURI, companyId.toString(), ".json"));
    }

    /**
     * @dev Overrides the _update function to handle token transfers and supply updates.
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual override {
        super._update(from, to, ids, amounts);

        for (uint256 i = 0; i < ids.length; i++) {
            _updateShareholder(from, to, ids[i]);

            if (from == address(0)) {
                // Minting
                _increaseTotalSupply(ids[i], amounts[i]);
            } else if (to == address(0)) {
                // Burning
                _decreaseTotalSupply(ids[i], amounts[i]);
            }
        }
    }

    /**
     * @dev Authorizes contract upgrades.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // Storage gap for upgradeability
    uint256[50] private __gap;
}

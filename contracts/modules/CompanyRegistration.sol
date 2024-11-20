// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";

import "../libraries/DataTypes.sol";
import "../libraries/Events.sol";
import "../libraries/AddressArrayUtils.sol";
import "../libraries/Uint256ArrayUtils.sol";

abstract contract CompanyRegistration is
    ERC1155Upgradeable,
    OwnableUpgradeable,
    ERC1155BurnableUpgradeable
{
    using DataTypes for DataTypes.Company;
    using AddressArrayUtils for address[];
    using Uint256ArrayUtils for uint256[];

    uint256 internal nextCompanyId;
    mapping(uint256 => DataTypes.Company) internal companies;

    function _initializeCompanyRegistration() internal {
        nextCompanyId = 1;
    }

    function _registerCompany(
        string memory _name,
        string memory _registrationData
    ) public virtual onlyOwner returns (uint256 companyId) {
        companyId = nextCompanyId++;
        DataTypes.Company storage company = companies[companyId];
        company.id = companyId;
        company.name = _name;
        company.registrationData = _registrationData;

        emit Events.CompanyRegistered(companyId, _name, _registrationData);
    }

    // Mapping from token ID to list of shareholder addresses
    mapping(uint256 => address[]) internal _tokenHolders;

    // Mapping from shareholder address to list of token IDs they own
    mapping(address => uint256[]) internal _shareholderTokens;

    function _mintShares(
        uint256 companyId,
        address[] memory shareholders,
        uint256[] memory shareAmounts
    ) internal {
        require(
            shareholders.length == shareAmounts.length,
            "Shareholders and amounts length mismatch"
        );

        DataTypes.Company storage company = companies[companyId];

        for (uint256 i = 0; i < shareholders.length; i++) {
            address shareholder = shareholders[i];
            uint256 amount = shareAmounts[i];

            require(shareholder != address(0), "Invalid address");
            require(amount > 0, "Amount must be greater than zero");

            company.shares[shareholder] += amount;
            company.totalShares += amount;

            // Update token holders
            if (!_shareholderTokens[shareholder].contains(companyId)) {
                _shareholderTokens[shareholder].push(companyId);
            }
            if (!_tokenHolders[companyId].contains(shareholder)) {
                _tokenHolders[companyId].push(shareholder);
            }
        }

        emit Events.SharesMinted(companyId, shareholders, shareAmounts);
    }

    function getTokenHolders(
        uint256 tokenId
    ) public view returns (address[] memory) {
        return _tokenHolders[tokenId];
    }

    function getOwnedTokens(
        address shareholder
    ) public view returns (uint256[] memory) {
        return _shareholderTokens[shareholder];
    }

    function _updateShareholder(address from, address to, uint256 id) internal {
        if (from != address(0) && balanceOf(from, id) == 0) {
            _shareholderTokens[from].remove(id);
            _tokenHolders[id].remove(from);
        }
        if (to != address(0) && balanceOf(to, id) > 0) {
            if (!_shareholderTokens[to].contains(id)) {
                _shareholderTokens[to].push(id);
            }
            if (!_tokenHolders[id].contains(to)) {
                _tokenHolders[id].push(to);
            }
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/DataTypes.sol";

interface ICompanySharesAsTokens {
    function registerCompany(
        string memory _name,
        string memory _registrationData,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) external;

    function issueShares(
        uint256 companyId,
        address[] memory _shareholders,
        uint256[] memory _shareAmounts
    ) external;

    function getCompanyDetails(
        uint256 companyId
    )
        external
        view
        returns (
            string memory _name,
            string memory _registrationData,
            address[] memory _shareholders,
            uint256[] memory _shareAmounts,
            uint256 _totalShares
        );

    function setBaseURI(string memory newBaseURI) external;
}

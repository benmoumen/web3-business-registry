// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Events {
    event CompanyRegistered(
        uint256 indexed companyId,
        string name,
        string registrationData
    );

    event SharesMinted(
        uint256 indexed companyId,
        address[] shareholders,
        uint256[] amounts
    );

    event RoleAssigned(
        uint256 indexed companyId,
        address indexed account,
        string role,
        uint256 assignedDate
    );

    event RoleRevoked(
        uint256 indexed companyId,
        address indexed account,
        string role,
        uint256 revokedDate
    );
}

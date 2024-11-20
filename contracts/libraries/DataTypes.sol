// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library DataTypes {
    /**
     * @dev Struct to store company details
     * @param id The unique identifier of the company
     * @param name The name of the company
     * @param registrationData Any additional data about the company
     * @param shares Mapping of shares held by each shareholder address
     * @param totalShares Total shares issued by the company
     * @param roles Mapping of roles assigned to each address
     * @param roleList Dynamic list of roles assigned to each address
     */
    struct Company {
        uint256 id;
        string name;
        string registrationData;
        mapping(address => uint256) shares; // Shares held by each shareholder
        uint256 totalShares;
        mapping(address => mapping(string => bool)) roles; // Roles assigned to each address
        mapping(address => string[]) roleList; // List of roles for each address
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
}

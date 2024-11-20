// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CompanyRegistration.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Events.sol";

abstract contract RoleManagement is CompanyRegistration {
    function assignRole(
        uint256 companyId,
        address account,
        string memory roleName
    ) public onlyOwner {
        DataTypes.Company storage company = companies[companyId];
        require(bytes(roleName).length > 0, "Role name is empty");
        require(account != address(0), "Invalid address");
        require(!company.roles[account][roleName], "Role already assigned");

        company.roles[account][roleName] = true;
        company.roleList[account].push(roleName);

        emit Events.RoleAssigned(companyId, account, roleName, block.timestamp);
    }

    function revokeRole(
        uint256 companyId,
        address account,
        string memory roleName
    ) public onlyOwner {
        DataTypes.Company storage company = companies[companyId];
        require(company.roles[account][roleName], "Role not assigned");

        company.roles[account][roleName] = false;

        emit Events.RoleRevoked(companyId, account, roleName, block.timestamp);
    }

    function getAssignedRoles(
        uint256 companyId,
        address account
    ) public view returns (DataTypes.RoleInfo[] memory) {
        DataTypes.Company storage company = companies[companyId];
        uint256 roleCount = company.roleList[account].length;

        DataTypes.RoleInfo[] memory roleInfos = new DataTypes.RoleInfo[](
            roleCount
        );

        for (uint256 i = 0; i < roleCount; i++) {
            string memory roleName = company.roleList[account][i];
            roleInfos[i] = DataTypes.RoleInfo({
                roleName: roleName,
                isActive: company.roles[account][roleName]
            });
        }

        return roleInfos;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract SupplyManagement {
    mapping(uint256 => uint256) internal _totalSupplyPerToken;

    function _increaseTotalSupply(uint256 id, uint256 amount) internal {
        _totalSupplyPerToken[id] += amount;
    }

    function _decreaseTotalSupply(uint256 id, uint256 amount) internal {
        require(
            _totalSupplyPerToken[id] >= amount,
            "Insufficient total supply"
        );
        _totalSupplyPerToken[id] -= amount;
    }

    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupplyPerToken[id];
    }

    function exists(uint256 id) public view returns (bool) {
        return _totalSupplyPerToken[id] > 0;
    }
}

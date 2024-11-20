// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library AddressArrayUtils {
    function contains(
        address[] storage array,
        address value
    ) internal view returns (bool) {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) return true;
        }
        return false;
    }

    function remove(address[] storage array, address value) internal {
        uint256 length = array.length;
        for (uint256 i = 0; i < length; i++) {
            if (array[i] == value) {
                if (i != length - 1) {
                    array[i] = array[length - 1];
                }
                array.pop();
                break;
            }
        }
    }
}

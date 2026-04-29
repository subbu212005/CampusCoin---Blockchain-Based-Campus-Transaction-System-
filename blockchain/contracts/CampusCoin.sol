// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CampusCoin is ERC20, Ownable {
    constructor() ERC20("CampusCoin", "CMP") Ownable(msg.sender) {
        // Initially mint 10,000 tokens to the deployer for administrative purposes
        _mint(msg.sender, 10000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

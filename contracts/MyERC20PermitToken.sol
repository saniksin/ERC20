// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./ERC20Permit.sol";

contract MyERC20PermitToken is ERC20, ERC20Permit {
  address public owner;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  constructor() ERC20("MyERC20PermitToken", "MTK", 18) ERC20Permit("MyERC20PermitToken") {
    owner = msg.sender;
    _mint(msg.sender, 100 * 10 ** decimals());
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
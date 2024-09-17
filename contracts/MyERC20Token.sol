// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./ERC20Burnable.sol";

contract MyERC20Token is ERC20, ERC20Burnable {
  address public owner;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  constructor(
    address initialOwner, 
    string memory _tokenName, 
    string memory _symbol, 
    uint8 _decimals, 
    uint256 _initialTokenMint
  ) ERC20(_tokenName, _symbol, _decimals) {
    owner = initialOwner;
    _mint(msg.sender, _initialTokenMint * 10 ** decimals());
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
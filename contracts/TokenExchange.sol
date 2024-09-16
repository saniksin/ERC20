// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "./IERC20.sol";

contract TokenExchange {
  IERC20 token;
  address owner;

  modifier onlyOwner {
    require(msg.sender == owner, "not an owner!");
    _;
  }

  constructor(address _token) {
    token = IERC20(_token);
    owner = msg.sender;
  }

  function buy() public payable  {
    uint256 amount = msg.value;

    require(amount >= 1);

    uint256 currentBalance = token.balanceOf(address(this));
   
    require(currentBalance >= amount);

    token.transfer(msg.sender, amount);
  }

  function sell(uint256 _amount) external {
    require(address(this).balance >= _amount);

    require(token.allowance(msg.sender, address(this)) >= _amount);

    token.transferFrom(msg.sender, address(this), _amount);
  
    (bool ok,) = msg.sender.call{value: _amount}("");
    require(ok, "cant send funds");
  }

  function topUp() external payable onlyOwner {}

  function withdrawFunds(uint256 amount) external onlyOwner {
    require(address(this).balance >= amount);
    
    (bool ok,) = owner.call{value: amount}("");
    require(ok, "cant send funds");
  }

  receive() external payable {
    buy();
  }
}
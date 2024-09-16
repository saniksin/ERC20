// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./ERC20.sol";

abstract contract ERC20Burnable is ERC20 {
  function burn(uint256 value) public virtual {
    _burn(msg.sender, value);
  }

  function burnFrom(address account, uint256 value) public virtual {
    _spendAllowance(account, msg.sender, value);

    _burn(account, value);
  }
}
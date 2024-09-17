// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MyERC20PermitToken.sol";

contract Proxy {

    function doSend(
        MyERC20PermitToken mtk,
        address owner,
        address spender,
        uint value,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        mtk.permit(owner, spender, value, deadline, v, r, s);
    }
}
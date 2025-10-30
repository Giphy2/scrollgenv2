// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ISGT {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function mint(address to, uint256 amount) external;
}

contract SGTFaucet is Ownable {
    ISGT public sgt;
    uint256 public amountPerClaim = 20000 * 10**18;
    mapping(address => bool) public hasClaimed;
    bool public useMint;

    event Claimed(address indexed user, uint256 amount);
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event AmountPerClaimSet(uint256 newAmount);
    event UseMintSet(bool enabled);

    constructor(address _sgt, bool _useMint) Ownable(msg.sender) {
        sgt = ISGT(_sgt);
        useMint = _useMint;
    }

    function setAmountPerClaim(uint256 newAmount) external onlyOwner {
        amountPerClaim = newAmount;
        emit AmountPerClaimSet(newAmount);
    }

    function setUseMint(bool enabled) external onlyOwner {
        useMint = enabled;
        emit UseMintSet(enabled);
    }

    function claim(address user) external {
        require(!hasClaimed[user], "Already claimed");
        hasClaimed[user] = true;
        if (useMint) {
            sgt.mint(user, amountPerClaim);
        } else {
            require(sgt.transfer(user, amountPerClaim), "SGT transfer failed");
        }
        emit Claimed(user, amountPerClaim);
    }

    function fund(uint256 amount) external onlyOwner {
        require(sgt.transferFrom(msg.sender, address(this), amount), "Fund failed");
        emit Funded(msg.sender, amount);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(sgt.transfer(msg.sender, amount), "Withdraw failed");
        emit Withdrawn(msg.sender, amount);
    }

    function hasUserClaimed(address user) external view returns (bool) {
        return hasClaimed[user];
    }
}

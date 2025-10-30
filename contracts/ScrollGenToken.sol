// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ScrollGenToken (SGT)
/// @notice Core token of the ScrollGen ecosystem on Scroll zkEVM
/// @dev ERC-20 token with minting and burning capabilities
contract ScrollGenToken is ERC20, Ownable {

    /// @notice Emitted when tokens are minted
    event TokensMinted(address indexed to, uint256 amount);

    /// @notice Emitted when tokens are burned
    event TokensBurned(address indexed from, uint256 amount);

    /// @notice Deploy the ScrollGen token with initial supply
    /// @param initialSupply The initial token supply (in whole tokens, not wei)
    constructor(uint256 initialSupply) ERC20("ScrollGen Token", "SGT") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /// @notice Mint new tokens (only owner)
    /// @param to Address to receive the tokens
    /// @param amount Amount of tokens to mint (in whole tokens)
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        uint256 mintAmount = amount * 10 ** decimals();
        _mint(to, mintAmount);
        emit TokensMinted(to, mintAmount);
    }

    /// @notice Burn tokens from your own balance
    /// @param amount Amount of tokens to burn (in whole tokens)
    function burn(uint256 amount) external {
        uint256 burnAmount = amount * 10 ** decimals();
        require(balanceOf(msg.sender) >= burnAmount, "Insufficient balance to burn");
        _burn(msg.sender, burnAmount);
        emit TokensBurned(msg.sender, burnAmount);
    }

    /// @notice Get token information
    /// @return tokenName Token name
    /// @return tokenSymbol Token symbol
    /// @return tokenDecimals Token decimals
    /// @return tokenTotalSupply Total token supply
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply
    ) {
        tokenName = name();
        tokenSymbol = symbol();
        tokenDecimals = decimals();
        tokenTotalSupply = totalSupply();
    }
}

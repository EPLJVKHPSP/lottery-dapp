// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Lottery is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Item {
        string name;
        EnumerableSet.AddressSet bidders;
        address winner;
        uint256 bidCount;
    }

    mapping(uint256 => Item) private items;
    mapping(address => uint256) public balances;

    bool public drawConducted;
    address public additionalAuthorized;

    event BidPlaced(address indexed bidder, uint256 indexed itemId);
    event WinnersDeclared(address winner1, address winner2, address winner3);
    event ContractWithdrawn(uint256 amount);

    modifier onlyAuthorized() {
        require(msg.sender == owner() || msg.sender == additionalAuthorized, "Not authorized");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize each item separately
        items[1].name = "Car";
        items[2].name = "Phone";
        items[3].name = "Computer";

        // Initialize the bidders set and other fields
        for (uint256 i = 1; i <= 3; i++) {
            items[i].winner = address(0);
            items[i].bidCount = 0;
        }

        additionalAuthorized = 0x153dfef4355E823dCB0FCc76Efe942BefCa86477; //for 9b
    }

    function bid(uint256 itemId) external payable {
        require(!drawConducted, "The draw has already been conducted");
        require(msg.sender != owner(), "Owner cannot bid");
        require(msg.value == 0.01 ether, "Incorrect bid amount");
        
        Item storage item = items[itemId];
        item.bidders.add(msg.sender);
        item.bidCount++;
        
        emit BidPlaced(msg.sender, itemId);
    }

   function declareWinners() external onlyOwner {
    require(!drawConducted, "Draw already conducted");

    bool winnersDeclared = false;
    for (uint256 i = 1; i <= 3; i++) {
        if (items[i].bidCount > 0) {
            items[i].winner = selectRandomWinner(items[i].bidders);
            winnersDeclared = true;
            // Optionally emit an event for each winner declared
        }
    }

    require(winnersDeclared, "No bids placed for any items");
    drawConducted = true;
    // Emit an event if you want to signal that the draw has been conducted
    }


    function selectRandomWinner(EnumerableSet.AddressSet storage bidders) private view returns (address) {
        if (bidders.length() == 0) return address(0);
        // This is not a secure way of random generation, for demonstration purposes only.
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % bidders.length();
        return bidders.at(randomIndex);
    }

    function amIWinner(uint256 itemId) external view returns (bool) {
        require(drawConducted, "Draw not yet conducted");
        return items[itemId].winner == msg.sender;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
        emit ContractWithdrawn(balance);
    }

    function setAdditionalAuthorized(address _additional) external onlyOwner {
        additionalAuthorized = _additional;
    }

    function initiateNewCycle() external onlyOwner {
        require(drawConducted, "Previous draw not conducted");
        for (uint256 i = 1; i <= 3; i++) {
            Item storage item = items[i];
            delete item.bidders;
            item.winner = address(0);
            item.bidCount = 0;
        }
        drawConducted = false;
    }

    function transferContractOwnership(address newOwner) external onlyOwner {
        transferOwnership(newOwner);
        emit OwnershipTransferred(owner(), newOwner);
    }

    function destructContract() external onlyOwner {
        selfdestruct(payable(owner()));
    }
}
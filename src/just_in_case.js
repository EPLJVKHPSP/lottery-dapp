import React, { useState, useEffect } from 'react';
import getWeb3 from './utils/getweb3';
import { contractABI } from './constants/contractABI';
import { contractAddress } from './constants/contractAddress';
import Web3 from 'web3';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [owner, setOwner] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [bidCounts, setBidCounts] = useState({ car: 0, phone: 0, computer: 0 });
  const [contractBalance, setContractBalance] = useState('');
  const [bidAmount, setBidAmount] = useState('0.01');
  const [winningItems, setWinningItems] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        const accounts = await web3Instance.eth.getAccounts();
        const instance = new web3Instance.eth.Contract(contractABI, contractAddress);

        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setContract(instance);

        const ownerAddress = await instance.methods.owner().call();
        setOwner(ownerAddress);
        setIsOwner(accounts[0] === ownerAddress);

        await fetchBidCountsAndBalance(instance);
      } catch (error) {
        console.error("Could not connect to contract or chain.", error);
      }
    };

    init();
  }, []);

  // This function is now explicitly called after a bid is placed to update the UI
  const fetchBidCountsAndBalance = async () => {
    try {
      const instance = contract; // Use the already set contract instance
      const carBidCount = await instance.methods.bidCount(1).call();
      const phoneBidCount = await instance.methods.bidCount(2).call();
      const computerBidCount = await instance.methods.bidCount(3).call();
      const balance = await web3.eth.getBalance(contractAddress);

      setBidCounts({ car: parseInt(carBidCount), phone: parseInt(phoneBidCount), computer: parseInt(computerBidCount) });
      setContractBalance(web3.utils.fromWei(balance, 'ether'));
    } catch (error) {
      console.error('Error fetching bid counts and balance:', error);
    }
  };

  // Transfer Ownership function remains the same
  const transferOwnership = async () => {
    try {
      await contract.methods.transferOwnership(newOwnerAddress).send({ from: account });
      alert("Ownership has been transferred.");
      setNewOwnerAddress(''); // Reset new owner address field
    } catch (error) {
      alert(`Error transferring ownership: ${error.message}`);
    }
  };

  const placeBid = async (itemId) => {
    const etherValue = Web3.utils.toWei(bidAmount, 'ether');
    try {
      await contract.methods.bid(itemId).send({ from: account, value: etherValue })
        .on('receipt', () => {
          alert('Bid placed successfully!');
          fetchBidCountsAndBalance(); // Ensure state is updated after the transaction
        });
    } catch (error) {
      alert(`Error placing bid: ${error.message}`);
    }
  };

  const checkIfWinner = async () => {
    let winnerMessage = '';
    let winners = [];
    for (let itemId = 1; itemId <= 3; itemId++) {
      try {
        const result = await contract.methods.amIWinner(itemId).call({ from: account });
        if (result) winners.push(itemId);
      } catch (error) {
        console.error("Error checking winner status", error);
      }
    }
    if (winners.length > 0) {
      winnerMessage = `You won the following item(s): ${winners.join(', ')}`;
    } else {
      winnerMessage = "You have not won this time.";
    }
    setWinningItems(winnerMessage);
  };

  const declareWinners = async () => {
    try {
      await contract.methods.declareWinners().send({ from: account });
      alert("Winners have been declared.");
      // Refresh any necessary state here
    } catch (error) {
      alert(`Error declaring winners: ${error.message}`);
    }
  };
  
  const withdrawFunds = async () => {
    try {
      await contract.methods.withdraw().send({ from: account });
      alert("Funds withdrawn successfully.");
      // Refresh the contract balance to show the updated amount
      await fetchBidCountsAndBalance(contract);
    } catch (error) {
      alert(`Error withdrawing funds: ${error.message}`);
    }
  };
  
  const destructContract = async () => {
    try {
      await contract.methods.destructContract().send({ from: account });
      alert("Contract destroyed successfully.");
      // After contract destruction, you may want to redirect the user or clear the state
    } catch (error) {
      alert(`Error destroying contract: ${error.message}`);
    }
  };

  const initiateNewCycle = async () => {
    try {
      await contract.methods.initiateNewCycle().send({ from: account });
      alert("Auction has been restarted for a new cycle.");
      setBidCounts({ car: 0, phone: 0, computer: 0 }); // Reset bid counts
      setWinningItems(''); // Clear winning items
    } catch (error) {
      alert(`Error initiating new cycle: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Lottery DApp</h1>
      <p>Connected Account: {account}</p>
      {isOwner && (
        <>
          <p>You are the owner of this contract.</p>
          <input 
            type="text" 
            value={newOwnerAddress} 
            onChange={(e) => setNewOwnerAddress(e.target.value)} 
            placeholder="Enter new owner address" 
          />
          <button onClick={transferOwnership}>Transfer Ownership</button>
        </>
      )}
      <p>Contract Owner: {owner}</p>
      <p>Total Bids for Car: {bidCounts.car}</p>
      <p>Total Bids for Phone: {bidCounts.phone}</p>
      <p>Total Bids for Computer: {bidCounts.computer}</p>
      <p>Contract Balance: {contractBalance} ETH</p>
      <button onClick={() => placeBid(1)} disabled={isOwner}>Bid on Car</button>
      <button onClick={() => placeBid(2)} disabled={isOwner}>Bid on Phone</button>
      <button onClick={() => placeBid(3)} disabled={isOwner}>Bid on Computer</button>
      <button onClick={checkIfWinner} disabled={isOwner}>Am I Winner?</button>
      {winningItems && <p>{winningItems}</p>}
      {/* Ensure buttons are always visible but disabled for non-owners */}
      <button onClick={declareWinners} disabled={!isOwner}>Declare Winners</button>
      <button onClick={withdrawFunds} disabled={!isOwner}>Withdraw Funds</button>
      <button onClick={destructContract} disabled={!isOwner}>Destroy Contract</button>
      <button onClick={initiateNewCycle} disabled={!isOwner}>Initiate New Cycle</button>
    </div>
  );
}

export default App;
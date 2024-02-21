import React, { useState, useEffect } from 'react';
import getWeb3 from './utils/getweb3';
import { contractABI } from './constants/contractABI';
import { contractAddress } from './constants/contractAddress';
import Web3 from 'web3';

import { TextField, Button, Box, Grid, Typography, Snackbar, Alert } from '@mui/material';

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
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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

  const fetchBidCountsAndBalance = async (instance) => {
    try {
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

  const transferOwnership = async () => {
    try {
      await contract.methods.transferOwnership(newOwnerAddress).send({ from: account });
      setSnackbarMessage("Ownership has been transferred.");
      setOpenSnackbar(true);
      setNewOwnerAddress('');
    } catch (error) {
      setSnackbarMessage(`Error transferring ownership: ${error.message}`);
      setOpenSnackbar(true);
    }
  };

  const placeBid = async (itemId) => {
    const etherValue = Web3.utils.toWei(bidAmount, 'ether');
    try {
      await contract.methods.bid(itemId).send({ from: account, value: etherValue });
      fetchBidCountsAndBalance(contract);
      alert('Bid placed successfully!');
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
      setBidCounts({ car: 0, phone: 0, computer: 0 });
      setWinningItems('');
    } catch (error) {
      alert(`Error initiating new cycle: ${error.message}`);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <Grid container spacing={2} direction="column" alignItems="center">
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>Lottery DApp</Typography>
      </Grid>
      <Grid item xs={12}>
        <p>Connected Account: {account}</p>
        {isOwner && (
          <>
            <p>You are the owner of this contract.</p>
            <Box sx={{ my: 2 }}>
              <TextField
                label="Enter new owner address"
                variant="outlined"
                value={newOwnerAddress}
                onChange={(e) => setNewOwnerAddress(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={transferOwnership}
                disabled={!isOwner}
                sx={{ mt: 1 }}
              >
                Transfer Ownership
              </Button>
            </Box>
          </>
        )}
        <p>Contract Owner: {owner}</p>
        <p>Total Bids for Car: {bidCounts.car}</p>
        <p>Total Bids for Phone: {bidCounts.phone}</p>
        <p>Total Bids for Computer: {bidCounts.computer}</p>
        <p>Contract Balance: {contractBalance} ETH</p>
        <Button variant="contained" color="primary" onClick={() => placeBid(1)} disabled={isOwner}>Bid on Car</Button>
        <Button variant="contained" color="primary" onClick={() => placeBid(2)} disabled={isOwner}>Bid on Phone</Button>
        <Button variant="contained" color="primary" onClick={() => placeBid(3)} disabled={isOwner}>Bid on Computer</Button>
        <Button variant="contained" color="primary" onClick={checkIfWinner} disabled={isOwner}>Am I Winner?</Button>
        {winningItems && <p>{winningItems}</p>}
        <Button variant="contained" color="primary" onClick={declareWinners} disabled={!isOwner}>Declare Winners</Button>
        <Button variant="contained" color="primary" onClick={withdrawFunds} disabled={!isOwner}>Withdraw Funds</Button>
        <Button variant="contained" color="primary" onClick={destructContract} disabled={!isOwner}>Destroy Contract</Button>
        <Button variant="contained" color="primary" onClick={initiateNewCycle} disabled={!isOwner}>Initiate New Cycle</Button>
      </Grid>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default App;
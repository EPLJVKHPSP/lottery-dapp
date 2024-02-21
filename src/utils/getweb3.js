import Web3 from 'web3';

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    window.addEventListener('load', async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.enable(); // Request account access
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      } else {
        reject('Must install MetaMask.');
      }
    });
  });

export default getWeb3;

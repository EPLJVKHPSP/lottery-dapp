require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
require('@nomiclabs/hardhat-ethers');

const rpcUrl = process.env.API_URL?.trim();
const privateKey = process.env.PRIVATE_KEY?.trim();
if (rpcUrl && !/^https?:\/\//.test(rpcUrl)) {
  throw new Error('API_URL must be an HTTP or HTTPS RPC URL.');
}
if (privateKey && !/^(?:0x)?[a-fA-F0-9]{64}$/.test(privateKey)) {
  throw new Error('PRIVATE_KEY must contain 64 hexadecimal characters, optionally prefixed by 0x.');
}
const accounts = privateKey ? [`0x${privateKey.replace(/^0x/, '')}`] : [];

module.exports = {
  solidity: '0.8.20',
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    ...(rpcUrl ? { sepolia: { url: rpcUrl, accounts } } : {}),
  },
};

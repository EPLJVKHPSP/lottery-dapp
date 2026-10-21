# Local configuration

Use Node.js 20 or later. From the repository root:

```bash
npm ci
cp .env.example .env
npx hardhat compile
```

Compilation and the default local Hardhat network need no credentials.
For Sepolia deployment, set `API_URL` to your RPC endpoint and `PRIVATE_KEY`
to your own testnet wallet key in `.env`. Either form, with or without `0x`,
is accepted. Fund that wallet with Sepolia test ETH.

```bash
npx hardhat run deployments/deploy.js --network sepolia
```

`.env` is loaded automatically from the repository root and ignored by Git.
Process environment variables take precedence. Deployment broadcasts a
transaction only when you explicitly run the deployment command.

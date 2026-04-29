# CampusCoin

CampusCoin is a blockchain-based campus wallet and transaction system. It combines a React frontend with a Solidity smart contract deployed through Hardhat, allowing students, parents, canteen staff, and administrators to interact with campus payments in a local Ethereum development environment.

## Features

- Student wallet dashboard
- Parent dashboard
- Canteen transaction interface
- Admin panel
- QR-based account support
- Smart contract integration with ethers.js
- Local blockchain development using Hardhat

## Tech Stack

- React
- Vite
- Solidity
- Hardhat
- ethers.js
- Tailwind CSS

## Project Structure

```txt
blockchain/   Solidity smart contract and Hardhat setup
frontend/     React and Vite user interface
```

## Run Locally

Install dependencies in both project folders:

```bash
cd blockchain
npm install

cd ../frontend
npm install
```

Start the local blockchain:

```bash
cd blockchain
npx hardhat node
```

Deploy the smart contract:

```bash
cd blockchain
npx hardhat ignition deploy ./ignition/modules/CampusCoin.js --network localhost
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```txt
http://127.0.0.1:5173/
```


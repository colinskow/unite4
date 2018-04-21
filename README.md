# Unite4

Classic game of Connect4, played on the blockchain as an Ethereum Smart Contract. Optionally wager Ether.

Built for Siraj Raval's Decentralized Application Course at [School of AI](https://www.theschool.ai/).

## How it works

1) Register a username for your account.
2) Create a game with an optional ether wager. You can choose first or second player and even set a move timeout.
3) Players take turns selecting which column to drop their token
4) Four in a row horizontal, vertical, or diagonal wins all money in the pot.
5) In the case of a draw, all wagers are refunded.
6) If either player takes longer than the timelimit to move, the waiting player can call "timeout" and win the game.

## Setup

Requires NodeJS 8+.

1) First make sure you have Truffle installed:

`npm install -g truffle`

2) Next install the project dependencies:

`npm install`

3) Launch Ganache Desktop or CLI. Then deploy the contracts.

`truffle migrate`

## Run Frontend

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Current Issues

I committed to building the front-end with Web3 1.0 beta. I found out last minute that 1.0 beta doesn't currently support Ganache or Metamask for listening to contract events. (Which is absolutely necessary for the functionality of the app!)

So I'm stuck until I either downgrade to a prior version of Web3 (re-write almost everything) or one of the following issues gets closed:

- [Metamask Support](https://github.com/MetaMask/metamask-extension/issues/3642)
- [Ganache Support](https://github.com/trufflesuite/ganache-cli/issues/257)

The rest of the code should theoretically work, but I am unable to test it until event listeners are resolved.

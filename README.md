# PolkaFantasy's token linear vesting website
This repository contains the Token Linear Vesting frontend for PolkaFantasy project. This set of HTML pages that have been created to interact with the vesting process after PolkaFantasy's crowdsale.

### Pre-requirements:
Before you setup the website, you should do the following steps first:
1. Deploy the contracts.
2. Run the sync node: [polka-sync](https://github.com/ahmetson/polka-sync)

> The instructions about how to deploy smartcontracts are in the *Polka Vesting* repository.
> The instructions about how to run the sync bot is in *polka-sync* repository.

## About the source code

The source code in this repo has been created based on Web3 Modal Javascript library to allow to connect multiple Wallets into Website.

- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Deploy Vesting Period](#deploy-vesting-period)
  - [Deploy Token example (Testing purposes)](#deploy-token-example)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Requirements
You will need node.js (12.* or later) and npm installed to run it locally. 

1. Import the repository and `cd` into the new directory.
2. Run `npm install`.
3. Edit the **polkaConfig** variable in `js/polka.js` with the correct Smartcontract addresses:
   - The Config is the Object of Key-value storage.
   - Keys are the Chain IDs.
   - Values are the list of Smartcontract addresses.
   - Value `polka.address` is XP token address.
   Add the Config for appropriate Chain ID that you wish to connect to.
4. Edit the polkaSyncURL variable in `js/polka.js` with correct Polka Sync bot. 
6. Finally Run the Server: `npm run start`.
7. To visit Manager's website, visit: `https://localhost/manager.html`.

## Troubleshooting

If you have any questions, send them along with a hi to hello@dandelionlabs.io.

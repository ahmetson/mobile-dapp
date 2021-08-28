/**
 * This is the primary script containing the configuration
 * 
 * Depends on:
 * 
 * - web3
 * - evmChains
 */

// As for now we test the game on 
let polkaConfig = {
    "4": {
        "polka": {
            "address": "0x8C84C4f1C4b0e3aFf3fb18BE0b508EC737DC54ae",
            "abi": "polkaAbi"
        },
        "PrivateSale": {
            "address": "0x4Ea8Ef77ED3cbe424BB07BE4d5b9f8e368e914cF",
            "abi": "vestingAbi"
        },
        "ChainGuardian": {
            "address": "0x4Ea8Ef77ED3cbe424BB07BE4d5b9f8e368e914cF",
            "abi": "vestingAbi"
        },
        "TrustPad": {
            "address": "0x4Ea8Ef77ED3cbe424BB07BE4d5b9f8e368e914cF",
            "abi": "vestingAbi"
        },
       "LiquidityLock": {
           "address": "0x4Ea8Ef77ED3cbe424BB07BE4d5b9f8e368e914cF",
            "abi": "vestingAbi"
        }
    }
};

/**
 * Returns a contract instance to use. If the configuration doesn't support the connected wallet, then throws an error.
 * @param {string} name of contract to load from polkaConfig.
 * @throws Exception in case of unconnected wallet, invalid network, damage of configuration
 */
let getContract = async function(name) {
    if (!web3) {
        throw "Failed to load Web3 library. Please check your internet connection!";
    }
    if (web3.eth === undefined) {
        throw "Provider not instantiniated. Please connect the wallet";
    }

    let chainId = await web3.eth.getChainId();
    if (undefined === polkaConfig[chainId]) {
        // Load chain information over an HTTP API
        const chainData = window.evmChains.getChain(chainId);

        throw `${chainData.name} not supported. Please switch your blockchain network!`;
    }

    if (polkaConfig[chainId][name] === undefined) {
        throw `Invalid contract name ${name} in Polka config!`;
    }

    let address = polkaConfig[chainId][name].address;
    let abiName = polkaConfig[chainId][name].abi;
    let abi = window[abiName];

    if (abi == undefined) {
        throw "Failed to load Abi. Please Check your internet connection!";
    }
    return new web3.eth.Contract(abi, address);
}


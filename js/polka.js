/**
 * This is the primary script containing the configuration
 * 
 * Depends on:
 * 
 * - web3
 * - evmChains
 */
 
let FIXED_DIGITS = 6;

// As for now we test the game on 
let blockchainConfig = {
    "4": {                                  // Chain ID, 1 for Ethereum Mainnet. 4 for Rinkeby Testnet.
        "scape": {
            "address": "0x7115ABcCa5f0702E177f172C1c14b3F686d6A63a",
            "abi": "scapeAbi"
        }
    }
};

/**
 * Returns a contract instance to use. If the configuration doesn't support the connected wallet, then throws an error.
 * @param {string} name of contract to load from blockchainConfig.
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
    if (undefined === blockchainConfig[chainId]) {
        // Load chain information over an HTTP API
        const chainData = window.evmChains.getChain(chainId);

        throw `${chainData.name} not supported. Please switch your blockchain network!`;
    }

    if (blockchainConfig[chainId][name] === undefined) {
        throw `Invalid contract name ${name} in Polka config!`;
    }

    let address = blockchainConfig[chainId][name].address;
    let abiName = blockchainConfig[chainId][name].abi;
    let abi = window[abiName];

    if (abi == undefined) {
        throw "Failed to load Abi. Please Check your internet connection!";
    }
    return new web3.eth.Contract(abi, address);
}


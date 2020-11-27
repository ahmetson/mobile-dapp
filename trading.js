const cwsAddress = '0x168840df293413a930d3d40bab6e1cd8f406719d';
const CWS = new UNISWAP.Token(UNISWAP.ChainId.RINKEBY, cwsAddress, 18);

// get router address from https://uniswap.org/docs/v2/smart-contracts/router02/
const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

// Uniswap trading fee: 3%
const fee = 0.03;

// Actual number to use, as it may be changed in blockchain
// uses uniswap sdk
let calculateEthValue = async function(amountIn) {
    await printCwsBalance();
    
    const fee = amountIn * 0.03;
    amountIn = web3.utils.toWei(amountIn.toString());
    
    // note that you may want/need to handle this async code differently,
    // for example if top-level await is not an option
    const pair = await UNISWAP.Fetcher.fetchPairData(CWS, UNISWAP.WETH[CWS.chainId])

    const route = new UNISWAP.Route([pair], UNISWAP.WETH[CWS.chainId])

    const trade = new UNISWAP.Trade(route, new UNISWAP.TokenAmount(UNISWAP.WETH[CWS.chainId], amountIn), UNISWAP.TradeType.EXACT_INPUT);

    const slippageTolerance = new UNISWAP.Percent('50', '10000') // 50 bips, or 0.50%
    
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
    const amountOut = trade.outputAmount.raw // needs to be converted to e.g. hex
    const path = [UNISWAP.WETH[CWS.chainId].address, CWS.address]
    const to = '' // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
    const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
    const priceImpact = trade.priceImpact.toSignificant(6);


    const actualEth = web3.utils.fromWei(value.toString());
    const actualCws = web3.utils.fromWei(amountOut.toString());
    const actualMin = web3.utils.fromWei(amountOutMin.toString());

    console.log("For Eth: "+actualEth);
    console.log("Receive CWS: "+actualCws);
    console.log("1 Eth = "+(1/(actualEth)*actualCws) + " CWS");
    console.log()
    console.log("Minimum received: "+actualMin);
    console.log("Price Impact: "+priceImpact);
    console.log("Fee: "+fee+" ETH");
    return {out: amountOut, min: amountOutMin, value: value, path: path, deadline: deadline};
};

let calculateCwsValue = async function(amountIn) { 
    await printCwsBalance();

    const fee = amountIn * 0.03;    
    amountIn = web3.utils.toWei(amountIn.toString());
    
    // note that you may want/need to handle this async code differently,
    // for example if top-level await is not an option
    const pair = await UNISWAP.Fetcher.fetchPairData(CWS, UNISWAP.WETH[CWS.chainId])

    const route = new UNISWAP.Route([pair], CWS)

    const trade = new UNISWAP.Trade(route, new UNISWAP.TokenAmount(
	CWS, amountIn), UNISWAP.TradeType.EXACT_INPUT);

    const slippageTolerance = new UNISWAP.Percent('50', '10000') // 50 bips, or 0.50%

    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
    const amountOut = trade.outputAmount.raw // needs to be converted to e.g. hex
    const path = [CWS.address, UNISWAP.WETH[CWS.chainId].address]
    const to = '' // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
    const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
    const priceImpact = trade.priceImpact.toSignificant(6);

    
    const actualCws = web3.utils.fromWei(value.toString());
    const actualEth = web3.utils.fromWei(amountOut.toString());
    const actualMin = web3.utils.fromWei(amountOutMin.toString());
    
    console.log("For CWS: "+actualCws);
    console.log("Receive Eth: "+actualEth);
    console.log("1 CWS = "+(1/(actualCws)*actualEth) + " ETH");
    console.log()
    console.log("Minimum received: "+actualMin);
    console.log("Price Impact: "+priceImpact);
    console.log("Fee: "+fee+" ETH");
    
    return {out: amountOut, min: amountOutMin, value: value, path: path, deadline: deadline};
};

let initRouter = async function() {
    if (window.router) {
	return;
    }

    window.router = new web3.eth.Contract(window.routerAbi, routerAddress)
};

let initCws = async function() {
    if (window.cws) {
	return;
    }

    window.cws = new web3.eth.Contract(window.erc20Abi, cwsAddress)
};

let printCwsBalance = async function() {
    await initCws();
    let cwsRaw = await cws.methods.balanceOf(web3.currentProvider.selectedAddress).call();
    console.log("CWS balance: "+web3.utils.fromWei(cwsRaw));
};

let swapEthToCws = async function(amount) {
    let swapData = await calculateEthValue(amount);
    await initRouter();

    let account = web3.currentProvider.selectedAddress;
    window.router.methods.swapExactETHForTokens(swapData.out.toString(), swapData.path, account, swapData.deadline)
	.send({from: account, value: swapData.value.toString()})
	    .on('transactionHash', function(hash){
		alert("Please wait tx confirmation...");
	    }.bind(this))
	    .on('receipt', function(receipt){
		alert(amount+" ETH swapped to "+web3.utils.fromWei(swapData.out.toString()));
	    }.bind(this))
	    .on('error', function(err){
		alert(err);
		console.error(err);
	    }.bind(this));
};

let swapCwsToEth = async function(amount) {
    let swapData = await calculateCwsValue(amount);
    await initRouter();

    let account = web3.currentProvider.selectedAddress;
    
    window.router.methods.swapExactTokensForETH(swapData.value.toString(), swapData.out.toString(), swapData.path, account, swapData.deadline)
	.send({from: account})
	    .on('transactionHash', function(hash){
		alert("Please wait tx confirmation...");
	    }.bind(this))
	    .on('receipt', function(receipt){
		alert(amount+" ETH swapped to "+web3.utils.fromWei(swapData.out.toString()));
	    }.bind(this))
	    .on('error', function(err){
		alert(err);
		console.error(err);
	    }.bind(this));
};



/////////////////////////////////////////////////////////////////////
// INIT
/////////////////////////////////////////////////////////////////////

let reverse = document.getElementById("reverse");
let swap = document.getElementById("swap");
let field0 = document.getElementById("field-0");
let field1 = document.getElementById("field-1");
let label0 = document.getElementById("label-0");
let label1 = document.getElementById("label-1");
let hint = document.getElementById("hint");

reverse.onclick = function() {
    let tmp = label0.innerText;
    label0.innerText = label1.innerText;
    label1.innerText = tmp;
};

swap.onclick = function() {
    // player swaps his eth to crowns
    if (label0.innerText == "Eth") {
	swapsEthToCws(field0.value);
    } else {
	swapsCwsToEth(field0.value);
    }
}


field0.onblur = async function() {
    let value = parseFloat(field0.value);
    if (isNaN(value)) {
	return false;
    }

    if (label0.innerText == "Eth") {
	let swapData = await calculateEthValue(field0.value);

	const actualEth = web3.utils.fromWei(swapData.value.toString());
	const actualCws = web3.utils.fromWei(swapData.out.toString());

	field1.value = actualCws;
	
	hint.innerHTML = "For Eth: "+actualEth + "<br>"+
	    "Receive CWS: "+actualCws+"<br>"+	    
	    "1 Eth = "+(1/(actualEth)*actualCws) + " CWS";	

    } else {
	let swapData = await calculateCwsValue(field0.value);
	const actualCws = web3.utils.fromWei(swapData.value.toString());
        const actualEth = web3.utils.fromWei(swapData.out.toString());
	
	field1.value = actualEth;
	
	hint.innerHTML = "For CWS: "+actualCws+"<br>" +	
            "Receive Eth: "+actualEth + "<br>"+	    
	    "1 CWS = "+(1/(actualCws)*actualEth) + " ETH";	
    }
}.bind(this);

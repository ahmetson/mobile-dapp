// this script is depends on trading.js

const daiAddress = '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea';
const DAI = new UNISWAP.Token(UNISWAP.ChainId.RINKEBY, daiAddress, 18);

// Actual number to use, as it may be changed in blockchain
// uses uniswap sdk
let calculateDaiValue = async function(amountIn) {
    await printCwsBalance();

    const fee = amountIn * 0.03;    
    amountIn = web3.utils.toWei(amountIn.toString());
    
    // note that you may want/need to handle this async code differently,
    // for example if top-level await is not an option
    const pairToEth = await UNISWAP.Fetcher.fetchPairData(DAI, UNISWAP.WETH[CWS.chainId])
    const pairToCws = await UNISWAP.Fetcher.fetchPairData(CWS, UNISWAP.WETH[CWS.chainId])
    
    const route = new UNISWAP.Route([pairToEth, pairToCws], DAI)

    const trade = new UNISWAP.Trade(route, new UNISWAP.TokenAmount(
	DAI, amountIn), UNISWAP.TradeType.EXACT_INPUT);

    const slippageTolerance = new UNISWAP.Percent('50', '10000') // 50 bips, or 0.50%

    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
    const amountOut = trade.outputAmount.raw // needs to be converted to e.g. hex
    const path = [DAI.address, UNISWAP.WETH[CWS.chainId].address, CWS.address]
    const to = '' // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
    const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
    const priceImpact = trade.priceImpact.toSignificant(6);

    
    const actualDai = web3.utils.fromWei(value.toString());
    const actualCws = web3.utils.fromWei(amountOut.toString());
    const actualMin = web3.utils.fromWei(amountOutMin.toString());
    
    console.log("For DAI: "+actualDai);
    console.log("Receive CWS: "+actualCws);
    console.log("1 DAI = "+(1/(actualDai)*actualCws) + " CWS");
    console.log()
    console.log("Minimum received: "+actualMin);
    console.log("Price Impact: "+priceImpact);
    console.log("Fee: "+fee+" DAI");
    
    return {out: amountOut, min: amountOutMin, value: value, path: path, deadline: deadline};

};

let calculateDaiToCwsValue = async function(amountIn) { 
    await printCwsBalance();

    const fee = amountIn * 0.03;    
    amountIn = web3.utils.toWei(amountIn.toString());
    
    // note that you may want/need to handle this async code differently,
    // for example if top-level await is not an option
    const pairToDai = await UNISWAP.Fetcher.fetchPairData(UNISWAP.WETH[CWS.chainId], DAI)
    const pairToEth = await UNISWAP.Fetcher.fetchPairData(CWS, UNISWAP.WETH[CWS.chainId])
    
    const route = new UNISWAP.Route([pairToEth, pairToDai], CWS)

    const trade = new UNISWAP.Trade(route, new UNISWAP.TokenAmount(
	CWS, amountIn), UNISWAP.TradeType.EXACT_INPUT);

    const slippageTolerance = new UNISWAP.Percent('50', '10000') // 50 bips, or 0.50%

    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
    const amountOut = trade.outputAmount.raw // needs to be converted to e.g. hex
    const path = [CWS.address, UNISWAP.WETH[CWS.chainId].address, DAI.address]
    const to = '' // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
    const value = trade.inputAmount.raw // // needs to be converted to e.g. hex
    const priceImpact = trade.priceImpact.toSignificant(6);

    
    const actualCws = web3.utils.fromWei(value.toString());
    const actualDai = web3.utils.fromWei(amountOut.toString());
    const actualMin = web3.utils.fromWei(amountOutMin.toString());
    
    console.log("For CWS: "+actualCws);
    console.log("Receive Dai: "+actualDai);
    console.log("1 CWS = "+(1/(actualCws)*actualDai) + " DAI");
    console.log()
    console.log("Minimum received: "+actualMin);
    console.log("Price Impact: "+priceImpact);
    console.log("Fee: "+fee+" DAI");
    
    return {out: amountOut, min: amountOutMin, value: value, path: path, deadline: deadline};
};

let initDai = async function() {
    if (window.dai) {
	return;
    }

    window.dai = new web3.eth.Contract(window.erc20Abi, daiAddress)
};

let swapDaiToCws = async function(amount) {
    let swapData = await calculateDaiValue(amount);
    await initRouter();

    let account = web3.currentProvider.selectedAddress;
    window.router.methods.swapExactTokensForTokens(swapData.out.toString(), swapData.path, account, swapData.deadline)
	.send({from: account, value: swapData.value.toString()})
    window.router.methods.swapExactTokensForTokens(swapData.value.toString(), swapData.min.toString(), swapData.path, account, swapData.deadline)
	.send({from: account})
	    .on('transactionHash', function(hash){
		alert("Please wait tx confirmation...");
	    }.bind(this))
	    .on('receipt', function(receipt){
		alert(amount+" DAI swapped to "+web3.utils.fromWei(swapData.out.toString()));
	    }.bind(this))
	    .on('error', function(err){
		alert(err);
		console.error(err);
	    }.bind(this));
};

let swapCwsToDai = async function(amount) {
    let swapData = await calculateDaiToCwsValue(amount);
    await initRouter();

    let account = web3.currentProvider.selectedAddress;
    
    window.router.methods.swapExactTokensForTokens(swapData.value.toString(), swapData.min.toString(), swapData.path, account, swapData.deadline)
	.send({from: account})
	    .on('transactionHash', function(hash){
		alert("Please wait tx confirmation...");
	    }.bind(this))
	    .on('receipt', function(receipt){
		alert(amount+" CWS swapped to "+web3.utils.fromWei(swapData.out.toString()));
	    }.bind(this))
	    .on('error', function(err){
		alert(err);
		console.error(err);
	    }.bind(this));
};



/////////////////////////////////////////////////////////////////////
// INIT
/////////////////////////////////////////////////////////////////////

let daiReverse = document.getElementById("dai-reverse");
let daiSwap = document.getElementById("dai-swap");
let daiField0 = document.getElementById("dai-field-0");
let daiField1 = document.getElementById("dai-field-1");
let daiLabel0 = document.getElementById("dai-label-0");
let daiLabel1 = document.getElementById("dai-label-1");
let daiHint = document.getElementById("dai-hint");

daiReverse.onclick = function() {
    let tmp = label0.innerText;
    daiLabel0.innerText = label1.innerText;
    daiLabel1.innerText = tmp;
};

daiSwap.onclick = function() {
    // player swaps his eth to crowns
    if (daiLabel0.innerText == "DAI") {
	swapDaiToCws(daiField0.value);
    } else {
	swapCwsToDai(daiField0.value);
    }
}


daiField0.onblur = async function() {
    let value = parseFloat(daiField0.value);
    if (isNaN(value)) {
	return false;
    }

    if (daiLabel0.innerText == "DAI") {
	let swapData = await calculateDaiValue(daiField0.value);

	const actualDai = web3.utils.fromWei(swapData.value.toString());
	const actualCws = web3.utils.fromWei(swapData.out.toString());

	daiField1.value = actualCws;
	
	daiHint.innerHTML = "For DAI: "+actualDai + "<br>"+
	    "Receive CWS: "+actualCws+"<br>"+	    
	    "1 DAI = "+(1/(actualDai)*actualCws) + " CWS";	

    } else {
	let swapData = await calculateDaiToCwsValue(daiField0.value);
	const actualCws = web3.utils.fromWei(swapData.value.toString());
        const actualDai = web3.utils.fromWei(swapData.out.toString());
	
	daiField1.value = actualDai;
	
	daiHint.innerHTML = "For CWS: "+actualCws+"<br>" +	
            "Receive DAI: "+actualDai + "<br>"+	    
	    "1 CWS = "+(1/(actualCws)*actualDai) + " DAI";	
    }
}.bind(this);

daiField1.onblur = async function() {
    let value = parseFloat(daiField1.value);
    if (isNaN(value)) {
	return false;
    }

    await initDai();

    if (daiLabel1.innerText == "DAI") {
	let swapData = await calculateDaiValue(daiField1.value);

	const actualDai = web3.utils.fromWei(swapData.value.toString());
	const actualCws = web3.utils.fromWei(swapData.out.toString());

	daiField0.value = actualCws;
	
	daiHint.innerHTML = "For DAI: "+actualDai + "<br>"+
	    "Receive CWS: "+actualCws+"<br>"+	    
	    "1 DAI = "+(1/(actualDai)*actualCws) + " CWS";

	
    } else {
	let swapData = await calculateDaiToCwsValue(daiField1.value);
	const actualCws = web3.utils.fromWei(swapData.value.toString());
        const actualDai = web3.utils.fromWei(swapData.out.toString());
	
	daiField0.value = actualDai;
	
	daiHint.innerHTML = "For CWS: "+actualCws+"<br>" +	
            "Receive DAI: "+actualDai + "<br>"+	    
	    "1 CWS = "+(1/(actualCws)*actualDai) + " DAI";	
    }
}.bind(this);

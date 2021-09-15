"use strict";

window.showPoolInfo = async function() {
  if (window.selectedPool == undefined) {
    return;
  }

  try {
    window.vesting = await getContract(selectedPool);
  } catch (e) {
    printErrorMessage(e);
    return;
  }

  let pool = await window.vesting.methods.pool().call();

  let totalSize = web3.utils.fromWei(pool.amount, "ether");
  let totalClaimed = web3.utils.fromWei(pool.totalClaimed, "ether");
  let remained = totalSize - totalClaimed;

  document.querySelector("#pool-info-name").textContent = selectedPool;
  document.querySelector("#pool-info-contract").textContent = window.vesting._address;
  document.querySelector("#pool-info-size").textContent = `${totalSize} Polka`;
  document.querySelector("#pool-info-remained").textContent = `${remained} Polka`;
  document.querySelector("#pool-info-claimed").textContent = `${totalClaimed} Polka`;
  document.querySelector("#pool-info-start-time").textContent = new Date(pool.startTime * 1000);
  document.querySelector("#pool-info-end-time").textContent = new Date(pool.endTime * 1000);
}

/**
 *  Checks whether the given CSV parsed by PapaParse.js is valid CSV or not.
 * 
 *  Valid CSV format:
 * investor,amount
 * <address>,<float> 
 */
function validateCsv(data) {
    if (!Array.isArray(data)) {
        return "No CSV array was passed";
    }

    if (data.length == 0) {
        return "Empty CSV";
    }

    if (data.length > 100) {
        return "Can add maximum 100 investors per transaction. Amount of investors given: "+data.length;
    }

    let firstRow = data[0];

    let keys = Object.keys(firstRow);
    if (keys.length != 2) {
        return "Expected 2 columns (investor, amount) to be given. CSV has "+keys.length+" columns";
    }

    for (var i = 0; i < data.length; i++ ) {
        let row = data[i];

        if (row.investor == undefined) {
            return `Row is missing 'investor' column at row: ${i + 1}`;
        }

        if (row.amount == undefined) {
            return `Row is missing 'amount' column at row: ${i + 1}`;
        }

        if (!web3.utils.isAddress(row.investor)) {
            return `Incorrect 'investor' value at row: ${i + 1}. Address ${row.investor} is wrong!`;
        }

        if (isNaN(parseFloat(row.amount))) {
            return `Incorrect 'amount' value at row: ${i + 1}. Address ${row.amount} is wrong!`;
        }
   }

    return true;
}

function printInvalidCsvMessage(message) {
    document.querySelector("#invalid-csv-message").textContent = message;
    invalidCsvModal.show();
}

/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
    window.csvFile = document.getElementById("csv-file");

    window.defaultData = DataGridXL.createEmptyData(5,2);

    // create empty grid
    window.grid = new DataGridXL("grid", {
        data: defaultData,
        columns: [{
            title: "investor",
            source: "investor"
        }, {
            title: "amount",
            source: "amount"
        }]
    });

    // Popup to show if CSV is invalid
    window.invalidCsvModal = new bootstrap.Modal(document.getElementById('invalid-csv-modal'), {
        keyboard: false
    })

    csvFile.onchange = function (e) {
        var file = e.target.files[0];

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                // this should clear all that's inside "grid" dom node...
                window.grid.setData(defaultData);
                printTotalPool();

                if (web3.utils == undefined) {
                    let errorMessage = "Connect your wallet first!";

                    printInvalidCsvMessage(errorMessage);

                    csvFile.value = ""
                } else if (results.errors.length > 0) {
                    let errorMessage = results.errors[0].message;

                    printInvalidCsvMessage(errorMessage);

                    csvFile.value = ""
                } else {
                    let validation = validateCsv(results.data);

                    if (validation === true) {
                        window.grid.setData(results.data);

                        printTotalPool();
                    } else {
                        printInvalidCsvMessage(validation)
                        csvFile.value = ""
                    }
                }
            }
        });
    }

    document.querySelector('#pool-selection').addEventListener('click', ({target}) => {
        if (target.getAttribute('name') === 'pool') { // check if user clicks right element
            window.selectedPool = target.id;
  
            showPoolInfo();
        }
    });

    document.querySelector("#btn-approve").addEventListener("click", onApprove);
    document.querySelector("#btn-add").addEventListener("click", onAdd);

    let toastEl = document.querySelector("#toast");
    window.toast = new bootstrap.Toast(toastEl);
});

/**
 * On approve wallet button pressed.
 */
async function onApprove() {
        if (window.totalPool === undefined || window.totalPool == 0) {
          printErrorMessage("No investor list to approve. Please upload CSV");
          return;
        }

        if (!web3) {
          printErrorMessage("No web3 library. Please check your internet connection");
          return;
        }

        if (!web3.eth) {
          printErrorMessage("Please connect your wallet!");
          return;
        }

        if (!window.vesting) {
          printErrorMessage("Please select a pool");
          return;
        }

        let owner = await vesting.methods.owner().call({from: window.selectedAccount});
        if (owner.toLowerCase() != window.selectedAccount.toLowerCase()) {
          printErrorMessage(`Allowed address: ${owner} not matching your account ${window.selectedAccount}`);
          return;
        }

        window.polka.methods.approve(vesting._address, web3.utils.toWei(totalPool.toString(), "ether"))
        .send({from: window.selectedAccount})
        .on('transactionHash', function(hash){
          document.querySelector("#toast-title").textContent = "Wait Approve...";
          document.querySelector(".toast-body").innerHTML = `See TX on
            <a href="https://rinkeby.etherscan.io/tx/${hash}" target="_blank">explorer</a>
          `;

          toast.show();

          document.querySelector("#btn-add").setAttribute("disabled", "");
        })
        .on('receipt', function(receipt){
          toast.hide();

          document.querySelector("#toast-title").textContent = "Approve confirmed!";
          document.querySelector(".toast-body").innerHTML = `See TX on
            <a href="https://rinkeby.etherscan.io/tx/${receipt.transactionHash}" target="_blank">explorer</a><br>

            Now, you can click on <i>Add</i> button.
          `;

          toast.show();

          document.querySelector("#btn-approve").setAttribute("disabled", "");
          document.querySelector("#btn-add").removeAttribute("disabled");
        })
        .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
          printErrorMessage(error.message);
          console.error(error.message);

          document.querySelector("#btn-add").removeAttribute("disabled", "");
        });
}

/**
 * On add wallet button pressed.
*/
async function onAdd() {
        if (window.grid === undefined) {
          printErrorMessage("No CSV list to approve. Please upload CSV");
          return;
        }

        let data = window.grid.getData();
        if (data.length == 0) {
          printErrorMessage("Empty CSV. Please upload investor list to add");
          return;
        }

        if (Array.isArray(window.grid.getData()[0])) {
          printErrorMessage("Empty CSV. Please upload investor list to add");
          return;
        }

        if (!web3) {
          printErrorMessage("No web3 library. Please check your internet connection");
          return;
        }

        if (!web3.eth) {
          printErrorMessage("Please connect your wallet!");
          return;
        }

        if (!window.vesting) {
          printErrorMessage("Please select a pool");
          return;
        }

        let owner = await vesting.methods.owner().call({from: window.selectedAccount});
        if (owner.toLowerCase() != window.selectedAccount.toLowerCase()) {
          printErrorMessage(`Vesting manager ${owner} not matching your account ${window.selectedAccount}`);
          return;
        }

        // Parameters to pass to smartcontract
        let investors = data.flatMap((row) => {
            return row.investor
        });
        let amounts = data.flatMap((row) => {
            return web3.utils.toWei(row.amount.toString(), "ether")
        });

        window.vesting.methods.addTokenGrants(investors, amounts)
        .send({from: window.selectedAccount})
        .on('transactionHash', function(hash){
          document.querySelector("#toast-title").textContent = "Wait Investor Addition...";
          document.querySelector(".toast-body").innerHTML = `See TX on
            <a href="https://rinkeby.etherscan.io/tx/${hash}" target="_blank">explorer</a>
          `;

          toast.show();

          document.querySelector("#btn-add").removeAttribute("disabled");
        })
        .on('receipt', function(receipt){
          toast.hide();

          document.querySelector("#toast-title").textContent = "Investors were added!";
          document.querySelector(".toast-body").innerHTML = `See TX on
            <a href="https://rinkeby.etherscan.io/tx/${receipt.transactionHash}" target="_blank">explorer</a><br>
          `;

          toast.show();

          document.querySelector("#btn-approve").removeAttribute("disabled");
          document.querySelector("#btn-add").setAttribute("disabled", "");

          csvFile.value = ""
          totalPool = 0;
          printTotalPool();
          showPoolInfo();
          showPolkaBalance();
          window.grid.setData(defaultData);
        })
        .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
          printErrorMessage(error.message);
          console.error(error.message);

          document.querySelector("#btn-add").removeAttribute("disabled", "");
        });
}

/**
 * Calculate total amount of tokens that manager should add into contract
 * 
 * We assume that data was validated by validateCsv() function.
 */
function calculateTotalPool(data) {
    let totalPool = 0;

    for (var i = 0; i < data.length; i++ ) {
        let row = data[i];

        let amount = parseFloat(row.amount);

        if (!isNaN(amount)) {
            totalPool += amount;
        }
    }

    return totalPool;
}


function printTotalPool() {
    window.totalPool = calculateTotalPool(window.grid.getData());

    document.querySelector("#total-pool-amount").textContent = totalPool;
}

/**
 Template Controllers

 @module Templates
 */

const defaultGasprice = 180000000000;


const stateDict = {


    "ApproveSending": "ApproveSending",
    "ApproveSendFail": "ApproveSendFail",
    "ApproveSendFailAfterRetries": "ApproveSendFailAfterRetries",
    "ApproveSent": "ApproveSent",
    "Approved": "Approved",

    "LockSending": "LockSending",
    "LockSendFail": "LockSendFail",
    "LockSendFailAfterRetries": "LockSendFailAfterRetries",
    "LockSent": "LockSent",
    "Locked": "Locked",

    "BuddyLocked": "BuddyLocked",

    "RedeemSending": "RedeemSending",
    "RedeemSendFail": "RedeemSendFail",
    "RedeemSendFailAfterRetries": "RedeemSendFailAfterRetries",
    "RedeemSent": "RedeemSent",
    "Redeemed": "Redeemed",

    "RevokeSending": "RevokeSending",
    "RevokeSendFail": "RevokeSendFail",
    "RevokeSendFailAfterRetries": "RevokeSendFailAfterRetries",
    "RevokeSent": "RevokeSent",
    "Revoked": "Revoked"

};


function canRefund(record) {
    let retResult = {};
    if (!record.lockedTime) {
        retResult.code = false;
        retResult.result = "need waiting bolck number.";
        return retResult;
    }

    let lockedTime = Number(record.lockedTime);
    let buddyLockedTime = Number(record.buddyLockedTime);
    let status = record.status;
    let buddyLockedTimeOut = Number(record.buddyLockedTimeOut);


    //global.lockedTime
    if (status !== 'BuddyLocked') {
        retResult.code = false;
        retResult.result = "waiting buddy lock";
        return retResult;
    }
    let currentTime = Number(Date.now()) / 1000; //unit s

    if (currentTime > buddyLockedTime && currentTime < buddyLockedTimeOut) {
        retResult.code = true;
        return retResult;
    } else {
        retResult.code = false;
        retResult.result = "Hash lock time is not meet.";
        return retResult;
    }
}

function canRevoke(record) {
    let retResult = {};
    if (!record.lockedTime) {
        retResult.code = false;
        retResult.result = "need waiting bolck number.";
        return retResult;
    }

    let lockedTime = Number(record.lockedTime);
    let buddyLockedTime = Number(record.buddyLockedTime);
    let status = record.status;
    let htlcTimeOut = Number(record.htlcTimeOut);

    if (status !== stateDict.BuddyLocked
        && status !== stateDict.Locked
        && status !== stateDict.RedeemSent
        && status !== stateDict.RedeemSending
        && status !== stateDict.RedeemSendFail
        && status !== stateDict.RedeemSendFailAfterRetries) {
        retResult.code = false;
        retResult.result = "Can not revoke,staus is not BuddyLocked or Locked";
        return retResult;
    }
    let currentTime = Number(Date.now()) / 1000;

    if (currentTime > htlcTimeOut) {
        retResult.code = true;
        return retResult;
    } else {
        retResult.code = false;
        retResult.result = "Hash lock time is not meet.";
        return retResult;
    }
}


function releaseEth2Weth(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;

    mist.ETH2WETH().getGasPrice('WAN', function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RefundGas;
            gasPrice = getGasPrice.gasPrice;

            if (gasPrice < defaultGasprice) {
                gasPrice = defaultGasprice
            }

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'ETH';

            // release x in wan
            mist.ETH2WETH().getRefundTransData(trans, function (err, getRefundTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {

                    // wan balance
                    mist.WETH2ETH().getBalance(show_data.crossAdress.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRefundTransData.refundTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: 'Insufficient WAN balance in your TO account',
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });

        }
    });
}

function releaseWeth2Eth(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;

    mist.WETH2ETH().getGasPrice('ETH', function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RefundGas;
            gasPrice = getGasPrice.gasPrice;

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'WETH';

            // release x in eth
            mist.WETH2ETH().getRefundTransData(trans, function (err, getRefundTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {

                    //eth balance
                    mist.ETH2WETH().getBalance(show_data.crossAdress.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRefundTransData.refundTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: 'Insufficient ETH balance in your TO account',
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });

        }
    })
}

function revokeEth2Weth(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;

    mist.ETH2WETH().getGasPrice('ETH', function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RevokeGas;
            gasPrice = getGasPrice.gasPrice;

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'ETH';
            // revoke x in eth
            // console.log('getRevokeTransData ETH: ', show_data.srcChainType);

            mist.ETH2WETH().getRevokeTransData(trans, function (err, getRevokeTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {
                    mist.ETH2WETH().getBalance(show_data.from.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRevokeTransData.revokeTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: 'Insufficient ETH balance in your FROM Account',
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });
        }
    })
}

function revokeWeth2Eth(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;
    mist.WETH2ETH().getGasPrice('WAN', function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RevokeGas;
            gasPrice = getGasPrice.gasPrice;

            if (gasPrice < defaultGasprice) {
                gasPrice = defaultGasprice
            }

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'WETH';
            // revoke x in wan
            // console.log('getRevokeTransData WAN: ', show_data.srcChainType);

            mist.WETH2ETH().getRevokeTransData(trans, function (err, getRevokeTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {
                    mist.WETH2ETH().getBalance(show_data.from.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRevokeTransData.revokeTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: 'Insufficient WAN balance in your FROM account',
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });
        }
    })
}

function releaseErc202Werc20(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;

    // get dst gas price
    mist.ERC202WERC20(show_data.tokenType).getGasPrice(show_data.dstChainType, function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RefundGas;
            gasPrice = getGasPrice.gasPrice;

            if (gasPrice < defaultGasprice) {
                gasPrice = defaultGasprice
            }

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'ETH';

            // release x in wan
            mist.ERC202WERC20(show_data.tokenType).getRefundTransData(show_data.tokenAddr, show_data.tokenType, trans, function (err, getRefundTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {

                    // WAN balance
                    mist.WERC202ERC20("WAN").getBalance(show_data.crossAdress.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRefundTransData.refundTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: 'Insufficient WAN balance in your TO account',
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });

        }
    });
}

function releaseWerc202Erc20(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;

    // get dst gas price
    mist.WERC202ERC20(show_data.tokenType).getGasPrice(show_data.dstChainType, function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RefundGas;
            gasPrice = getGasPrice.gasPrice;

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'WETH';

            // release x in eth
            mist.WERC202ERC20(show_data.tokenType).getRefundTransData(show_data.tokenAddr, show_data.tokenType, trans, function (err, getRefundTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {

                    // eth balance
                    mist.ERC202WERC20(show_data.tokenType).getBalance(show_data.crossAdress.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRefundTransData.refundTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: `Insufficient ${show_data.tokenType} balance in your TO account`,
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });

        }
    })
}

function revokeErc202Werc20(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;

    // get src chain gasPrice
    mist.ERC202WERC20(show_data.tokenType).getGasPrice(show_data.srcChainType, function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RevokeGas;
            gasPrice = getGasPrice.gasPrice;

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'ETH';
            // revoke x in eth
            // console.log('getRevokeTransData ETH: ', show_data.srcChainType);

            mist.ERC202WERC20(show_data.tokenType).getRevokeTransData(show_data.tokenAddr, show_data.tokenType, trans, function (err, getRevokeTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {
                    mist.ERC202WERC20(show_data.tokenType).getBalance(show_data.from.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRevokeTransData.revokeTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: `Insufficient ${show_data.tokenType} balance in your FROM Account`,
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });
        }
    })
}

function revokeWerc202Erc20(show_data, trans, transType) {
    let getGas;
    let gasPrice;
    let transData;

    // get src chain gasPrice
    mist.WERC202ERC20(show_data.tokenType).getGasPrice('WAN', function (err, getGasPrice) {
        if (err) {
            Helpers.showError(err);
        } else {
            getGas = getGasPrice.RevokeGas;
            gasPrice = getGasPrice.gasPrice;

            if (gasPrice < defaultGasprice) {
                gasPrice = defaultGasprice
            }

            trans.gasLimit = getGas;
            trans.gasPrice = gasPrice;

            // show_data.symbol = 'WETH';
            // revoke x in wan
            // console.log('getRevokeTransData WAN: ', show_data.srcChainType);

            mist.WERC202ERC20(show_data.tokenType).getRevokeTransData(show_data.tokenAddr, show_data.tokenType, trans, function (err, getRevokeTransData) {
                if (err) {
                    Helpers.showError(err);
                } else {
                    // get wan balance
                    mist.WERC202ERC20(show_data.dstChainType).getBalance(show_data.from.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRevokeTransData.revokeTransData;
                            let fee = new BigNumber(getGas * gasPrice);

                            if (fee.gt(new BigNumber(coinBalance, 10)))
                                return GlobalNotification.warning({
                                    content: 'Insufficient WAN balance in your FROM account',
                                    duration: 2
                                });

                            showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                        }
                    });
                }
            });
        }
    })
}

function showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType) {

    Session.set('isShowModal', true);

    EthElements.Modal.question({
        template: 'views_modals_sendcrosschainReleaseX',
        data: {
            from: show_data.from,
            to: show_data.to,
            storeman: show_data.storeman,
            crossAdress: show_data.crossAdress,
            amount: show_data.value,
            fee: EthTools.formatBalance(fee, '0,0.00[0000000000000000]', 'ether'),
            gasPrice: gasPrice,
            estimatedGas: getGas,
            data: transData,
            trans: trans,
            transType: transType,
            Chain: show_data.srcChainType,

            tokenAddr: show_data.tokenAddr,
            tokenStand: show_data.tokenStand,// ETH/ERC20/BTC....
            tokenType: show_data.tokenType,// ETH/ETH/BTC....
            symbol: show_data.symbol,
            fromText: show_data.fromText,
            toText: show_data.toText
        },
    }, {
        class: 'send-transaction-info',
        closeable: false
    });
}

function resultEach(template, result) {
    _.each(result, function (value, index) {

        if (value.htlcTimeOut) {
            let nowTime = new Date().Format('yyyy-MM-dd hh:mm:ss:S');
            let nowTimestamp =  Math.round(new Date(nowTime).getTime());


            // HTLCtime
            let endTimestamp = Number(value.htlcTimeOut)*1000;
            //let buddyLockedTimeOut = Number(value.buddyLockedTimeOut)*1000;


            if (endTimestamp > nowTimestamp) {
                if(value.status ===stateDict.Locked ||value.status ===stateDict.BuddyLocked || value.status ===stateDict.RedeemSending ){
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(endTimestamp - nowTimestamp)}</span>`;
                }
                else{
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.timeStamp2String(endTimestamp)}</span>`;
                }

            }else{
                value.htlcdate = `<span style="color: #1ec89a">${Helpers.timeStamp2String(endTimestamp)}</span>`;
            }


        }else{
            value.htlcdate = `<span style="color: #1ec89a">--</span>`;
        }

    });
}

let InterID;

Template['elements_cross_transactions_table_erc20'].onCreated(function () {
    let template = this;

    const self = this;
    let tokenAddrList = [self.data.tokenOrigAddr,self.data.tokenWanAddr];
    let symbol = self.data.symbol;
    let chainType = self.data.chainType;
    mist.ERC202WERC20(chainType).listHistory(self.data.addressList.concat(self.data.wanAddressList),tokenAddrList,symbol, (err, result) => {
        resultEach(template, result);

        Session.set('oldCrosschainList', result);
        TemplateVar.set(template, 'crosschainList', result);
    });


    InterID = Meteor.setInterval(function () {
        mist.ERC202WERC20(chainType).listHistory(self.data.addressList.concat(self.data.wanAddressList),tokenAddrList,symbol, (err, result) => {
            resultEach(template, result)

            let oldCrosschainResult = Session.get('oldCrosschainList');
            let oldResultHex = web3.toHex(oldCrosschainResult);
            let resultHex = web3.toHex(result);

            if (!oldCrosschainResult || oldResultHex !== resultHex) {
                // console.log('update history transaction: ',oldResultHex !== resultHex);
                Session.set('oldCrosschainList', result);
                TemplateVar.set(template, 'crosschainList', result);
            }
        });

    }, 10000);

});

Template['elements_cross_transactions_table_erc20'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});


Template['elements_cross_transactions_table_erc20'].helpers({
    historyList: function () {

        let crosschainList = [];

        if (TemplateVar.get('crosschainList') && TemplateVar.get('crosschainList').length > 0) {
            let smallStyle = 'display: block; color: #4b90f7;';

            _.each(TemplateVar.get('crosschainList'), function (value, index) {
                // console.log("value:", JSON.stringify(value));

                let style = 'display: block; font-size: 18px; background-color: transparent;';

                value.fromText = `<small style="${smallStyle}">${value.srcChainType}</small>`;
                value.toText = `<small style="${smallStyle}">${value.dstChainType}</small>`;

                if (value.srcChainType === 'WAN') {
                    value.tokenAddr = value.dstChainAddr;
                    value.tokenType = value.dstChainType;
                    if (value.tokenStand === 'E20') {
                        value.fromText = `<small style="${smallStyle}">W${value.tokenSymbol}(${value.srcChainType})</small>`;
                        value.toText = `<small style="${smallStyle}">${value.tokenSymbol}(${value.dstChainType})</small>`;
                    }

                } else {
                    value.tokenAddr = value.srcChainAddr;
                    value.tokenType = value.srcChainType;
                    if (value.tokenStand === 'E20') {
                        value.fromText = `<small style="${smallStyle}">${value.tokenSymbol}(${value.srcChainType})</small>`;
                        value.toText = `<small style="${smallStyle}">W${value.tokenSymbol}(${value.dstChainType})</small>`;
                    }

                }


                value.htlcdate = value.htlcTimeOut ? Helpers.timeStamp2String(Number(value.htlcTimeOut) * 1000) : "--";
                value.time = value.lockedTime ? Helpers.timeStamp2String(Number(value.lockedTime) * 1000) : "--";

                value.crossAdress = value.to;

                if (value.srcChainType === 'WAN') {
                    value.symbol = `W${value.tokenSymbol}`;
                } else {
                    value.symbol = value.tokenSymbol;
                }
                value.value = web3.fromWei(value.contractValue);
                value.state = value.status;
                value.operation = `<h2 style="${style}">${value.status}</h2>`;
                // value.state


                if (value.status === stateDict.ApproveSending) {
                    value.operation = `<h2 style="${style}">Approve</h2>`;
                    value.state = 'Pending';
                    // value.state = 'Cross-Tx 1/3'
                }
                else if (value.status === stateDict.ApproveSendFail) {
                    value.operation = `<h2 style="${style}">Approve</h2>`;
                }
                else if (value.status === stateDict.ApproveSendFailAfterRetries) {
                    value.operation = `<h2 style="${style}">Approve</h2>`;
                }
                else if (value.status === stateDict.ApproveSent) {
                    value.operation = `<h2 style="${style}">Approve</h2>`;
                    value.state = 'Cross-Tx 2/7';
                }
                else if (value.status === stateDict.Approved) {
                    value.state = 'Cross-Tx 3/7';
                }
                else if (value.status === stateDict.LockSending) {
                    value.operation = `<h2 style="${style}">Lock</h2>`;
                    value.state = 'Cross-Tx 4/7';
                }
                else if (value.status === stateDict.LockSendFail) {

                }
                else if (value.status === stateDict.LockSendFailAfterRetries) {

                }
                else if (value.status === stateDict.LockSent) {
                    value.state = 'Cross-Tx 5/7';
                }
                else if (value.status === stateDict.Locked) {
                    value.state = 'Cross-Tx 6/7';

                    let isCanRevoke = canRevoke(value).code;
                    value.htlcdate = value.htlcTimeOut ? Helpers.formatDuring(Number(value.htlcTimeOut) * 1000 - Date.now()) : "--";

                    // console.log("Locked:::::::::::isCanRevoke:",isCanRevoke);
                    if (isCanRevoke) {
                        style += 'color: #920b1c;';
                        value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                        value.state = 'To be cancelled';
                        value.htlcdate = value.htlcTimeOut ? Helpers.timeStamp2String(Number(value.htlcTimeOut) * 1000) : "--";

                    }

                }
                else if (value.status === stateDict.BuddyLocked) {
                    value.state = 'Cross-Tx 7/7';

                    let isCanRefund = canRefund(value).code;
                    let isCanRevoke = canRevoke(value).code;
                    // console.log("BuddyLocked:::::::::::isCanRefund:",isCanRefund);
                    // console.log("BuddyLocked:::::::::::isCanRevoke:",isCanRevoke);

                    if (isCanRefund) {
                        style += 'color: #920b1c;';
                        value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Confirm</h2>`;
                        value.state = 'To be confirmed';
                        value.htlcdate = value.buddyLockedTimeOut ? Helpers.formatDuring(Number(value.buddyLockedTimeOut) * 1000 - Date.now()) : "--";
                    } else {
                        if (!isCanRevoke) {
                            // style += 'color: #920b1c;';
                            value.operation = `<h2 id = ${index} style="${style}">Cancel</h2>`;
                            value.state = 'To be cancelled';
                            value.htlcdate = value.htlcTimeOut ? Helpers.formatDuring(Number(value.htlcTimeOut) * 1000 - Date.now()) : "--";
                        } else {
                            style += 'color: #920b1c;';
                            value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                            value.state = 'To be cancelled';
                            value.htlcdate = value.htlcTimeOut ? Helpers.timeStamp2String(Number(value.htlcTimeOut) * 1000) : "--";
                        }

                    }

                }
                else if (value.status === stateDict.RedeemSending) {
                    value.state = 'Confirming 1/3';
                }
                else if (value.status === stateDict.RedeemSendFail) {

                }
                else if (value.status === stateDict.RedeemSendFailAfterRetries) {

                }
                else if (value.status === stateDict.RedeemSent) {
                    value.state = 'Confirming 2/3';
                }
                else if (value.status === stateDict.Redeemed) {
                    value.state = 'Success';
                }
                else if (value.status === stateDict.RevokeSending) {
                    value.state = 'Cancelling 1/3';
                }
                else if (value.status === stateDict.RevokeSendFail) {

                }
                else if (value.status === stateDict.RevokeSendFailAfterRetries) {

                }
                else if (value.status === stateDict.RevokeSent) {
                    value.state = 'Cancelling 2/3';
                }
                else if (value.status === stateDict.Revoked) {
                    value.state = 'Cancelled';
                }

                crosschainList.push(value);
            });
        }

        return crosschainList;
    },

});


Template['elements_cross_transactions_table_erc20'].events({

    'click .show-detail': function (e) {
        let id = e.target.id;

        Session.set('isShowModal', true);

        let show_data = TemplateVar.get('crosschainList')[id];
        // console.log('show_data: ', show_data);

        if (show_data) {
            if (!show_data.HashX) {
                show_data.HashX = show_data.hashX;
            }

            if (show_data.srcChainType === 'WAN') {
                show_data.symbol = `W${show_data.tokenSymbol}`;
            } else {
                show_data.symbol = show_data.tokenSymbol;
            }

            EthElements.Modal.show({
                template: 'views_modals_crosstransactionInfo',
                data: {
                    HashX: show_data.HashX,
                    chain: show_data.srcChainType,
                    crossAdress: show_data.crossAdress,
                    from: show_data.from,
                    lockTxHash: show_data.lockTxHash,
                    refundTxHash: show_data.refundTxHash,
                    revokeTxHash: show_data.revokeTxHash,
                    storeman: show_data.storeman,
                    time: show_data.time,
                    to: show_data.to,
                    value: show_data.value,
                    x: show_data.x,
                    symbol: show_data.symbol,
                    status: show_data.state,
                    fromText: show_data.fromText,
                    toText: show_data.toText
                }
            }, {
                closeable: false
            });

        }

    },

    'click .crosschain-list': function (e) {
        let id = e.target.id;
        let show_data = TemplateVar.get('crosschainList')[id];

        let getGas;
        let gasPrice;
        let transData;
        let trans;
        let transType;

        // console.log('show_data: ', JSON.stringify(show_data));

        // suspending
        if (show_data.status === stateDict.RevokeSending) {
            return GlobalNotification.warning({
                content: 'Transaction locked now, please retry cancellation later',
                duration: 2
            });
        }

        if (show_data.srcChainType === 'WAN') {
            show_data.symbol = `W${show_data.tokenSymbol}`;
        } else {
            show_data.symbol = show_data.tokenSymbol;
        }

        if (show_data.tokenStand === 'E20') {

            let isCanRefund = canRefund(show_data).code;
            let isCanRevoke = canRevoke(show_data).code;

            // console.log("isCanRefund:", isCanRefund, "isCanRevoke:", isCanRevoke);

            trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.contractValue.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                x: show_data.x, hashX: show_data.hashX
            };

            if (isCanRefund) {
                transType = 'releaseX';
                // release X erc20 => werc20
                if (show_data.srcChainType !== 'WAN') {
                    releaseErc202Werc20(show_data, trans, transType);
                }
                // release X werc20 => erc20
                else {
                    releaseWerc202Erc20(show_data, trans, transType);
                }
            } else if (isCanRevoke) {
                transType = 'revoke';

                // revoke X erc20 => werc20
                if (show_data.srcChainType !== 'WAN') {
                    revokeErc202Werc20(show_data, trans, transType);
                }
                // revoke X werc20 => erc20
                else {
                    revokeWerc202Erc20(show_data, trans, transType);
                }
            } else {
                return GlobalNotification.warning({
                    content: 'Can not operate',
                    duration: 2
                });
            }


        } else if (show_data.tokenStand === 'ETH') {

            let isCanRefund = canRefund(show_data).code;
            let isCanRevoke = canRevoke(show_data).code;

            trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.contractValue.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                x: show_data.x, hashX: show_data.hashX
            };

            if (isCanRefund) {
                transType = 'releaseX';
                // release X eth => weth
                if (show_data.srcChainType !== 'WAN') {
                    releaseEth2Weth(show_data, trans, transType);
                }
                // release X weth => eth
                else {
                    releaseWeth2Eth(show_data, trans, transType);
                }
            } else if (isCanRevoke) {
                transType = 'revoke';

                // revoke X eth => weth
                if (show_data.srcChainType !== 'WAN') {
                    revokeEth2Weth(show_data, trans, transType);
                }
                // revoke X weth => eth
                else {
                    revokeWeth2Eth(show_data, trans, transType);
                }
            } else {
                return GlobalNotification.warning({
                    content: 'Can not operate',
                    duration: 2
                });
            }


        }

        // other status
        else {
            return GlobalNotification.warning({
                content: 'Can not operate',
                duration: 2
            });
        }

    },
});



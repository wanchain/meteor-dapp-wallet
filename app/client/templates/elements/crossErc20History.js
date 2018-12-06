/**
 Template Controllers

 @module Templates
 */

const defaultGasprice = 180000000000;


const stateDict = {

    "ApproveZeroSending":"ApproveZeroSending",
    "ApproveZeroSendFail":"ApproveZeroSendFail",
    "ApproveZeroSendFailAfterRetries":"ApproveZeroSendFailAfterRetries",
    "ApproveZeroFail":"ApproveZeroFail",
    "ApproveZeroSent":"ApproveZeroSent",
    "ApprovedZero":"ApprovedZero",

    "ApproveSending": "ApproveSending",
    "ApproveSendFail": "ApproveSendFail",
    "ApproveSendFailAfterRetries": "ApproveSendFailAfterRetries",
    "ApproveFail":"ApproveFail",
    "ApproveSent": "ApproveSent",
    "Approved": "Approved",

    "LockSending": "LockSending",
    "LockSendFail": "LockSendFail",
    "LockSendFailAfterRetries": "LockSendFailAfterRetries",
    "LockFail": "LockFail",
    "LockSent": "LockSent",
    "Locked": "Locked",

    "BuddyLocked": "BuddyLocked",

    "RedeemSending": "RedeemSending",
    "RedeemSendFail": "RedeemSendFail",
    "RedeemSendFailAfterRetries": "RedeemSendFailAfterRetries",
    "RedeemFail": "RedeemFail",
    "RedeemSent": "RedeemSent",
    "Redeemed": "Redeemed",

    "RevokeSending": "RevokeSending",
    "RevokeSendFail": "RevokeSendFail",
    "RevokeSendFailAfterRetries": "RevokeSendFailAfterRetries",
    "RevokeFail": "RevokeFail",
    "RevokeSent": "RevokeSent",
    "Revoked": "Revoked"

};

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
                    mist.WERC202ERC20("WAN").getBalance(show_data.crossAddress.toLowerCase(), function (err, coinBalance) {
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
                    mist.ERC202WERC20(show_data.tokenType).getBalance(show_data.crossAddress.toLowerCase(), function (err, coinBalance) {
                        if (err) {
                            Helpers.showError(err);
                        } else {
                            transData = getRefundTransData.refundTransData;
                            let fee = new BigNumber(getGas).mul(new BigNumber(gasPrice));

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
                            let fee = new BigNumber(getGas).mul(new BigNumber(gasPrice));

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
                            let fee = new BigNumber(getGas).mul(new BigNumber(gasPrice));

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
            crossAddress: show_data.crossAddress,
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
    _.each(result.crossCollection, function (value, index) {
        if (value.isNormalTrans){
            return;
        }
        if (value.htlcTimeOut) {
            let nowTime = new Date().Format('yyyy-MM-dd hh:mm:ss:S');
            let nowTimestamp =  Math.round(new Date(nowTime).getTime());


            // HTLCtime
            let endTimestamp = Number(value.htlcTimeOut)*1000;
            let buddyLockedTimeOut = Number(value.buddyLockedTimeOut)*1000;

            if(value.status ===stateDict.Redeemed ||value.status ===stateDict.Revoked){
                value.htlcdate = `<span>${Helpers.timeStamp2String(endTimestamp)}</span>`;
            }else{
                if (value.buddyLockedTimeOut && buddyLockedTimeOut > nowTimestamp){
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(buddyLockedTimeOut - nowTimestamp)}</span>`;
                } else if (endTimestamp > nowTimestamp) {
                    if (!value.buddyLockedTimeOut){
                        value.htlcdate = `<span>--</span>`;
                    } else {
                        value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(endTimestamp - nowTimestamp)}</span>`;
                    }
                }else{
                    //value.htlcdate = `<span style="color: #1ec89a">${Helpers.timeStamp2String(endTimestamp)}</span>`;
                    value.htlcdate = "<span style='color: red'>00 h, 00 min</span>";
                }
            }

        }else{
            value.htlcdate = `<span>--</span>`;
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

    let decimals = self.data.decimals;
    TemplateVar.set(template, 'decimals', decimals);

    mist.ERC202WERC20(chainType).listHistory(tokenAddrList,symbol, (err, result) => {
        resultEach(template, result);

        Session.set('oldCrosschainList', result);
        TemplateVar.set(template, 'crosschainList', result);
        TemplateVar.set(template, 'crossCollection', result.crossCollection);

    });


    InterID = Meteor.setInterval(function () {
        mist.ERC202WERC20(chainType).listHistory(tokenAddrList,symbol, (err, result) => {
            resultEach(template, result)

            let oldCrosschainResult = Session.get('oldCrosschainList');
            let oldResultHex = web3.toHex(oldCrosschainResult);
            let resultHex = web3.toHex(result);

            if (!oldCrosschainResult || oldResultHex !== resultHex) {
                // console.log('update history transaction: ',oldResultHex !== resultHex);
                Session.set('oldCrosschainList', result);
                TemplateVar.set(template, 'crosschainList', result);
                TemplateVar.set(template, 'crossCollection', result.crossCollection);
            }
        });

    }, 10000);

});

Template['elements_cross_transactions_table_erc20'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});


Template['elements_cross_transactions_table_erc20'].helpers({
    historyList: function () {

        let crossCollection = [];
        let decimals = TemplateVar.get('decimals');
        if (TemplateVar.get('crossCollection') && TemplateVar.get('crossCollection').length > 0) {
            let smallStyle = 'display: block; color: #4b90f7;';

            _.each(TemplateVar.get('crossCollection'), function (value, index) {
                let style = 'display: block; font-size: 18px; background-color: transparent;';
                if (value.isNormalTrans){

                    value.htlcdate = '--';
                    value.time = value.sendTime?Helpers.timeStamp2String(Number(value.sendTime) * 1000) : "--";
                    value.symbol = value.tokenSymbol;

                    value.fromText = `<small style="${smallStyle}">${value.tokenSymbol}</small>`;
                    value.toText = `<small style="${smallStyle}">${value.tokenSymbol}</small>`;
                    value.crossAddress = value.to;

                    value.value = value.amount?value.amount:Helpers.tokenFromWei(value.value, decimals);
                    value.amount = value.amount?value.amount:value.value;
                    value.state = value.status;
                    value.operation = `<h2 style="${style}"></h2>`;

                    crossCollection.push(value);
                }else{
                    let isCanRevoke = value.isCanRevoke;
                    let isCanRedeem = value.isCanRedeem;

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


                    value.time = value.sendTime ? Helpers.timeStamp2String(Number(value.sendTime) * 1000) : "--";

                    value.crossAddress = value.to;

                    if (value.srcChainType === 'WAN') {
                        value.symbol = `W${value.tokenSymbol}`;
                    } else {
                        value.symbol = value.tokenSymbol;
                    }
                    value.value = Helpers.tokenFromWei(value.contractValue, decimals);
                    value.state = value.status;
                    value.operation = `<h2 style="${style}">${value.status}</h2>`;
                    // value.state


                    if (value.status === stateDict.ApproveSending
                        || value.status === stateDict.ApproveSent
                        || value.status === stateDict.Approved
                        || value.status === stateDict.ApproveZeroSending
                        || value.status === stateDict.ApproveZeroSent
                        || value.status === stateDict.ApprovedZero
                    ) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Pending';
                        // value.state = 'Cross-Tx 1/3'
                    }
                    else if (value.status === stateDict.ApproveFail
                        || value.status === stateDict.ApproveSendFail
                        || value.status === stateDict.ApproveSendFailAfterRetries
                        || value.status === stateDict.ApproveZeroFail
                        || value.status === stateDict.ApproveZeroSendFail
                        || value.status === stateDict.ApproveZeroSendFailAfterRetries
                    ) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Failed';
                    }
                    else if (value.status === stateDict.LockSending) {
                        value.operation = `<h2 style="${style}">Confirm</h2>`;
                        value.state = 'Cross-Tx 1/4';
                    }
                    else if (value.status === stateDict.LockSendFail
                        || value.status === stateDict.LockSendFailAfterRetries
                        || value.status === stateDict.LockFail
                    ) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Failed';
                    }
                    else if (value.status === stateDict.LockSent) {
                        value.operation = `<h2 style="${style}">Confirm</h2>`;
                        value.state = 'Cross-Tx 2/4';
                    }
                    else if (value.status === stateDict.Locked) {
                        value.operation = `<h2 style="${style}">Confirm</h2>`;
                        value.state = 'Cross-Tx 3/4';

                        if (isCanRevoke) {
                            style += 'color: #920b1c;';
                            value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                            value.state = 'To be cancelled';

                        }

                    }
                    else if (value.status === stateDict.BuddyLocked) {
                        value.state = 'Cross-Tx success';

                        if (isCanRedeem) {
                            style += 'color: #920b1c;';
                            value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Confirm</h2>`;
                            value.state = 'To be confirmed';
                        } else {
                            if (!isCanRevoke) {
                                // style += 'color: #920b1c;';
                                value.operation = `<h2 id = ${index} style="${style}">Cancel</h2>`;
                                value.state = 'To be cancelled';
                            } else {
                                style += 'color: #920b1c;';
                                value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                                value.state = 'To be cancelled';
                            }

                        }

                    }
                    else if (value.status === stateDict.RedeemSending) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Confirming 1/3';

                        if (isCanRevoke) {
                            style += 'color: #920b1c;';
                            value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                            value.state = 'To be cancelled';
                        }
                    }
                    else if (value.status === stateDict.RedeemSendFail
                        || value.status === stateDict.RedeemSendFailAfterRetries
                        || value.status === stateDict.RedeemFail
                    ) {

                        if (isCanRedeem) {
                            style += 'color: #920b1c;';
                            value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Confirm Again</h2>`;
                            value.state = 'To be confirmed again';
                        } else {
                            if (!isCanRevoke) {
                                // style += 'color: #920b1c;';
                                value.operation = `<h2 id = ${index} style="${style}">Cancel</h2>`;
                                value.state = 'To be cancelled';
                            } else {
                                style += 'color: #920b1c;';
                                value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                                value.state = 'To be cancelled';
                            }
                        }
                    }
                    else if (value.status === stateDict.RedeemSent) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Confirming 2/3';

                        if (isCanRevoke) {
                            style += 'color: #920b1c;';
                            value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                            value.state = 'To be cancelled';
                        }
                    }
                    else if (value.status === stateDict.Redeemed) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Success';
                    }
                    else if (value.status === stateDict.RevokeSending) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Cancelling 1/3';
                    }
                    else if (value.status === stateDict.RevokeSendFail
                        || value.status === stateDict.RevokeSendFailAfterRetries
                        || value.status === stateDict.RevokeFail
                    ) {
                        style += 'color: #920b1c;';
                        value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel Again</h2>`;
                        value.state = 'To be cancelled again';
                    }
                    else if (value.status === stateDict.RevokeSent) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Cancelling 2/3';
                    }
                    else if (value.status === stateDict.Revoked) {
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Cancelled';
                    }

                    crossCollection.push(value);
                }

            });
        }
        return crossCollection;
    },

});


Template['elements_cross_transactions_table_erc20'].events({

    'click .show-detail': function (e) {
        let id = e.target.id;

        Session.set('isShowModal', true);
        let show_data = TemplateVar.get('crossCollection')[id];
        if (!show_data.isNormalTrans){
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
                    crossAddress: show_data.crossAddress,
                    from: show_data.from,
                    approveTxHash: show_data.approveTxHash,
                    approveZeroTxHash: show_data.approveZeroTxHash,
                    lockTxHash: show_data.lockTxHash,
                    redeemTxHash: show_data.redeemTxHash,
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

        }else{
            EthElements.Modal.show({
                template: 'views_modals_normaltransactionInfo',
                data: {
                    chainType: show_data.chainType,
                    tokenSymbol: show_data.tokenSymbol,
                    txHash: show_data.txHash,
                    from: show_data.from,
                    to: show_data.to,
                    value: show_data.value,
                    time: show_data.time,
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
        let show_data = TemplateVar.get('crossCollection')[id];

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

            trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.contractValue.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAddress,
                x: show_data.x, hashX: show_data.hashX
            };

            if (show_data.isCanRedeem) {
                transType = 'releaseX';
                // release X erc20 => werc20
                if (show_data.srcChainType !== 'WAN') {
                    releaseErc202Werc20(show_data, trans, transType);
                }
                // release X werc20 => erc20
                else {
                    releaseWerc202Erc20(show_data, trans, transType);
                }
            } else if (show_data.isCanRevoke) {
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



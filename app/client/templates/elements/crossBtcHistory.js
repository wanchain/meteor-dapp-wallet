/**
Template Controllers

@module Templates
*/

const defaultGasprice = 180000000000;

let InterID;

const stateDict = {
    'sentHashPending': 1, 'sentHashConfirming': 2, 'waitingCross': 3, 'waitingCrossConfirming': 4,
    'waitingX': 5,'sentXPending': 6, 'sentXConfirming': 7, 'refundFinished': 8,
    'waitingRevoke': 9,'sentRevokePending': 10, 'sentRevokeConfirming': 11, 'revokeFinished': 12,
    'sentHashFailed': 13, 'suspending': 14
};

function resultEach(template, result) {
    _.each(result, function (value, index) {
        delete value.meta;

        if (Helpers.isNumber(value.time)) {

            let nowTime = new Date().Format('yyyy-MM-dd hh:mm:ss:S');
            let nowTimestamp =  Math.round(new Date(nowTime).getTime());

            // HTLCtime
            let endTimestamp= value.HTLCtime;

            if (endTimestamp > nowTimestamp) {

                if (stateDict[value.status] === 8 || stateDict[value.status] === 12 || stateDict[value.status] === 13) {
                    value.htlcdate = `<span>${Helpers.timeStamp2String(endTimestamp)}</span>`;
                } else {
                    // console.log('endTimestamp,', endTimestamp);
                    // console.log('nowTimestamp,', nowTimestamp);
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(endTimestamp - nowTimestamp)}</span>`;
                }
            } else {

                if (stateDict[value.status] === 8 || stateDict[value.status] === 12 || stateDict[value.status] === 13) {
                    value.htlcdate = `<span>${Helpers.timeStamp2String(endTimestamp)}</span>`;
                } else {
                    value.htlcdate = "<span style='color: red'>00 h, 00 min</span>";
                }
            }
            value.time = Helpers.timeStamp2String(value.time);
        } else {
            value.htlcdate = `<span>${value.time}</span>`;
        }

    });
}

function showQuestion(show_data, trans, transType) {

    Session.set('isShowModal', true);

    EthElements.Modal.question({
        template: 'views_modals_sendcrossBtcReleaseX',
        data: {
            from: show_data.from,
            to: show_data.to,
            storeman: show_data.storeman,
            crossAddress: show_data.crossAddress,
            amount: show_data.balance,
            trans: trans,
            transType: transType,
            Chain: show_data.chain,
            symbol: show_data.symbol,
            fromText: show_data.fromText,
            toText: show_data.toText
        },
    },{
        class: 'send-transaction-info',
        closeable: false
    });
}


Template['elements_cross_transactions_table_btc'].onCreated(function(){
    let template = this;

    mist.BTC2WBTC().listHistory('BTC', (err, result) => {
        if (err) {
            console.log('err: ', err);

            Session.set('oldCrosschainList', []);
            TemplateVar.set(template, 'crosschainList', []);
        } else {
            resultEach(template, result);

            Session.set('oldCrosschainList', result);
            TemplateVar.set(template, 'crosschainList', result);
        }
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.BTC2WBTC().listHistory('BTC', (err, result) => {
            if (err) {
                console.log('err: ', err);

                Session.set('oldCrosschainList', []);
                TemplateVar.set(template, 'crosschainList', []);
            } else {
                resultEach(template, result);

                let oldCrosschainResult = Session.get('oldCrosschainList');
                let oldResultHex = web3.toHex(oldCrosschainResult);
                let resultHex = web3.toHex(result);

                if(!oldCrosschainResult || oldResultHex !== resultHex ) {
                    // console.log('update history transaction: ',oldResultHex !== resultHex);
                    Session.set('oldCrosschainList', result);
                    TemplateVar.set(template, 'crosschainList', result);
                }
            }
        });

    }, 10000);

});

Template['elements_cross_transactions_table_btc'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});


Template['elements_cross_transactions_table_btc'].helpers({
    historyList: function () {

        let crosschainList = [];

        if (TemplateVar.get('crosschainList') && TemplateVar.get('crosschainList').length > 0) {
            let smallStyle = 'display: block; color: #4b90f7;';

            _.each(TemplateVar.get('crosschainList'), function (value, index) {
                value.balance =  web3.toBigNumber(value.value).div(100000000).toString();

                if (value.chain === 'BTC') {
                    value.fromText = `<small style="${smallStyle}">BTC</small>`;
                    value.toText = `<small style="${smallStyle}">WAN</small>`;
                    value.symbol = 'BTC';
                } else if (value.chain === 'WAN') {
                    value.fromText = `<small style="${smallStyle}">WAN</small>`;
                    value.toText = `<small style="${smallStyle}">BTC</small>`;
                    value.symbol = 'WBTC';
                }

                let style = 'display: block; font-size: 18px; background-color: transparent;';

                // Release
                if (stateDict[value.status] === 5) {
                    style += 'color: #920b1c;';

                    value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Confirm</h2>`;
                    value.state = 'To be confirmed';
                }
                // suspending
                else if (stateDict[value.status] === 14) {
                    value.operation = `<h2 style="${style}">Cancel</h2>`;
                    value.state = 'To be cancelled in ' + value.htlcdate;
                }
                // Revoke
                else if (stateDict[value.status] === 9) {
                    style += 'color: #920b1c;';
                    value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                    value.state = 'To be cancelled';
                }
                // Release or Revoke finished
                else if (stateDict[value.status] === 8 || stateDict[value.status] === 12) {
                    if (stateDict[value.status] === 8) {
                        value.state = 'Success';
                    } else {
                        value.state = 'Cancelled';
                    }

                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // locking
                else if (stateDict[value.status] >= 1 && stateDict[value.status] <= 4) {
                    if (stateDict[value.status] === 1) {
                        value.state = 'Pending';
                    } else if (stateDict[value.status] >= 2){
                        value.state = 'Cross-Tx ' + (stateDict[value.status] - 1).toString() +  '/4';
                    }
                    value.operation = `<h2 style="${style}">Confirm</h2>`;
                }
                // Releasing
                else if (stateDict[value.status] >= 6 && stateDict[value.status] <= 7) {
                    value.state = 'Confirming ' + (stateDict[value.status] - 5).toString() +  '/3';
                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // Revoking
                else if (stateDict[value.status] >= 10 && stateDict[value.status] <= 11) {
                    value.state = 'Cancelling ' + (stateDict[value.status] - 9).toString() +  '/3';
                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // Failed
                else if (stateDict[value.status] === 13) {
                    value.state = 'Failed';
                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // normal
                else {
                    value.state = 'Success';
                    value.crossAddress = value.to;
                    value.htlcdate = '--';
                    value.fromText = `<small style="${smallStyle}">BTC</small>`;
                    value.toText = `<small style="${smallStyle}">BTC</small>`;
                    value.operation = `<h2 style="${style}"></h2>`;
                }

                crosschainList.push(value);
            });
        }

        return crosschainList;
    },

});

Template['elements_cross_transactions_table_btc'].events({

    'click .show-detail': function (e) {
        let id = e.target.id;

        Session.set('isShowModal', true);

        let show_data = TemplateVar.get('crosschainList')[id];
        console.log('show_data: ', show_data);

        if (show_data) {
            if (!show_data.HashX) {
                show_data.HashX = show_data.txhash;
            }

            if (show_data.chain === 'BTC') {
                show_data.symbol = 'BTC';
            } else if (show_data.chain === 'WAN') {
                show_data.symbol = 'WBTC';
            }

            EthElements.Modal.show({
                template: 'views_modals_crosstransactionInfo',
                data: {
                    HashX: show_data.HashX,
                    chain: show_data.chain,
                    crossAddress: show_data.crossAddress,
                    from: show_data.from,
                    lockTxHash: show_data.lockTxHash,
                    refundTxHash: show_data.refundTxHash,
                    revokeTxHash: show_data.revokeTxHash,
                    storeman: show_data.storeman,
                    time: show_data.time,
                    to: show_data.to,
                    value: show_data.balance,
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

        // suspending
        if (stateDict[show_data.status] === 14) {
            return GlobalNotification.warning({
                content: 'Transaction locked now, please retry cancellation later',
                duration: 2
            });
        }
        // release X
        else if (stateDict[show_data.status] === 5) {
            transType = 'releaseX';


            // release X btc => wbtc
            if (show_data.chain === 'BTC') {
                show_data.symbol = 'BTC';

                trans = {
                    lockTxHash: show_data.lockTxHash, amount: show_data.value.toString(10),
                    storemanGroup: show_data.storeman, cross: show_data.crossAddress,
                    X: show_data.x
                };

                showQuestion(show_data, trans, transType);

            }
            // release X wbtc => btc
            else if (show_data.chain === 'WAN') {
                show_data.symbol = 'WBTC';

                trans = {
                    HashX: show_data.HashX, crossAddress: show_data.crossAddress
                };

                showQuestion(show_data, trans, transType);

            }
        }

        // revoke
        else if (stateDict[show_data.status] === 9) {

            transType = 'revoke';

            // revoke btc => wbtc
            if (show_data.chain === 'BTC') {
                console.log('chain: ', show_data.chain);
                show_data.symbol = 'BTC';

                trans = {
                    from: show_data.from, amount: show_data.value.toString(10),
                    storemanGroup: show_data.storeman, cross: show_data.crossAddress,
                    HashX: show_data.HashX,
                };

                // release x in wan
                showQuestion(show_data, trans, transType);

            }
            // revoke wbtc => btc
            else if (show_data.chain === 'WAN') {
                console.log('wbtc chain: ', show_data.chain);

                trans = {
                    from: show_data.from, HashX: show_data.HashX,
                };

                showQuestion(show_data, trans, transType);
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



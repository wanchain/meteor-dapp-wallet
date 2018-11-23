/**
Template Controllers

@module Templates
*/

let InterID;

const stateDict = {
    'sentHashPending': 1, 'sentHashConfirming': 2, 'waitingCross': 3, 'waitingCrossConfirming': 4,
    'waitingX': 5,'sentXPending': 6, 'sentXConfirming': 7, 'redeemFinished': 8,
    'waitingRevoke': 9,'sentRevokePending': 10, 'sentRevokeConfirming': 11, 'revokeFinished': 12,
    'sentHashFailed': 13, 'suspending': 14
};

function resultEach(template, result) {
    _.each(result, function (value, index) {
        delete value.meta;

        let nowTime = new Date().Format('yyyy-MM-dd hh:mm:ss:S');
        let nowTimestamp =  Math.round(new Date(nowTime).getTime());

        //suspendTime
        let endSpendingTimestamp= value.suspendTime;
        // HTLCtime
        let endTimestamp= value.HTLCtime;

        if (stateDict[value.status] === 8 || stateDict[value.status] === 12 || stateDict[value.status] === 13) {
            value.htlcdate = `<span>${Helpers.timeStamp2String(endTimestamp)}</span>`;
        } else {
            if (stateDict[value.status] === 1 || stateDict[value.status] === 2 || stateDict[value.status] === 3 || stateDict[value.status] === 4) {
                value.htlcdate = `<span style="color: #1ec89a">--</span>`;
            } else {
                if (nowTimestamp <=endSpendingTimestamp) {
                    // confirm
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(endSpendingTimestamp - nowTimestamp)}</span>`;
                    
                } else if (nowTimestamp >endSpendingTimestamp && nowTimestamp <=endTimestamp) {
                    // lock
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(endTimestamp - nowTimestamp)}</span>`;
    
                } else {
                    // cancel
                    value.htlcdate = "<span style='color: red'>00 h, 00 min</span>";
    
                }
            }
        }

        value.time = Helpers.timeStamp2String(value.time);

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
                value.balance =  web3.toBigNumber(value.value).div(100000000).toString(10);

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

                switch(stateDict[value.status]) {

                    // locking
                    case 1:
                        value.state = 'Pending';
                        value.operation = `<h2 style="${style}">Confirm</h2>`;
                        break;
                    case 2:
                        value.state = 'Cross-Tx 1/4';
                        value.operation = `<h2 style="${style}">Confirm</h2>`;
                        break;
                    case 3:
                        value.state = 'Cross-Tx 2/4';
                        value.operation = `<h2 style="${style}">Confirm</h2>`;
                        break;
                    case 4:
                        value.state = 'Cross-Tx 3/4';
                        value.operation = `<h2 style="${style}">Confirm</h2>`;
                        break;

                    // Release
                    case 5:
                        style += 'color: #920b1c;';
                        value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Confirm</h2>`;
                        value.state = 'To be confirmed';
                        break;

                    // Releasing
                    case 6:
                        value.state = 'Confirming 1/3';
                        value.operation = `<h2 style="${style}"></h2>`;
                        break;
                    case 7:
                        value.state = 'Confirming 2/3';
                        value.operation = `<h2 style="${style}"></h2>`;
                        break;

                    // Release finished
                    case 8:
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Success';
                        break;

                    // Revoke
                    case 9:
                        style += 'color: #920b1c;';
                        value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                        value.state = 'To be cancelled';
                        break;

                    // Revoking
                    case 10:
                        value.state = 'Cancelling 1/3';
                        value.operation = `<h2 style="${style}"></h2>`;
                        break;
                    case 11:
                        value.state = 'Cancelling 2/3';
                        value.operation = `<h2 style="${style}"></h2>`;
                        break;

                    // Revoke finished
                    case 12:
                        value.operation = `<h2 style="${style}"></h2>`;
                        value.state = 'Cancelled';
                        break;

                    // Failed
                    case 13:
                        value.state = 'Failed';
                        value.operation = `<h2 style="${style}"></h2>`;
                        break;

                    // suspending
                    case 14:
                        value.operation = `<h2 style="${style}">Cancel</h2>`;
                        value.state = 'To be cancelled';
                        break;

                    // normal
                    default:
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
        // console.log('show_data: ', show_data);

        if (show_data) {
            if (!show_data.HashX) {
                show_data.HashX = show_data.txhash;
            }

            let HashX = show_data.HashX;
            let lockTxHash = show_data.lockTxHash ? show_data.lockTxHash : show_data.btcLockTxHash;
            let refundTxHash = show_data.refundTxHash ? show_data.refundTxHash : show_data.btcRefundTxHash;
            let revokeTxHash = show_data.revokeTxHash ? show_data.revokeTxHash : show_data.btcRevokeTxHash;
            let btcNoticeTxhash = show_data.btcNoticeTxhash;

            let from = show_data.from;
            let crossAddress = show_data.crossAddress;

            console.log("show_data: ", show_data);

            if (show_data.chain === 'BTC') {
                show_data.symbol = 'BTC';

                if (show_data.from != 'local btc account' && crossAddress && crossAddress.substr(0, 2) !== '0x') {
                    crossAddress = '0x' + crossAddress;
                }

            } else if (show_data.chain === 'WAN') {
                show_data.symbol = 'WBTC';

                if (from && from.substr(0, 2) !== '0x') {
                    from = '0x' + from;
                }

                if (HashX && HashX.substr(0, 2) !== '0x') {
                    HashX = '0x' + HashX;
                }

                if (lockTxHash && lockTxHash.substr(0, 2) !== '0x') {
                    lockTxHash = '0x' + lockTxHash;
                }
                
                if (refundTxHash && refundTxHash.substr(0, 2) !== '0x') {
                    refundTxHash = '0x' + refundTxHash;
                }
    
                
                if (revokeTxHash && revokeTxHash.substr(0, 2) !== '0x') {
                    revokeTxHash = '0x' + revokeTxHash;
                }
    
                
                if (btcNoticeTxhash && btcNoticeTxhash.substr(0, 2) !== '0x') {
                    btcNoticeTxhash = '0x' + btcNoticeTxhash;
                }
            }

            EthElements.Modal.show({
                template: 'views_modals_crosstransactionInfo',
                data: {
                    HashX: HashX,
                    chain: show_data.chain,
                    crossAddress: crossAddress,
                    from: from,
                    lockTxHash: lockTxHash,
                    redeemTxHash: refundTxHash,
                    revokeTxHash: revokeTxHash,
                    btcNoticeTxhash: btcNoticeTxhash,
                    storeman: show_data.storeman,
                    time: show_data.time,
                    to: show_data.to,
                    value: show_data.balance,
                    x: show_data.x,
                    symbol: show_data.symbol,
                    status: show_data.state,
                    fromText: show_data.fromText,
                    toText: show_data.toText,
                    btcFee: Session.get('btcFee')
                }
            }, {
                closeable: false
            });

        }

    },

    'click .crosschain-list': function (e) {
        let id = e.target.id;
        let show_data = TemplateVar.get('crosschainList')[id];

        let trans;
        let transType;

        switch(stateDict[show_data.status]) {

            // suspending
            case 14:
                GlobalNotification.warning({
                    content: 'Transaction locked now, please retry cancellation later',
                    duration: 2
                });
                break;

            // release X
            case 5:
                transType = 'releaseX';

                // release X btc => wbtc
                if (show_data.chain === 'BTC') {
                    show_data.symbol = 'BTC';
                    trans = {
                        lockTxHash: show_data.lockTxHash, amount: show_data.value.toString(10),
                        storemanGroup: show_data.storeman, cross: show_data.crossAddress,
                        X: show_data.x
                    };
                }
                // release X wbtc => btc
                else if (show_data.chain === 'WAN') {
                    show_data.symbol = 'WBTC';
                    trans = {
                        HashX: show_data.HashX, crossAddress: show_data.crossAddress, X: show_data.x
                    };
                }

                showQuestion(show_data, trans, transType);
                 break;

            // revoke
            case 9:
                transType = 'revoke';

                // revoke btc => wbtc
                if (show_data.chain === 'BTC') {
                    show_data.symbol = 'BTC';
                    trans = {
                        from: show_data.from, amount: show_data.value.toString(10),
                        storemanGroup: show_data.storeman, cross: show_data.crossAddress,
                        HashX: show_data.HashX, X: show_data.x
                    };
                }
                // revoke wbtc => btc
                else if (show_data.chain === 'WAN') {
                    show_data.symbol = 'WBTC';
                    trans = {
                        from: show_data.from, HashX: show_data.HashX, X: show_data.x
                    };
                }

                showQuestion(show_data, trans, transType);

                break;

            // other status
            default:
                GlobalNotification.warning({
                    content: 'Can not operate',
                    duration: 2
                });




        }

    },
});



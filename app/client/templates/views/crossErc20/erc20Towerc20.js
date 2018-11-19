/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_ethToweth
 @constructor
 */


// Set basic variables
Template['views_erc20Towerc20'].onCreated(function(){
    var template = this;

    let chainType = this.data.chainType;
    let symbol = this.data.symbol;
    let tokenOrigAddr = this.data.tokenOrigAddr;
    let decimals = this.data.decimals;

    TemplateVar.set(template, 'symbol', symbol);
    TemplateVar.set(template, 'chainType', chainType);
    TemplateVar.set(template, 'tokenOrigAddr',tokenOrigAddr);


    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'feeMultiplicator', 0);
    TemplateVar.set(template, 'boundQuota', 0);
    TemplateVar.set(template, 'options', false);
    TemplateVar.set(template, 'decimals', decimals);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    let wanaddress = [];
    let wanAddressList = Session.get('wanAddressList') ? Session.get('wanAddressList') : [];

    if (wanAddressList.length >0) {
        TemplateVar.set(template, 'to', wanAddressList[0]);
        _.each(wanAddressList, function (value, index) {
            wanaddress.push({address: value})
        });

        TemplateVar.set(template, 'wanAddressList', wanaddress);
    }

    // eth accounts token balance
    let addressList = Session.get('addressList');


    mist.ERC202WERC20(chainType).getMultiTokenBalance(addressList, tokenOrigAddr, (err, result) => {
        TemplateVar.set(template,'erc20Balance',result);

        if (!err) {
            let result_list = [];

            _.each(result, function (value, index) {
                const balance =  Helpers.tokenFromWei(value,decimals);
                // const name = 'Account_' + index.slice(2, 6);
                if (new BigNumber(balance).gt(0)) {
                    result_list.push({name: index, address: index, balance: balance})
                }
            });

            if (result_list.length >0) {
                TemplateVar.set(template,'ethList',result_list);
                TemplateVar.set(template,'from',result_list[0].address);
            }
        }
    });

    // eth => weth storeman
    mist.ERC202WERC20(chainType).getStoremanGroups(tokenOrigAddr,function (err,data) {
        EthElements.Modal.hide();

        if (!err) {
            if (data.length > 0) {
                // console.log('ERC202WERC20 storeman', data);
                TemplateVar.set(template, 'storeman', data[0].smgOrigAddr);
                TemplateVar.set(template, 'storemanGroup', data);
            }
        } else {
            Session.set('clickButton', 1);
        }
    });

    // eth chain  gas price
    mist.ERC202WERC20(chainType).getGasPrice(chainType,function (err,data) {
        if (!err) {
            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
            TemplateVar.set(template,'estimatedGas', data.LockGas);
            TemplateVar.set(template,'gasPrice', data.gasPrice);
            TemplateVar.set(template,'defaultGasPrice', data.gasPrice);

            // console.log('fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));
            let number = new BigNumber(data.LockGas * data.gasPrice);

            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));

        }
    });

});


Template['views_erc20Towerc20'].helpers({
    'ethAccounts': function(){
        return TemplateVar.get('ethList');
    },

    'wanAddressList': function(){
        return TemplateVar.get('wanAddressList');
    },
    'symbol': function () {
        return TemplateVar.get('symbol');
    },
    'Deposit': function () {

        let result = [];
        let decimals = TemplateVar.get('decimals');
        if (TemplateVar.get('storemanGroup')) {
            _.each(TemplateVar.get('storemanGroup'), function (value, index) {
                if (value.smgOrigAddr === TemplateVar.get('storeman')) {

                    let inboundQuota = Helpers.tokenFromWei(value.inboundQuota,decimals);
                    let quota = Helpers.tokenFromWei(value.quota,decimals);
                    let deposit = web3.fromWei(value.wanDeposit, 'ether');
                    let done = quota - inboundQuota;
                    let used = ((done/ quota) * 100).toString() + '%';

                    result.push({deposit: deposit, inboundQuota: inboundQuota, quota: quota, done: done, used: used});

                    TemplateVar.set('boundQuota',inboundQuota);
                }
            });
        }

        // console.log('result: ', result);
        return result;
    },

    'i18nText': function(key){
        if(typeof TAPi18n !== 'undefined'
            && TAPi18n.__('elements.selectGasPrice.'+ key) !== 'elements.selectGasPrice.'+ key) {
            return TAPi18n.__('elements.selectGasPrice.'+ key);
        } else if (typeof this[key] !== 'undefined') {
            return this[key];
        } else {
            return (key === 'high') ? '+' : '-';
        }
    },

});


Template['views_erc20Towerc20'].events({

    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(event){
        event.preventDefault();

        var amount = new BigNumber(0);

        var regPos = /^\d+(\.\d+)?$/; //非负浮点数
        var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数

        if (event.target.value && (regPos.test(event.target.value) || regNeg.test(event.target.value)) ) {
            amount = new BigNumber(event.target.value)
        }

        TemplateVar.set('amount', amount);
    },

    'change #toweth-from': function (event) {
        event.preventDefault();
        TemplateVar.set('from', event.target.value);
    },

    'change #toweth-storeman': function (event) {
        event.preventDefault();
        TemplateVar.set('storeman', event.target.value);
    },

    'change .toweth-to': function (event) {
        event.preventDefault();
        TemplateVar.set('to', event.target.value);
    },

    'click .options': function () {
        TemplateVar.set('options', !TemplateVar.get('options'));
    },

    'change input[name="fee"], input input[name="fee"]': function(e){
        let feeRate = Number(e.currentTarget.value);
        let newFeeRate = new BigNumber(feeRate).div(10).add(1);
        let newGasPrice = new BigNumber(TemplateVar.get('defaultGasPrice')).mul(newFeeRate);

        // return the fee
        let number = TemplateVar.get('estimatedGas') * newGasPrice;
        var fee = EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether');


        TemplateVar.set('gasPrice', newGasPrice);
        TemplateVar.set('feeMultiplicator', feeRate);
        TemplateVar.set('fee', fee);

    },

    /**
     Submit the form and send the transaction!
     @event submit form
     */
    'submit form': function(e, template){
        let from = TemplateVar.get('from'),
            storeman = TemplateVar.get('storeman'),
            to = TemplateVar.get('to'),
            fee = TemplateVar.get('fee'),
            amount = TemplateVar.get('amount');

        let gasPrice = TemplateVar.get('gasPrice').toString(),
            chooseGasPrice = TemplateVar.get('gasPrice').toString(),
            estimatedGas = TemplateVar.get('estimatedGas').toString();
        let boundQuota = TemplateVar.get('boundQuota');

        if (!from && !storeman && !fee && !amount) {
            EthElements.Modal.hide();
            Session.set('clickButton', 1);
        }

        if(!from) {
            return GlobalNotification.warning({
                content: 'No eligible FROM account',
                duration: 2
            });
        }

        // console.log('storeman', storeman);
        if(!storeman) {
            return GlobalNotification.warning({
                content: 'No eligible Storeman account',
                duration: 2
            });
        }

        // wan address
        // console.log('to', to);
        if(!to) {
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.noReceiver',
                duration: 2
            });
        }

        if(! amount) {
            return GlobalNotification.warning({
                content: 'Please enter a valid amount',
                duration: 2
            });
        }

        if(amount.eq(new BigNumber(0))) {
            return GlobalNotification.warning({
                content: 'Please enter a valid amount',
                duration: 2
            });
        }

        let erc20Balance = TemplateVar.get('erc20Balance')[from.toLowerCase()];;
        let symbol = TemplateVar.get('symbol');
        let chainType = TemplateVar.get('chainType');
        let tokenOrigAddr = TemplateVar.get('tokenOrigAddr');
        let decimals = TemplateVar.get('decimals');

        if(new BigNumber(Helpers.tokenToWei(amount,decimals), 10).gt(new BigNumber(erc20Balance, 10)))
            return GlobalNotification.warning({
                content: `Insufficient ${symbol} balance in your FROM account`,
                duration: 2
            });

        if (new BigNumber(amount, 10).gt(new BigNumber(boundQuota, 10))){
            return GlobalNotification.warning({
                content: `Insufficient balance in Locked Account balance`,
                duration: 2
            });
        }

        //ETH balance
        mist.ERC202WERC20(chainType).getBalance(from.toLowerCase(), function (err,ethBalance) {
            if (err) {
                Helpers.showError(err);
            } else {

                let ethValue = new BigNumber(ethBalance, 10);

                // console.log('totalValue: ', totalValue);
                // console.log('ethValue: ', ethValue);
                if(new BigNumber(EthTools.toWei(fee), 10).gt(ethValue))
                    return GlobalNotification.warning({
                        content: `Insufficient ${chainType} balance in your FROM Account`,
                        duration: 2
                    });


                let trans = {
                    from: from, amount: amount.toString(10), storeman: storeman,
                    to: to, gasLimit: estimatedGas, gasPrice: gasPrice
                };

                // console.log('trans: ', trans);

                mist.ERC202WERC20(chainType).getApproveTransData(tokenOrigAddr,chainType, trans, function (err,getApproveTransData) {
                    mist.ERC202WERC20(chainType).getLockTransData(tokenOrigAddr,chainType, trans, function (err,getLockTransData) {
                        // console.log('getLockTransData: ', getLockTransData);
                        if (!err) {
                            Session.set('isShowModal', true);

                            EthElements.Modal.question({
                                template: 'views_modals_unlock_erc20TransactionInfo',
                                data: {
                                    from: from,
                                    to: to,
                                    amount: amount,
                                    gasPrice: gasPrice,
                                    chooseGasPrice: chooseGasPrice,
                                    estimatedGas: estimatedGas,
                                    fee: fee,
                                    approveData: getApproveTransData.approveTransData,
                                    lockData: getLockTransData.lockTransData,
                                    tokenOrigAddr: tokenOrigAddr,
                                    trans: trans,
                                    chain: chainType,
                                    chainType:chainType,
                                    symbol: symbol
                                },
                            },{
                                class: 'send-transaction-info',
                                closeable: false,
                            });
                        } else {
                            Helpers.showError(err);
                        }
                    });
                });

            }
        });

    }
});

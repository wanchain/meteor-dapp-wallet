/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_wethToeth
 @constructor
 */

const defaultGasprice = 180000000000;

// Set basic variables
Template['views_werc20Toerc20'].onCreated(function(){
    var template = this;

    let chainType = this.data.chainType;
    let symbol = this.data.symbol;
    let tokenOrigAddr = this.data.tokenOrigAddr;
    let tokenWanAddr = this.data.tokenWanAddr;
    let decimals = this.data.decimals;

    TemplateVar.set(template, 'symbol', symbol);
    TemplateVar.set(template, 'wsymbol', `W${symbol}`);

    TemplateVar.set(template, 'chainType', chainType);
    TemplateVar.set(template, 'tokenOrigAddr', tokenOrigAddr);
    TemplateVar.set(template, 'tokenWanAddr', tokenWanAddr);
    TemplateVar.set(template, 'decimals', decimals);

    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'feeMultiplicator', 0);
    TemplateVar.set(template, 'boundQuota', 0);
    TemplateVar.set(template, 'options', false);
    TemplateVar.set(template, 'coverCharge', 0);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    let ethaddress = [];
    let addressList = Session.get('addressList') ? Session.get('addressList') : [];
    if (addressList.length >0) {
        TemplateVar.set(template, 'to', addressList[0]);
        _.each(addressList, function (value, index) {
            ethaddress.push({address: value})
        });

        TemplateVar.set(template, 'addressList', ethaddress);
    }

    // wan accounts token balance
    let wanAddressList = Session.get('wanAddressList');

    mist.WERC202ERC20(chainType).getMultiTokenBalance(wanAddressList,tokenWanAddr,(err, result) => {
        TemplateVar.set(template,'werc20Balance',result);

        if (!err) {
            let result_list = [];

            _.each(result, function (value, index) {
                const balance =  Helpers.tokenFromWei(value,decimals);

                if (new BigNumber(balance).gt(0)) {
                    // let accounts = EthAccounts.findOne({balance:{$ne:"0"}, address: index});
                    // result_list.push({name: accounts.name ? accounts.name : index, address: index, balance: balance})

                    result_list.push({name: index, address: index, balance: balance})
                }
            });

            if (result_list.length > 0) {
                TemplateVar.set(template,'wanList',result_list);
                TemplateVar.set(template,'from',result_list[0].address);
            }

        }
    });

    // weth => eth storeman
    mist.WERC202ERC20(chainType).getStoremanGroups(tokenOrigAddr,function (err,data) {
        EthElements.Modal.hide();

        if (!err) {
            // console.log('WERC202ERC20 storeman', data);
            if (data.length > 0) {
                TemplateVar.set(template,'storeman',data[0].smgWanAddr);
                TemplateVar.set(template,'txFeeRatio',data[0].txFeeRatio);

                TemplateVar.set(template,'storemanGroup',data);
            }
        } else {
            Session.set('clickButton', 1);
        }
    });

    // get wan chain gas price
    mist.WERC202ERC20(chainType).getGasPrice("WAN",function (err,data) {
        if (!err) {
            // console.log('WAN gasPrice', data);
            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
            TemplateVar.set(template,'estimatedGas', data.LockGas);
            TemplateVar.set(template,'defaultGasPrice', data.gasPrice);
            TemplateVar.set(template,'gasPrice', data.gasPrice);

            // console.log('fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));
            let number = new BigNumber(data.LockGas).mul(new BigNumber(data.gasPrice));
            // console.log('formatBalance', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));

            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));
        }
    });

    // get wan2coin ratio
    mist.ERC202WERC20(chainType).getCoin2WanRatio(tokenOrigAddr,'ETH', function (err,data) {
        if (!err) {
            data ? TemplateVar.set(template,'wan2CoinRatio',data) : TemplateVar.set(template,'wan2CoinRatio',20);
        }
    });

});


Template['views_werc20Toerc20'].helpers({
    'ethAccounts': function(){
        return TemplateVar.get('wanList');
    },

    'addressList': function(){
        return TemplateVar.get('addressList');
    },
    'symbol': function () {
        return TemplateVar.get('symbol');
    },
    'wsymbol': function () {
        return TemplateVar.get('wsymbol');
    },
    'Deposit': function () {

        let result = [];
        let decimals = TemplateVar.get('decimals');
        _.each(TemplateVar.get('storemanGroup'), function (value, index) {
            if (value.smgWanAddr === TemplateVar.get('storeman')) {

                let outboundQuota = Helpers.tokenFromWei(value.outboundQuota,decimals);
                let quota = Helpers.tokenFromWei(value.quota,decimals);
                let deposit = web3.fromWei(value.wanDeposit, 'ether');
                let used = ((outboundQuota/ quota) * 100).toString() + '%';

                result.push({deposit: deposit, outboundQuota: outboundQuota, used: used});

                TemplateVar.set('boundQuota',outboundQuota);
            }
        });

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


Template['views_werc20Toerc20'].events({

    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(event){
        event.preventDefault();

        let amount = new BigNumber(0);

        let regPos = /^\d+(\.\d+)?$/; //非负浮点数
        let regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数

        if (event.target.value && (regPos.test(event.target.value) || regNeg.test(event.target.value)) ) {
            amount = new BigNumber(event.target.value)
        }

        let txFeeratio = TemplateVar.get('txFeeRatio');
        let wan2CoinRatio  = TemplateVar.get('wan2CoinRatio');

        let decimals = TemplateVar.get('decimals');

        let wei = new BigNumber(Helpers.tokenToWei(amount,decimals));
        const DEFAULT_PRECISE = 10000;
        let coverCharge = wei.mul(wan2CoinRatio).mul(txFeeratio).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE);
        // console.log('coverCharge: ', coverCharge);

        TemplateVar.set('coverCharge', Helpers.tokenFromWei(coverCharge));
        TemplateVar.set('amount', amount);
    },

    'change #toweth-from': function (event) {
        event.preventDefault();
        TemplateVar.set('from', event.target.value);
    },

    'change #toweth-storeman': function (event) {
        event.preventDefault();
        let value = event.target.value;
        let storeman = value.split('&&')[0];
        let txFeeRatio = value.split('&&')[1];

        TemplateVar.set('storeman', storeman);
        TemplateVar.set('txFeeRatio', txFeeRatio);
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
        let number = new BigNumber(TemplateVar.get('estimatedGas')).mul(new BigNumber(newGasPrice));
        let fee = EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether');

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
            amount = TemplateVar.get('amount'),
            valueFee = TemplateVar.get('coverCharge');

        let gasPrice = TemplateVar.get('gasPrice').toString(),
            chooseGasPrice = TemplateVar.get('gasPrice').toString(),
            estimatedGas = TemplateVar.get('estimatedGas').toString();
        let txFeeRatio = TemplateVar.get('txFeeRatio');
        let boundQuota = TemplateVar.get('boundQuota');

        if (parseInt(gasPrice) < defaultGasprice) {
            gasPrice = defaultGasprice.toString();
        }

        if (!from && !storeman && !fee && !valueFee) {
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


        // console.log('amount', amount);
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

        let werc20Balance = TemplateVar.get('werc20Balance')[from.toLowerCase()];
        let wsymbol = TemplateVar.get('wsymbol');
        let chainType = TemplateVar.get('chainType');
        let tokenOrigAddr = TemplateVar.get('tokenOrigAddr');
        let decimals = TemplateVar.get('decimals');

        if(new BigNumber(Helpers.tokenToWei(amount,decimals), 10).gt(new BigNumber(werc20Balance, 10)))
            return GlobalNotification.warning({
                content: `Insufficient ${wsymbol} balance in your FROM account`,
                duration: 2
            });

        if (new BigNumber(amount, 10).gt(new BigNumber(boundQuota, 10))){
            return GlobalNotification.warning({
                content: `Insufficient balance in Locked Account balance`,
                duration: 2
            });
        }

        mist.WERC202ERC20(chainType).getBalance(from.toLowerCase(), function (err,wanBalance) {
            if (!err) {

                // console.log('fee: ', new BigNumber(EthTools.toWei(fee), 10));
                // console.log('valueFee: ', new BigNumber(EthTools.toWei(valueFee), 10));
                // console.log('valueFee: ', new BigNumber(EthTools.toWei(fee), 10).add(new BigNumber(EthTools.toWei(valueFee), 10)));
                if((new BigNumber(EthTools.toWei(fee), 10).add(new BigNumber(EthTools.toWei(valueFee), 10))).gt(new BigNumber(wanBalance, 10)))
                    return GlobalNotification.warning({
                        content: 'Insufficient WAN balance in your FROM account',
                        duration: 2
                    });


                let trans = {
                    from: from, amount: amount.toString(10), storeman: storeman,
                  to: to, gasLimit: estimatedGas, gasPrice: gasPrice, value: valueFee,txFeeRatio:txFeeRatio
                };

                // console.log('trans: ', trans);

                mist.WERC202ERC20(chainType).getApproveTransData(tokenOrigAddr,chainType, trans, function (err,getApproveTransData) {
                    mist.WERC202ERC20(chainType).getLockTransData(tokenOrigAddr,chainType, trans, function (err,getLockTransData) {
                        trans.x = getLockTransData.x;
                        trans.hashX = getLockTransData.hashX;
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
                                    valueFee: valueFee,
                                    approveData: getApproveTransData.approveTransData,
                                    lockData: getLockTransData.lockTransData,
                                    tokenOrigAddr: tokenOrigAddr,
                                    trans: trans,
                                    chain: 'WAN',
                                    chainType:chainType,
                                    symbol: wsymbol
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

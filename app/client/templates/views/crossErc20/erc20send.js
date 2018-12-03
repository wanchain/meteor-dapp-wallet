/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_ethsend
 @constructor
 */


// Set basic variables
Template['views_erc20send'].onCreated(function(){
    var template = this;

    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'feeMultiplicator', 0);
    TemplateVar.set(template, 'options', false);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    let chainType = this.data.chainType;
    let symbol = this.data.symbol;
    let tokenOrigAddr = this.data.tokenOrigAddr;
    let decimals = this.data.decimals;

    TemplateVar.set(template, 'symbol', symbol);
    TemplateVar.set(template, 'chainType', chainType);
    TemplateVar.set(template, 'tokenOrigAddr', tokenOrigAddr);
    TemplateVar.set(template, 'decimals', decimals);

    mist.ERC202WERC20(chainType).getMultiTokenBalance(Session.get('addressList'),tokenOrigAddr, function (err, result) {
        EthElements.Modal.hide();

        if (!err) {
            let result_list = [];

            TemplateVar.set(template,'erc20Balance',result);

            _.each(result, function (value, index) {
                let balance =  Helpers.tokenFromWei(value, decimals);
                // const name = 'Account_' + index.slice(2, 6);
                if (new BigNumber(balance).gt(0)) {
                    result_list.push({name: index, address: index, balance: balance})
                }
            });

            if (result_list.length >0) {
                TemplateVar.set(template,'ethList',result_list);
                TemplateVar.set(template,'from',result_list[0].address);
            }
        } else {
            Session.set('clickButton', 1);
        }
    });

    mist.ERC202WERC20(chainType).getGasPrice(chainType, function (err,data) {
        if (!err) {
            TemplateVar.set(template,'estimatedGas', data.ethNormalGas);
            TemplateVar.set(template,'gasPrice', data.gasPrice);
            TemplateVar.set(template,'defaultGasPrice', data.gasPrice);

            let number = new BigNumber(data.ethNormalGas).mul(new BigNumber(data.gasPrice));

            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));
        }
    });

});


Template['views_erc20send'].helpers({

    'selectAccount': function () {
        return TemplateVar.get('ethList');
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
    'symbol':function () {
        return TemplateVar.get('symbol').toLowerCase();
    },
    'chainType':function () {
        return TemplateVar.get('chainType').toLowerCase();
    }
});


Template['views_erc20send'].events({

    /**
     Set the amount while typing
     @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
     */
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

    'change #ethNor-from': function (event) {
        event.preventDefault();
        TemplateVar.set('from', event.target.value);
    },

    'change .to': function (event) {
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
    'submit form': function(e, template) {

        let from = TemplateVar.get('from'),
            to = TemplateVar.get('to'),
            fee = TemplateVar.get('fee'),
            amount = TemplateVar.get('amount'),
            gasPrice = TemplateVar.get('gasPrice').toString(),
            chooseGasPrice = TemplateVar.get('gasPrice').toString(),
            estimatedGas = TemplateVar.get('estimatedGas').toString();

        if (!from && !amount) {
            EthElements.Modal.hide();
            Session.set('clickButton', 1);
        }

        if (!to) {
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.noReceiver',
                duration: 2
            });
        }

        if (from === to) {
            return GlobalNotification.warning({
                content: 'Transaction to same address not allowed',
                duration: 2
            });
        }

        if (!web3.isAddress(to))
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.noReceiver',
                duration: 2
            });

        if (!amount) {
            return GlobalNotification.warning({
                content: 'Please enter a valid amount',
                duration: 2
            });
        }

        if (amount.eq(new BigNumber(0))) {
            return GlobalNotification.warning({
                content: 'Please enter a valid amount',
                duration: 2
            });
        }

        let chainType = TemplateVar.get('chainType');
        let symbol = TemplateVar.get('symbol').toLowerCase();
        let tokenOrigAddr = TemplateVar.get('tokenOrigAddr');
        let erc20Balance = TemplateVar.get('erc20Balance')[from.toLowerCase()];
        let decimals = TemplateVar.get('decimals');

        if(new BigNumber(Helpers.tokenToWei(amount,decimals), 10).gt(new BigNumber(erc20Balance, 10)))
            return GlobalNotification.warning({
                content: `Insufficient ${symbol} balance in your FROM account`,
                duration: 2
            });
        mist.ERC202WERC20(chainType).getBalance(from.toLowerCase(), function (err,ethBalance) {

            if(new BigNumber(EthTools.toWei(fee), 10).gt(new BigNumber(ethBalance, 10)))
                return GlobalNotification.warning({
                    content: `Insufficient ${chainType} balance in your FROM account`,
                    duration: 2
                });

            let trans = {
                from: from, amount: amount.toString(10),
                to: to, gas: estimatedGas, gasPrice: gasPrice
            };

            // console.log('trans: ', trans);
            Session.set('isShowModal', true);
            EthElements.Modal.question({
                template: 'views_modals_sendErc20TransactionInfo',
                data: {
                    from: from,
                    to: to,
                    amount: amount.toString(10),
                    gasPrice: gasPrice,
                    chooseGasPrice: chooseGasPrice,
                    gas: estimatedGas,
                    fee: fee,
                    trans: trans,
                    chainType:chainType,
                    symbol:symbol,
                    tokenOrigAddr:tokenOrigAddr
                },
            },{
                class: 'send-transaction-info',
                closeable: false,
            });


        });

    }
});

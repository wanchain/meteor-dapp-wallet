Template['views_modals_sendEthTransactionInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
});

Template['views_modals_sendEthTransactionInfo'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
        let password_input = document.getElementById('ethTransaction-psd').value;

        if(!password_input) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'Empty password, please enter one',
                duration: 2
            });
        }

        // console.log('Gas Price: '+ gasPrice);

        let txArgs = {
            from: this.from,
            to: this.to,
            amount: this.amount,
            gasPrice: this.gasPrice,
            gasLimit: this.gas
        };

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        mist.ETH2WETH().sendNormalTransaction(txArgs, password_input, 'ETH', function (err,data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                Session.set('clickButton', 1);
            }
        });

    }
});

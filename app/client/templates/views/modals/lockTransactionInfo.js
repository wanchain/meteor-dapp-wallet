Template['views_modals_unlockTransactionInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
    TemplateVar.set(template, 'passwdType', 'enter the from account\'s password');
});


Template['views_modals_unlockTransactionInfo'].events({
    'click .cancel-cross': function () {
        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        // console.log('data trans: ', this.trans);
        let password_input = document.getElementById('crosschain-psd').value;

        // console.log('password: ', password_input);

        if(!password_input) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'the password empty',
                duration: 2
            });
        }

        TemplateVar.set('isButton', true);

        if (this.chain === 'ETH') {
            console.log('ETH chain: ', this.chain);

            mist.ETH2WETH().sendLockTrans(this.trans, password_input, this.secretX, function (err,data) {
                if (err) {
                    Helpers.showError(err);
                    EthElements.Modal.hide();
                } else {
                    EthElements.Modal.hide();
                    Session.set('clickButton', 1);
                }
            });
        } else {
            console.log('WAN chain: ', this.chain);

            mist.WETH2ETH().sendLockTrans(this.trans, password_input, this.secretX, function (err,data) {
                if (err) {
                    Helpers.showError(err);
                    EthElements.Modal.hide();
                } else {
                    EthElements.Modal.hide();
                    Session.set('clickButton', 1);
                }
            });
        }

    }
});

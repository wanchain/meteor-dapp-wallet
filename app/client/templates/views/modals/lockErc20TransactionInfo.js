Template['views_modals_unlock_erc20TransactionInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
    TemplateVar.set(template, 'passwdType', 'Enter FROM account\'s password');
});


Template['views_modals_unlock_erc20TransactionInfo'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        // console.log('data trans: ', this.trans);
        let password_input = document.getElementById('crosschain-psd').value;

        // console.log('password: ', password_input);

        if(!password_input) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'Empty password, please enter one',
                duration: 2
            });
        }

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        if (this.chain !== 'WAN') {
            console.log('ETH chain: ', this.chain);

            mist.ERC202WERC20(this.chainType).sendLockTrans(this.tokenOrigAddr,this.chainType,this.trans, password_input, function (err,data) {
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

            mist.WERC202ERC20(this.chainType).sendLockTrans(this.tokenOrigAddr,this.chainType,this.trans, password_input, function (err,data) {
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
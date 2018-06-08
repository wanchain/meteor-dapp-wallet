function waitingMoment(number) {
    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
    setTimeout(() => {
        EthElements.Modal.hide();
    }, number);
}

Template['views_modals_sendcrosschainReleaseX'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);

    if (this.data.transType === 'releaseX') {
        TemplateVar.set(template, 'transType', 'Realease X Transaction');
        TemplateVar.set(template, 'passwdType', 'enter the crossAdress account\'s password');
    } else {
        TemplateVar.set(template, 'transType', 'Revoke Transaction');
        TemplateVar.set(template, 'passwdType', 'enter the from account\'s password');
    }

});


Template['views_modals_sendcrosschainReleaseX'].events({
    'click .cancel-cross': function () {
        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        // console.log('data trans: ', this.trans);
        let password_input = document.getElementById('releaseX-psd').value;

        if(!password_input) {
            EthElements.Modal.hide();

            return GlobalNotification.warning({
                content: 'the password empty',
                duration: 2
            });
        }

        // releaseX
        if (this.transType === 'releaseX') {
            TemplateVar.set('isButton', true);

            if (this.Chain === 'ETH') {
                // release x in eth
                console.log('release X Chain 1: ', this.Chain);

                console.log('trans: ', this.trans);

                mist.ETH2WETH().sendRefundTrans(this.trans, password_input, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        EthElements.Modal.hide();
                        waitingMoment(10000);
                    }
                });
            } else {
                // release x in wan
                console.log('release X Chain 2: ', this.Chain);

                mist.WETH2ETH().sendRefundTrans(this.trans, password_input, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        EthElements.Modal.hide();
                        waitingMoment(10000);
                    }
                });
            }
        }
        // revoke
        else {
            TemplateVar.set('isButton', true);

            if (this.Chain === 'ETH') {
                // revoke in eth
                console.log('revoke Chain 1: ', this.Chain);

                mist.ETH2WETH().sendRevokeTrans(this.trans, password_input, this.trans.x, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        EthElements.Modal.hide();
                        waitingMoment(10000);
                    }
                });
            } else {
                // revoke in wan
                console.log('revoke Chain 2: ', this.Chain);

                mist.WETH2ETH().sendRevokeTrans(this.trans, password_input, this.trans.x, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        EthElements.Modal.hide();
                        waitingMoment(10000);
                    }
                });
            }
        }

    }
});

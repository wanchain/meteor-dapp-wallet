let InterID;

function waitingMoment(X) {
    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    if (X) {
        InterID = Meteor.setInterval(function(){
            _.each(Session.get('oldCrosschainList'), function (value, index) {
                if (value.x === X) {
                    if(value.status === 'sentXPending' || value.status === 'sentRevokePending') {
                        console.log('btc oldCrosschainList done:::', value.status);
                        Meteor.clearInterval(InterID);

                        Session.set('clickButton', 1);
                        EthElements.Modal.hide();
                    } else {
                        console.log('btc oldCrosschainList interval:::', value.status);
                    }
                }
            });

        }, 5000);
    } else {
        setTimeout(() => {
            Session.set('clickButton', 1);
            EthElements.Modal.hide();
        }, 5000);
    }
}

Template['views_modals_sendcrossBtcReleaseX'].onCreated(function(){
    let template = this;
    TemplateVar.set(template, 'isButton', false);

    if (this.data.transType === 'releaseX') {
        TemplateVar.set(template, 'transType', 'Confirm Transaction');
        TemplateVar.set(template, 'passwdType', "Enter TO account's password");
    } else {
        TemplateVar.set(template, 'transType', 'Cancel Transaction');
        TemplateVar.set(template, 'passwdType', "Enter FROM account's password");
    }

});


Template['views_modals_sendcrossBtcReleaseX'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        let password_input = document.getElementById('releaseX-psd').value;

        if(!password_input) {
            EthElements.Modal.hide();

            return GlobalNotification.warning({
                content: 'Empty password, please enter one',
                duration: 2
            });
        }

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        let secret = this.trans.X;

        // releaseX
        if (this.transType === 'releaseX') {

            if (this.Chain === 'BTC') {

                // release x in btc
                console.log('release X Chain 1: ', this.Chain);

                let params = {};

                params.crossAddress = this.trans.cross;
                params.wanPassword = password_input;
                params.x = secret;

                mist.BTC2WBTC().redeemBtc('BTC', params, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        waitingMoment(secret);
                    }
                });

            } else {
                // release x in wan
                console.log('release X Chain 2: ', this.Chain);

                let params = this.trans;
                params.btcPassword = password_input;

                mist.BTC2WBTC().redeemWbtc('BTC', params, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        waitingMoment(secret);
                    }
                });
            }
        }
        // revoke
        else {

            if (this.Chain === 'BTC') {
                // revoke in btc
                console.log('revoke Chain 1: ', this.Chain);

                let params = {};
                params.from = this.trans.from;
                params.HashX = this.trans.HashX;
                params.btcPassword = password_input;

                mist.BTC2WBTC().revokeBtc('BTC', params, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        waitingMoment(secret);
                    }
                });
            } else {
                // revoke in wan
                console.log('revoke Chain 2: ', this.Chain);

                let params = this.trans;
                params.wanPassword = password_input;

                mist.BTC2WBTC().revokeWbtc('BTC', params, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        waitingMoment(secret);
                    }
                });

            }
        }

    }
});

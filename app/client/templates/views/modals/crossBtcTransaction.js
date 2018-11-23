let InterID;

function waitingMoment(X) {
    if (X) {
        EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

        _.each(Session.get('oldCrosschainList'), function (value, index) {
            if (value.x === X) {
                if(value.status === 'sentXPending' || value.status === 'sentRevokePending') {
                    console.log('btc oldCrosschainList done:::', value.status);
                    EthElements.Modal.hide();
                    Session.set('clickButton', 1);
                } else {
                    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
                    console.log('eth oldCrosschainList interval:::', value.status);
                }
            }
        });

        InterID = Meteor.setInterval(function(){
            _.each(Session.get('oldCrosschainList'), function (value, index) {
                if (value.x === X) {
                    if(value.status === 'sentXPending' || value.status === 'sentRevokePending') {
                        console.log('btc oldCrosschainList done:::', value.status);

                        Meteor.clearInterval(InterID);
                        EthElements.Modal.hide();
                        Session.set('clickButton', 1);
                    } else {
                        EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
                        console.log('btc oldCrosschainList interval:::', value.status);
                    }
                }
            });

        }, 5000);
    } else {
        setTimeout(() => {
            Session.set('clickButton', 1);
            EthElements.Modal.hide();
        }, 10000);
    }
}

Template['views_modals_sendcrossBtcReleaseX'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});

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
        let params;
        let transferType = this.Chain + this.transType;
        // BTCreleaseX, BTCrevoke, WANreleaseX, WANrevoke;

        EthElements.Modal.hide();
        EthElements.Modal.show('views_modals_loading', {closeable: true, class: 'crosschain-loading'});

        Meteor.setTimeout(() => {

            switch(transferType) {

                // BTCreleaseX
                case 'BTCreleaseX':
                    console.log('crossBtcTransaction Type: ', 'BTCreleaseX');

                    params = {};
                    params.crossAddress = this.trans.cross;
                    params.wanPassword = password_input;
                    params.x = secret;

                    EthElements.Modal.show('views_modals_loading', {closeable: true, class: 'crosschain-loading'});
                    mist.BTC2WBTC().redeemBtc('BTC', params, function (err,data) {
                        if (err) {
                            Helpers.showError(err);
                            EthElements.Modal.hide();
                        } else {
                            waitingMoment(secret);
                        }
                    });

                    break;

                // BTCrevoke
                case 'BTCrevoke':
                    console.log('crossBtcTransaction Type: ', 'BTCrevoke');

                    params = {};
                    params.from = this.trans.from;
                    params.HashX = this.trans.HashX;
                    params.btcPassword = password_input;

                    EthElements.Modal.show('views_modals_loading', {closeable: true, class: 'crosschain-loading'});
                    mist.BTC2WBTC().revokeBtc('BTC', params, function (err,data) {
                        if (err) {
                            Helpers.showError(err);
                            EthElements.Modal.hide();
                        } else {
                            waitingMoment(secret);
                        }
                    });

                    break;

                // WANreleaseX
                case 'WANreleaseX':
                    console.log('crossBtcTransaction Type: ', 'WANreleaseX');

                    params = this.trans;
                    params.btcPassword = password_input;

                    EthElements.Modal.show('views_modals_loading', {closeable: true, class: 'crosschain-loading'});
                    mist.BTC2WBTC().redeemWbtc('BTC', params, function (err,data) {
                        if (err) {
                            Helpers.showError(err);
                            EthElements.Modal.hide();
                        } else {
                            waitingMoment(secret);
                        }
                    });

                    break;

                // WANrevoke
                case 'WANrevoke':
                    console.log('crossBtcTransaction Type: ', 'WANrevoke');

                    params = this.trans;
                    params.wanPassword = password_input;

                    EthElements.Modal.show('views_modals_loading', {closeable: true, class: 'crosschain-loading'});
                    mist.BTC2WBTC().revokeWbtc('BTC', params, function (err,data) {
                        if (err) {
                            Helpers.showError(err);
                            EthElements.Modal.hide();
                        } else {
                            waitingMoment(secret);
                        }
                    });

                    break;

                default:
                    Helpers.showError('unknown error.');
                    EthElements.Modal.hide();

            }

        }, 500);

    }
});

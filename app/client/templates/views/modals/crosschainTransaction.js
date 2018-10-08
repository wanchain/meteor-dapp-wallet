let InterID;

function waitingMoment(X) {
    if (X) {
        EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

        _.each(Session.get('oldCrosschainList'), function (value, index) {
            if (value.x === X) {
                if(value.status === 'sentXPending' || value.status === 'sentRevokePending') {
                    console.log('eth oldCrosschainList done:::', value.status);
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
                        console.log('eth oldCrosschainList done:::', value.status);

                        Meteor.clearInterval(InterID);
                        EthElements.Modal.hide();
                        Session.set('clickButton', 1);
                    } else {
                        EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
                        console.log('eth oldCrosschainList interval:::', value.status);
                    }
                }
            });

        }, 5000);
    }
}

Template['views_modals_sendcrosschainReleaseX'].onCreated(function(){
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


Template['views_modals_sendcrosschainReleaseX'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        // console.log('data trans: ', this.trans);
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

        EthElements.Modal.hide();
        EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

        let secret = this.trans.X;

        // releaseX
        if (this.transType === 'releaseX') {

            if (this.Chain === 'ETH') {
                // release x in eth
                console.log('release X Chain 1: ', this.Chain);

                mist.ETH2WETH().sendRefundTrans(this.trans, password_input, function (err,data) {
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

                mist.WETH2ETH().sendRefundTrans(this.trans, password_input, function (err,data) {
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

            if (this.Chain === 'ETH') {
                // revoke in eth
                console.log('revoke Chain 1: ', this.Chain);

                mist.ETH2WETH().sendRevokeTrans(this.trans, password_input, this.trans.x, function (err,data) {
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

                mist.WETH2ETH().sendRevokeTrans(this.trans, password_input, this.trans.x, function (err,data) {
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

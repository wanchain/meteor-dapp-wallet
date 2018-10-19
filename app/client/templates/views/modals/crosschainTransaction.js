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


function releaseEth(self,password_input) {

    if (self.Chain !== 'WAN') {
        // release x in eth
        console.log('release X Chain 1: ', self.Chain);

        // console.log('trans: ', self.trans);

        mist.ETH2WETH().sendRefundTrans(self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    } else {
        // release x in wan
        console.log('release X Chain 2: ', self.Chain);

        mist.WETH2ETH().sendRefundTrans(self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    }
}

function revokeEth(self,password_input) {
    if (self.Chain !== 'WAN') {
        // revoke in eth
        console.log('revoke Chain 1: ', self.Chain);

        mist.ETH2WETH().sendRevokeTrans(self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    } else {
        // revoke in wan
        console.log('revoke Chain 2: ', self.Chain);

        mist.WETH2ETH().sendRevokeTrans(self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    }
}


function releaseErc20(self,password_input) {

    if (self.Chain !== 'WAN') {
        // release x in eth
        console.log('release X Chain 1: ', self.Chain);

        // console.log('trans: ', self.trans);

        mist.ERC202WERC20(self.tokenType).sendRefundTrans(self.tokenAddr,self.tokenType,self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    } else {
        // release x in wan
        console.log('release X Chain 2: ', self.Chain);

        mist.WERC202ERC20(self.tokenType).sendRefundTrans(self.tokenAddr,self.tokenType,self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    }
}


function revokeErc20(self,password_input) {
    if (self.Chain !== 'WAN') {
        // revoke in eth
        console.log('revoke Chain 1: ', self.Chain);

        mist.ERC202WERC20(self.tokenType).sendRevokeTrans(self.tokenAddr,self.tokenType,self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    } else {
        // revoke in wan
        console.log('revoke Chain 2: ', self.Chain);

        mist.WERC202ERC20(self.tokenType).sendRevokeTrans(self.tokenAddr,self.tokenType,self.trans, password_input, function (err, data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                waitingMoment();
            }
        });
    }
}


Template['views_modals_sendcrosschainReleaseX'].onCreated(function () {
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
        EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
        // console.log('data trans: ', this.trans);
        let password_input = document.getElementById('releaseX-psd').value;

        if (!password_input) {
            EthElements.Modal.hide();

            return GlobalNotification.warning({
                content: 'Empty password, please enter one',
                duration: 2
            });
        }

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        if (this.tokenStand === 'ETH') {

            // releaseX
            if (this.transType === 'releaseX') {
                releaseEth(this,password_input);
            }
            // revoke
            else {
                revokeEth(this,password_input);
            }

        }
        else if (this.tokenStand === 'E20') {
            // releaseX
            if (this.transType === 'releaseX') {
                releaseErc20(this,password_input);
            }
            // revoke
            else {
                revokeErc20(this,password_input);
            }
        }
        else {
            Helpers.showError("crossChain  error. this.crossChain is '", this.tokenStand, "'");
            EthElements.Modal.hide();
        }

    }
})
;

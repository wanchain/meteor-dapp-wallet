

Template['views_modals_storepassword'].onDestroyed(function () {
    Session.set('isShowModal', false);
    Session.set('popStorePwd', false);
});

Template['views_modals_storepassword'].onCreated(function () {
    let self = this;
    console.log(self.data.needPwd)
    TemplateVar.set(self, 'needRedeem', self.data.needPwd['redeem']);
    TemplateVar.set(self, 'needRevoke', self.data.needPwd['revoke']);
    TemplateVar.set(self, 'redeemText', 'Transactions pending confirmation');
    TemplateVar.set(self, 'revokeText', 'Transactions pending cancellation');
});

Template['views_modals_storepassword'].helpers({
    listRedeem: function() {
        let pwdCollection = [];
        _.each(TemplateVar.get('needRedeem'), function(value, index) {
            pwdCollection.push({
                index: `Tx${index+1}`,
                time: value.sendTime?Helpers.timeStamp2String(Number(value.sendTime) * 1000) : "--",
                amount: Helpers.tokenFromWei(value.contractValue, value.decimals),
                from: value.srcChainAddr !== 'WAN' ? `${value.from} (${value.srcChainType})` : `${value.from} (WAN)`,
                to: value.srcChainAddr !== 'WAN' ? `${value.to} (WAN)` : `${value.to} (${value.srcChainType})`,
                symbol: value.tokenSymbol,
                id: `redeem${index}`,
                inputText: value.srcChainAddr !== 'WAN' ? 'Enter TO account\'s password' : 'Enter FROM account\'s password'
            })
        })
        return pwdCollection;
    },

    listRevoke: function() {
        let pwdCollection = [];
        _.each(TemplateVar.get('needRevoke'), function(value, index) {
            pwdCollection.push({
                index: `Tx${index+1}`,
                time: value.sendTime?Helpers.timeStamp2String(Number(value.sendTime) * 1000) : "--",
                amount: Helpers.tokenFromWei(value.contractValue, value.decimals),
                from: value.srcChainAddr !== 'WAN' ? `${value.from} (${value.srcChainType})` : `${value.from} (WAN)`,
                to: value.srcChainAddr !== 'WAN' ? `${value.to} (WAN)` : `${value.to} (${value.srcChainType})`,
                symbol: value.tokenSymbol,
                id: `revoke${index}`,
                inputText: value.srcChainAddr !== 'WAN' ? 'Enter FROM account\'s password' : 'Enter TO account\'s password'
            })
        })
        return pwdCollection;
    }
});



Template['views_modals_storepassword'].events({
    'click .cancel-cross': function () {
        Session.set('popStorePwd', false);
        Session.set('isShowModal', false);
        EthElements.Modal.hide();
    },
    'click .closeBtn': function () {

    },
    'click .ok-cross': function () {
        // EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
        let right = 0;
        let length = TemplateVar.get('needRedeem').length + TemplateVar.get('needRevoke').length;
        _.each(TemplateVar.get('needRedeem'), function (value, index) {
            let password_input = document.querySelector(`#redeem${index}>input`).value;
            if (!password_input) {
                return GlobalNotification.warning({
                    content: `Confirmation Tx${index+1}: Empty password, please enter one`,
                    duration: 2
                });
            } else {
                ++right;
                value.pwd = password_input
            }
        })
        _.each(TemplateVar.get('needRevoke'), function (value, index) {
            let password_input = document.querySelector(`#revoke${index}>input`).value;
            if (!password_input) {
                return GlobalNotification.warning({
                    content: `Cancellation Tx${index+1}: Empty password, please enter one`,
                    duration: 2
                });
            } else {
                ++right;
                value.pwd = password_input
            }
        })

        if(right === length) {
            TemplateVar.get('needRedeem').forEach(value => {
                value.srcChainAddr !== 'WAN' ? Session.set(`${value.to}`, value.pwd) : Session.set(`${value.from}`, value.pwd);
            });
            TemplateVar.get('needRevoke').forEach(value => {
                value.srcChainAddr !== 'WAN' ? Session.set(`${value.from}`, value.pwd) : Session.set(`${value.to}`, value.pwd);
            });
            let bool = TemplateVar.get('needRedeem').concat(TemplateVar.get('needRevoke')).every(val => {
                return Session.get(val.hashX) === Session.get('NUM');
            })
            if(bool) {
                Session.set('display', 'none');
            }
            Session.set('popStorePwd', false);
            Session.set('isShowModal', false);
            EthElements.Modal.hide();
        }
    }
});
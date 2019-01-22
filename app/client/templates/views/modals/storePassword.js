

Template['views_modals_storepassword'].onDestroyed(function () {
    Session.set('isShowModal', false);
    Session.set('popStorePwd', false);
});

Template['views_modals_storepassword'].onCreated(function () {
    let self = this;
    TemplateVar.set(self, 'template', self); 
    TemplateVar.set(self, 'needRedeem', self.data.needPwd['redeem']);
    TemplateVar.set(self, 'needRevoke', self.data.needPwd['revoke']);
    TemplateVar.set(self, 'redeemText', 'Transactions pending confirmation');
    TemplateVar.set(self, 'revokeText', 'Transactions pending cancellation');
});

Template['views_modals_storepassword'].helpers({
    listRedeem: function() {
        let pwdCollection = [];
        _.each(TemplateVar.get('needRedeem'), function(value, index) {
            if(value.chain) {
                pwdCollection.push({
                    index: `Tx${index+1}`,
                    time: Helpers.timeStamp2String(value.time),
                    amount: web3.toBigNumber(value.value).div(100000000).toString(10),
                    from: value.chain === 'BTC' ? `${value.from} (BTC)` : `${value.from} (WAN)`,
                    to: value.chain === 'BTC' ? `0x${value.crossAddress} (WAN)` : `${value.crossAddress} (BTC)`,
                    symbol: value.chain === 'BTC' ? 'BTC' : 'WBTC',
                    id: `redeem${index}`,
                    btnId:`red${index}`,
                    inputText: 'Enter TO account\'s password'
                })
            } else {
                pwdCollection.push({
                    index: `Tx${index+1}`,
                    time: value.sendTime?Helpers.timeStamp2String(Number(value.sendTime) * 1000) : "--",
                    amount: Helpers.tokenFromWei(value.contractValue, value.decimals),
                    from: value.srcChainAddr !== 'WAN' ? `${value.from} (${value.srcChainType})` : `${value.from} (WAN)`,
                    to: value.srcChainAddr !== 'WAN' ? `${value.to} (WAN)` : `${value.to} (${value.dstChainType})`,
                    symbol: value.tokenSymbol,
                    id: `redeem${index}`,
                    btnId:`red${index}`,
                    inputText: 'Enter TO account\'s password'
                })
            }

        })
        return pwdCollection;
    },

    listRevoke: function() {
        let pwdCollection = [];
        _.each(TemplateVar.get('needRevoke'), function(value, index) {
            if(value.chain) {
                pwdCollection.push({
                    index: `Tx${index+1}`,
                    time: Helpers.timeStamp2String(value.time),
                    amount: web3.toBigNumber(value.value).div(100000000).toString(10),
                    from: value.chain === 'BTC' ? `${value.from} (BTC)` : `${value.from} (WAN)`,
                    to: value.chain === 'BTC' ? `0x${value.crossAddress} (WAN)` : `${value.crossAddress} (BTC)`,
                    symbol: value.chain === 'BTC' ? 'BTC' : 'WBTC',
                    id: `revoke${index}`,
                    btnId:`rev${index}`,
                    inputText: 'Enter FROM account\'s password'
                })
            } else {
                pwdCollection.push({
                    index: `Tx${index+1}`,
                    time: value.sendTime?Helpers.timeStamp2String(Number(value.sendTime) * 1000) : "--",
                    amount: Helpers.tokenFromWei(value.contractValue, value.decimals),
                    from: value.srcChainAddr !== 'WAN' ? `${value.from} (${value.srcChainType})` : `${value.from} (WAN)`,
                    to: value.srcChainAddr !== 'WAN' ? `${value.to} (WAN)` : `${value.to} (${value.dstChainType})`,
                    symbol: value.tokenSymbol,
                    id: `revoke${index}`,
                    btnId:`rev${index}`,
                    inputText: 'Enter FROM account\'s password'
                })
            }
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
    'click .closeBtn': function (e) {
        let id = e.target.id;
        let self = TemplateVar.get('template');

        let [type, num] = [id.substr(0,3), id.substr(3)];
        if(type === 'red') {
            let tmp = TemplateVar.get('needRedeem');
            Session.set(tmp[num].hashX, Session.get('NUM'));
            tmp.splice(num, 1);
            TemplateVar.set(self, 'needRedeem', tmp);
        }
        if(type === 'rev') {
            let tmp = TemplateVar.get('needRevoke');
            Session.set(tmp[num].hashX, Session.get('NUM'));
            tmp.splice(num, 1);
            TemplateVar.set(self, 'needRevoke', tmp);
        }
        let len = TemplateVar.get('needRedeem').length + TemplateVar.get('needRevoke').length
        if(!len) {
            Session.set('popStorePwd', false);
            Session.set('isShowModal', false);
            EthElements.Modal.hide();
        }

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
                if(['WAN', 'BTC'].includes(value.chain)) {
                    value.chain === 'BTC' ? Session.set(`0x${value.crossAddress}`, value.pwd): Session.set(`${value.crossAddress}`, value.pwd);
                } else {
                    Session.set(`${value.to}`, value.pwd);
                }
            });
            TemplateVar.get('needRevoke').forEach(value => {
                Session.set(`${value.from}`, value.pwd);
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
/**
 Template Controllers
 @module Templates
 */

let InterID;

 const getAddressList = function(template,chainType) {

    mist.ERC202WERC20(chainType).getAddressList(chainType, function (err, addressList) {
            if (! err) {
                let oldAddressList = TemplateVar.get(template, 'addressList');

                if(!oldAddressList || oldAddressList.length !== addressList.length) {
                    // console.log('update addressList');

                    TemplateVar.set(template,'addressList',addressList);
                    Session.set('addressList', addressList);
                }
            } else {
                Helpers.showError(err);
            }
        });

    mist.ERC202WERC20(chainType).getAddressList('WAN', function (err, wanAddressList) {
        EthElements.Modal.hide();

        if (!err) {
            let oldWanAddressList = TemplateVar.get(template, 'wanAddressList');

            if(!oldWanAddressList || oldWanAddressList.length !== wanAddressList.length) {
                // console.log('update wanAddressList');

                Session.set('wanAddressList', wanAddressList);
                TemplateVar.set(template,'wanAddressList',wanAddressList);
            }
        }
    });

 };

Template['views_crosschain_erc20'].onCreated(function () {
    let template = this;

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    TemplateVar.set(template, 'symbol', this.data.symbol);
    TemplateVar.set(template, 'chainType', this.data.chainType);
    TemplateVar.set(template, 'tokenOrigAddr', this.data.tokenOrigAddr);

    let chainType = this.data.chainType;
    getAddressList(template,chainType);

    InterID = Meteor.setInterval(function(){
        if(!Session.get('isShowModal')) {
            getAddressList(template,chainType);
        } else {
            console.log('isShowModal: ', Session.get('isShowModal'));
        }
        }, 10000);

});

Template['views_crosschain_erc20'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});

Template['views_crosschain_erc20'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'addressList': function(){
        return TemplateVar.get('addressList');
    },

    'wanAddressList': function(){
        return TemplateVar.get('wanAddressList')
    },
    'tokenOrigAddr': function(){
        return TemplateVar.get('tokenOrigAddr')
    },
    'symbol': function(){
        return TemplateVar.get('symbol')
    }

});

Template['views_crosschain_erc20'].events({

    /**
     Clicking the name, will make it editable
     @event click .edit-name
     */

    'click .edit-icon': function (e) {

        let edit = document.getElementById('edit-name');
        $(edit).attr('contenteditable','true');

        let text = edit.innerHTML;
        edit.focus();
        edit.value = text;
    },

    'click .edit-name': function(e){
        // make it editable
        $(e.currentTarget).attr('contenteditable','true');
    },
    /**
     Prevent enter
     @event keypress .edit-name
     */
    'keypress .edit-name': function(e){

        if(e.keyCode === 13)
            e.preventDefault();
    },
    /**
     Bluring the name, will save it
     @event blur .edit-name, keyup .edit-name
     */
    'blur .edit-name, keyup .edit-name': function(e){

        let $el = $(e.currentTarget);

        if(!e.keyCode || e.keyCode === 13) {
            let text = $el.text();

            if(_.isEmpty(text)) {
                text = TAPi18n.__('wallet.accounts.defaultName');
            }

            // Save new name
            Wallets.update(this._id, {$set: {
                    name: text
                }});
            EthAccounts.update(this._id, {$set: {
                    name: text
                }});
            CustomContracts.update(this._id, {$set: {
                    name: text
                }});

            // make it non-editable
            $el.attr('contenteditable', null);
        }
    },

});


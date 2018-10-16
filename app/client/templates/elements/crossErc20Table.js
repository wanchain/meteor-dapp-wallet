
let InterID;

const accountClipboardEventHandler = function(e){
    e.preventDefault();

    function copyAddress(){

        let copyTextarea = document.querySelector('.copy-eth-address' + e.target.name);

        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(copyTextarea);
        selection.removeAllRanges();
        selection.addRange(range);

        try {
            document.execCommand('copy');

            GlobalNotification.info({
                content: 'i18n:wallet.accounts.addressCopiedToClipboard',
                duration: 3
            });
        } catch (err) {
            GlobalNotification.error({
                content: 'i18n:wallet.accounts.addressNotCopiedToClipboard',
                closeable: false,
                duration: 3
            });
        }
        selection.removeAllRanges();
    }

    copyAddress();
};

Template['elements_erc20_account_table'].onCreated(function () {
    let template = this;
    // console.log('addressList: ', this.data);
    let decimals = this.data.decimals;
    TemplateVar.set(template,'symbol',this.data.symbol);
    TemplateVar.set(template,'decimals',decimals);

    let chainType = this.data.chainType;
    mist.ERC202WERC20(chainType).getMultiTokenBalance(this.data.addressList,this.data.tokenAddr, (err, result) => {
        // console.log('getMultiBalances', result);
        TemplateVar.set(template,'ethAccounts',result);
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ERC202WERC20(chainType).getMultiTokenBalance(self.data.addressList,self.data.tokenAddr, (err, result) => {
            let oldAddressList = TemplateVar.get(template, 'ethAccounts');
            let oldResultHex = web3.toHex(oldAddressList);
            let resultHex = web3.toHex(result);

            if(!oldAddressList || oldResultHex !== resultHex) {
                // console.log('update eth account table: ',oldResultHex !== resultHex);
                let changeResult = Helpers.objectCompare(oldAddressList, result);

                for (let i in changeResult) {
                    let balance =  Helpers.tokenFromWei(changeResult[i], decimals);
                    let content = 'Balance of ' + i.toString() + ' has changed to ' + balance.toString();

                    GlobalNotification.info({
                        content: content,
                        duration: 10
                    });
                }

                TemplateVar.set(template,'ethAccounts',result);
            }

        });

    }, 10000);


});

Template['elements_erc20_account_table'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});

Template['elements_erc20_account_table'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'ethAccounts': function(){

        //eth account list
        const ethAccounts = TemplateVar.get('ethAccounts');
        const decimals = TemplateVar.get('decimals');

        let result = [];
        if (ethAccounts) {
            _.each(ethAccounts, function (value, index) {

                const balance =  Helpers.tokenFromWei(value, decimals);
                // const name = 'Account_' + index.slice(2, 6);
                result.push({address: index, balance: balance})
            });
        }

        // console.log('ethList: ', result);

        return result;
    },
    'symbol':function () {
        return TemplateVar.get('symbol');
    }

});

Template['elements_erc20_account_table'].events({
    'click .copy-to-clipboard-button': accountClipboardEventHandler,

    'click .qrcode-button': function(e){
        e.preventDefault();
        let name = e.target.name;

        Session.set('isShowModal', true);

        // Open a modal showing the QR Code
        EthElements.Modal.show({
            template: 'views_modals_qrCode',
            data: {
                address: name,
                ok: true
            }
        }, {
            closeable: false
        });
    },
});

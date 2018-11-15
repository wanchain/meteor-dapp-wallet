
const accountClipboardEventHandler = function(e){
    e.preventDefault();
    let copyTextarea = document.querySelector('.copy-eth-address' + e.target.name);
    Helpers.copyAddressOfPrompt(copyTextarea);
};

Template['elements_account_table_btc'].events({
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

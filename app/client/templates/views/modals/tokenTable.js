
Template['token_table_modal'].helpers({

    'tokens': function() {
        return this;
    },

});

Template['token_table_modal'].events({
    'click .ok-cross': function () {
        EthElements.Modal.hide();
    },
});

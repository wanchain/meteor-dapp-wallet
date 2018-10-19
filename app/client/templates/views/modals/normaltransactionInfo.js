/**
Template Controllers

@module Templates
*/


/**
The transaction info template

@class [template] views_modals_transactionInfo
@constructor
*/

Template['views_modals_normaltransactionInfo'].helpers({
    /**
     Returns the current transaction

     @method (transaction)
     @return {Object} the current transaction
     */
    'transaction': function() {
        // console.log('this: ', this);
        return this;
    }
});

Template['views_modals_normaltransactionInfo'].events({
    'click .ok-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
});

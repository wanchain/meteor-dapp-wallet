/**
Template Controllers

@module Templates
*/


/**
The transaction row template

@class [template] elements_transactions_table
@constructor
*/

/**
Block required until a transaction is confirmed.

@property blocksForConfirmation
@type Number
*/
var blocksForConfirmation = ethereumConfig.requiredConfirmations;

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 10;

Template['elements_transactions_table'].onCreated(function(){
    this._properties = {
        cursor: {}
    };

    TemplateVar.set('limit', this.data.limit || defaultLimit);
});

Template['elements_transactions_table'].helpers({
    /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
    'items': function(){
        var template = Template.instance(),
            items = [],
            searchQuery = TemplateVar.get('search'),
            limit = TemplateVar.get('limit'),
            collection = window[this.collection] || Transactions,
            selector = this.ids ? {_id: {$in: this.ids}} : {};

        // if search
        if(searchQuery) {
            var pattern = new RegExp('^.*'+ searchQuery.replace(/ +/g,'.*') +'.*$','i');
            template._properties.cursor = collection.find(selector, {sort: {timestamp: -1, blockNumber: -1}});
            items = template._properties.cursor.fetch();
            items = _.filter(items, function(item){
                // search from address
                if(pattern.test(item.from))
                    return item;

                // search to address
                if(pattern.test(item.to))
                    return item;

                // search value
                if(pattern.test(EthTools.formatBalance(item.value, '0,0.00[000000] unit')))
                    return item;

                // search date
                if(pattern.test(moment.unix(item.timestamp).format('LLLL')))
                    return item;

                return false;
            });
            items = items.slice(0, defaultLimit * 4);
            return items;

        } else {
            template._properties.cursor = collection.find(selector, {sort: {timestamp: -1, blockNumber: -1}, limit: limit});
            return template._properties.cursor.fetch();
        }
    },
    /**
    Check if there are more transactions to load. When searching don't show the show more button.

    @method (hasMore)
    @return {Boolean}
    */
    'hasMore': function(){
        var template = Template.instance();

        template._properties.cursor.limit = null;
        return (!TemplateVar.get('search') && template._properties.cursor.count() > TemplateVar.get('limit'));
    }
});

Template['elements_transactions_table'].events({
    'click button.show-more': function(e, template){
        var limit = TemplateVar.get('limit');
        TemplateVar.set('limit', limit + (template.data.limit || defaultLimit));
    },
    'keyup input.filter-transactions': _.debounce(function(e, template){
        if(e.keyCode === 27)
            e.currentTarget.value = '';

        TemplateVar.set(template, 'search', e.currentTarget.value);
    }, 200)
});




/**
The transaction row template

@class [template] elements_transactions_row
@constructor
*/


Template['elements_transactions_row'].helpers({
    /**
    Checks if, from the perspective of the selected account
    the transaction was incoming or outgoing.

    @method (incomingTx)
    @param {String} account     The _id of the current account
    */
    'incomingTx': function(account){
        var account = EthAccounts.findOne(account) || Wallets.findOne(account);
        return !!((account && this.from !== account.address) ||
                (!account && (EthAccounts.findOne({address: this.to}) || Wallets.findOne({address: this.to}))));
    },
    /**
    Returns the correct text for this transaction

    @method (transactionType)
    @return {String}
    */
    'transactionType': function(){
        var to = Helpers.getAccountByAddress(this.to),
            from = Helpers.getAccountByAddress(this.from),
            initiator = Helpers.getAccountByAddress(this.initiator);

        if(from)
            from = '<a href="/account/'+ from.address +'">'+ from.name +'</a>';
        initiator = (initiator)
            ? '<a href="/account/'+ initiator.address +'">'+ initiator.name +'</a>'
            : this.initiator;

        if(this.type === 'pendingConfirmation')
            return new Spacebars.SafeString(TAPi18n.__('wallet.transactions.types.pendingConfirmations', {initiator: initiator, from: from}));
        else if(to && from)
            return TAPi18n.__('wallet.transactions.types.betweenWallets');
        else if(to && !from)
            return TAPi18n.__('wallet.transactions.types.received');
        else if(!this.to)
            return TAPi18n.__('wallet.transactions.types.createdContract');
        else
            return TAPi18n.__('wallet.transactions.types.sent');
    },
    /**
    Returns the from now time, if less than 23 hours

    @method (fromNowTime)
    @return {String}
    */
    'fromNowTime': function(){
        Helpers.rerun['10s'].tick();

        var diff = moment().diff(moment.unix(this.timestamp), 'hours');
        return (diff < 23) ? ' '+ moment.unix(this.timestamp).fromNow() : '';
    },
    /**
    Returns the confirmations

    @method (totalConfirmations)
    */
    'totalConfirmations': blocksForConfirmation,
    /**
    Checks whether the transaction is confirmed ot not.

    @method (unConfirmed)
    */
    'unConfirmed': function() {
        if(!this.blockNumber || !EthBlocks.latest.number)
            return {
                confirmations: 0,
                percent: 0
            };

        var currentBlockNumber = EthBlocks.latest.number + 1,
            confirmations = currentBlockNumber - this.blockNumber;
        return (blocksForConfirmation >= confirmations && confirmations >= 0)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation)) * 100
            }
            : false;
    },
    /**
    Return the number of owner confirmations

    @method (ownerConfirmationCount)
    */
    'ownerConfirmationCount': function(){
        var account = Helpers.getAccountByAddress(this.from);

        if(account && this.confirmedOwners)
            return this.confirmedOwners.length +'/'+ account.requiredSignatures;
    },
    /**
    Get the owners of the current pending transactions wallet.

    @method (owners)
    */
    'owners': function(){
        var account = Helpers.getAccountByAddress(this.from);
        return (account) ? account.owners : [];
    },
    /**
    Check if the current owner is confirmed

    @method (ownerIsConfirmed)
    */
    'ownerIsConfirmed': function(){
        var owner = String(this);
        return (_.contains(Template.parentData(1).confirmedOwners, owner));
    },
    /**
    Check if the current owner has already approved the transaction

    @method (approved)
    */
    'approved': function(){
        if(!this.confirmedOwners)
            return;

        return Helpers.getAccountByAddress({$in: this.confirmedOwners});
    }
});


Template['elements_transactions_row'].events({
    /**
    Open transaction details on click of the <tr>

    @event click tr
    */
    'click tr': function(e) {
        var $element = $(e.target);
        if(!$element.is('button') && !$element.is('a')) {
            EthElements.Modal.show({
                template: 'views_modals_transactionInfo',
                data: {
                    _id: this._id
                }
            },{
                class: 'transaction-info'
            });
        }
    },
    /**
    Reject or Approve a pending transactions

    @event click button.approve, click button.reject
    */
    'click button.approve, click button.reject': function(e){
        var _this = this,
            account = Helpers.getAccountByAddress(_this.from),
            ownerAccounts = _.pluck(EthAccounts.find({address: {$in: account.owners}}).fetch(), 'address');

        if(account && (!$(e.currentTarget).hasClass('selected') || ownerAccounts.length > 1)) {

            var type = ($(e.currentTarget).hasClass('approve'))
                    ? 'confirm'
                    : 'revoke';

            var owner = account.owners[0];

            var sendConfirmation = function(owner){

                contracts['ct_'+ account._id][type].sendTransaction(_this.operation, {from: owner, gas: 1204633 + 900000}, function(error, hash){
                    if(!error) {
                        console.log(type,'TX hash: '+ hash);
                        
                        PendingConfirmations.update(_this._id, {$set: {
                            sending: owner
                        }});
                    } else {
                        GlobalNotification.error({
                            content: error.message,
                            duration: 8
                        });
                    }
                });
            };


            // check if the wallet has multiple accounts which are on this device

            // if only one, use this one to approve/reject
            if(ownerAccounts.length === 1)
                sendConfirmation(ownerAccounts[0]);

            // if multiple ask, which one to use
            else if(ownerAccounts.length > 1) {
                // show modal
                EthElements.Modal.question({
                    template: 'views_modals_selectAccount',
                    data: {
                        accounts: (type === 'confirm') ? _.difference(ownerAccounts, this.confirmedOwners) : _.difference(this.confirmedOwners, ownerAccounts),
                        callback: sendConfirmation
                    },
                    cancel: true
                });
            }
        }
    }
});

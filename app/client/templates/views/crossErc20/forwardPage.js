Template['views_crosschain_erc20_forward'].onCreated(function () {

    let symbol = FlowRouter.getParam('symbol');
    let tokenOrigAddr = FlowRouter.getParam('tokenOrigAddr');

    FlowRouter.go('crosschain_erc20', {tokenOrigAddr:tokenOrigAddr,symbol:symbol});
});
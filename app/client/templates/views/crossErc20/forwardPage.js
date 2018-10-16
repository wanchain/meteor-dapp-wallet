Template['views_crosschain_erc20_forward'].onCreated(function () {

    let symbol = FlowRouter.getParam('symbol');
    let tokenOrigAddr = FlowRouter.getParam('tokenOrigAddr');
    let tokenWanAddr = FlowRouter.getParam('tokenWanAddr');
    let chainType = FlowRouter.getParam('chainType');
    let decimals = FlowRouter.getParam('decimals');

    FlowRouter.go('crosschain_erc20', {chainType:chainType,tokenOrigAddr:tokenOrigAddr,tokenWanAddr:tokenWanAddr,symbol:symbol,decimals:decimals});
});
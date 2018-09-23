let directionEnum = ['ERC202WERC20','WERC202ERC20'];
let chainType = ['ETH','WAN'];
let index = 0;
let messageType = 'CrossChain_';
class crossOperator{
    constructor(action,parameters,chainType,callback){
        this.message = {
            index : index,
            action : action,
            parameters : parameters,
            chainType : chainType
        };
        index++;
        this.callback = callback;
    }
}
class crossChainOperators{
    constructor(crossType){
        this.crossType = crossType;
        this.direction = directionEnum[0];
        this.OperatorDict = {}
    }
    invokeOperator(crossOperator){
        this.OperatorDict[crossOperator.message.index] = crossOperator;
        this.postMessage(crossOperator);
    }
    postMessage(crossOperator) {
        window.postMessage({type : messageType+this.crossType ,message:crossOperator.message}, (!location.origin || location.origin === "null" ) ? '*' : location.origin);
    };
    invokeCallback(data){
        // console.log('invokeCallback : ',data);
        if(this.OperatorDict[data.index]){
            if(this.OperatorDict[data.index].callback){
                this.OperatorDict[data.index].callback(data.error,data.value);
            }
            return true;
        }
        return false;
    }

    // signed
    sendRawTrans(trans,chainType,callback){
        let operator = new crossOperator('sendRawTrans',{tx:trans},chainType,callback);
        this.invokeOperator(operator);
    }
    // sendNormalTransaction(trans, passwd, chainType, callback){
    //     let operator = new crossOperator('sendNormalTransaction',{tx:trans, passwd:passwd},chainType,callback);
    //     this.invokeOperator(operator);
    // }
    listHistory(addrList, callback){
        this.invokeOperator(new crossOperator('listHistory',{addrList:addrList},this.getOriginChainType(),callback));
    }

    getApproveTransData(tokenOrigAddr,tokenChainType,trans,callback){
        let operator = new crossOperator('getApproveTransData',{tx:trans,tokenOrigAddr:tokenOrigAddr,tokenChainType:tokenChainType},this.getOriginChainType() ,callback);
        this.invokeOperator(operator);
    }
    getLockTransData(tokenOrigAddr,tokenChainType,trans,callback){
        let operator = new crossOperator('getLockTransData',{tx:trans,tokenOrigAddr:tokenOrigAddr,tokenChainType:tokenChainType},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }
    getRefundTransData(tokenOrigAddr,tokenChainType,trans,callback){
        let operator = new crossOperator('getRefundTransData',{tx:trans,tokenOrigAddr:tokenOrigAddr,tokenChainType:tokenChainType},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }
    getRevokeTransData(tokenOrigAddr,tokenChainType,trans,callback){
        let operator = new crossOperator('getRevokeTransData',{tx:trans,tokenOrigAddr:tokenOrigAddr,tokenChainType:tokenChainType},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }

    sendLockTrans(tokenOrigAddr,tokenChainType, trans,password, callback){
        let operator = new crossOperator('sendLockTrans',{tx:trans,tokenOrigAddr:tokenOrigAddr,tokenChainType:tokenChainType, password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }

    sendRefundTrans(tokenOrigAddr,tokenChainType, trans,password,callback){
        let operator = new crossOperator('sendRefundTrans',{tx:trans,tokenOrigAddr:tokenOrigAddr,tokenChainType:tokenChainType, password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }
    sendRevokeTrans(tokenOrigAddr,tokenChainType, trans,password,callback){
        let operator = new crossOperator('sendRevokeTrans',{tx:trans,tokenOrigAddr:tokenOrigAddr,tokenChainType:tokenChainType, password:password},this.getOriginChainType(),callback);
        this.invokeOperator(operator);
    }
    getCrossEthScAddress(callback){
        this.invokeOperator(new crossOperator('getCrossEthScAddress',[],this.getOriginChainType(),callback));
    }
    getErc20Token(callback){
        this.invokeOperator(new crossOperator('getWethToken',[],this.getOriginChainType(),callback));
    }
    getStoremanGroups(tokenAddr, callback){
        this.invokeOperator(new crossOperator('syncErc20StoremanGroups',{tokenAddr:tokenAddr}, this.getOriginChainType(),callback));
    }
    getBalance(address,callback){
        this.invokeOperator(new crossOperator('getBalance', [address],this.getOriginChainType(),callback));
    }
    getMultiBalances(address,callback){
        this.invokeOperator(new crossOperator('getMultiBalances',[address],this.getOriginChainType(),callback));
    }
    getMultiTokenBalance(addressList,tokenAddress,callback){
        this.invokeOperator(new crossOperator('getMultiTokenBalance',{addressList:addressList,tokenAddress:tokenAddress},this.getOriginChainType(),callback));
    }

    getNonce(address,chainType, callback){
        this.invokeOperator(new crossOperator('getNonce',[address],chainType,callback));
    }
    getBlockNumber(callback){
        this.invokeOperator(new crossOperator('getBlockNumber',[],this.getOriginChainType(),callback));
    }
    getGasPrice(chainType,callback){
        this.invokeOperator(new crossOperator('getGasPrice',[],chainType,callback));
    }
    getScEvent(address,topics,callback){
        this.invokeOperator(new crossOperator('getScEvent',[address,topics],this.getOriginChainType(),callback));
    }
    subscribe(address,topics,callback){
        this.invokeOperator(new crossOperator('subscribe',[address,topics],this.getOriginChainType(),callback));
    }

    getAddressList(chainType,callback){
        this.invokeOperator(new crossOperator('getAddressList',{},chainType,callback));
    }
    getCoin2WanRatio(chainType,callback){
        this.invokeOperator(new crossOperator('getCoin2WanRatio',{},chainType,callback));
    }

    getWerc20Token(callback){
        this.invokeOperator(new crossOperator('getWerc20Token',[],this.getOriginChainType(),callback));
    }
    getRegErc20Tokens(callback){
        this.invokeOperator(new crossOperator('getRegErc20Tokens',{},this.getOriginChainType(),callback));
    }

    getErc20SymbolInfo(tokenAddr,callback){
        this.invokeOperator(new crossOperator('getErc20SymbolInfo',{tokenAddr:tokenAddr},this.getOriginChainType(),callback));
    }
    getOriginChainType(){
        return this.direction === directionEnum[0] ? chainType[0] : chainType[1];
    }
    getCrossChainType(){
        return this.direction === directionEnum[0] ? chainType[1] : chainType[0];
    }
}

if(typeof mist !== 'undefined')
{
    let erc20CrossChain = new crossChainOperators('ERC202WERC20');
    mist.ERC202WERC20 = function (erc20Type) {
        erc20CrossChain.direction = directionEnum[0];
        chainType[0]=erc20Type;
        return erc20CrossChain;
    };
    mist.WERC202ERC20 = function (erc20Type) {
        erc20CrossChain.direction = directionEnum[1];
        chainType[0]=erc20Type;
        return erc20CrossChain;
    };
}

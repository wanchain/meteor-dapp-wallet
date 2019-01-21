Meteor.startup(function () {

    if (typeof mist !== 'undefined') {
        mist.addPermanentCallbacks('requestAccount', function (e, accounts) {
            if (!e) {
                console.log('PermanentCallbacksrequestAccount :' + JSON.stringify(accounts));
                if (!_.isArray(accounts)) {
                    accounts = [accounts];
                }
                accounts.forEach(function (account) {
                    addr = account.address.toLowerCase();
                    web3.wan.getWanAddress(addr, function (e, wAddress) {
                        if (!e) {
                            let doc = EthAccounts.findAll({
                                address: addr
                            }).fetch()[0];
                            if (doc) {
                                EthAccounts.updateAll(doc._id, {
                                    $set: {name: account.name, reminder: account.reminder}
                                });
                                console.log("modify account name!");
                            }
                            else {
                                let insert = {
                                    type: 'account',
                                    address: addr,
                                    waddress: wAddress,
                                    balance: 0,
                                    name: account.name,
                                    reminder: account.reminder
                                };
                                EthAccounts.insert(insert);
                            }

                            FlowRouter.go('dashboard');
                        } else {
                            GlobalNotification.error({
                                content: e,
                                duration: 8
                            });
                        }
                    });

                });
            } else if (e.message) {
                GlobalNotification.error({
                    content: e.message,
                    duration: 8
                });
            }
        })
    }
    // SET default language
    // if(Cookie.get('TAPi18next')) {
    //     TAqPi18n.setLanguage(Cookie.get('TAPi18next'));
    // } else {
    //     var userLang = navigator.language || navigator.userLanguage,
    //     availLang = TAPi18n.getLanguages();
    //
    //     // set default language
    //     if (_.isObject(availLang) && availLang[userLang]) {
    //         TAPi18n.setLanguage(userLang);
    //     } else if (_.isObject(availLang) && availLang[userLang.substr(0,2)]) {
    //         TAPi18n.setLanguage(userLang.substr(0,2));
    //     } else {
    //         TAPi18n.setLanguage('en');
    //     }
    // }
    TAPi18n.setLanguage('en');

    // change moment and numeral language, when language changes
    Tracker.autorun(function () {
        if (_.isString(TAPi18n.getLanguage())) {
            var lang = TAPi18n.getLanguage().substr(0, 2);
            moment.locale(lang);
            try {
                numeral.language(lang);
            } catch (err) {
                console.warn('numeral.js couldn\'t set number formating: ', err.message);
            }
            EthTools.setLocale(lang);
        }

        // If on the mainnet, this will add the unicorn token by default, only once.
        // if (!localStorage['dapp_hasUnicornToken'] && Session.get('network') === 'main'){
        //     localStorage.setItem('dapp_hasUnicornToken', true);
        //
        //     // wait 5s, to allow the tokens to be loaded from the localstorage first
        //     Meteor.setTimeout(function(){
        //         var unicornToken = '0x63eed4943abaac5f43f657d8eec098ca6d6a546e';
        //         tokenId = Helpers.makeId('token', unicornToken);
        //         Tokens.upsert(tokenId, {$set: {
        //             address: unicornToken,
        //             name: 'Wanchain Ethereum Crosschain Token',
        //             symbol: 'WETH',
        //             balances: {},
        //             decimals: 18
        //         }});
        //     }, 5000);
        // }

        if(typeof mist !== 'undefined')
        {
            // weth
            mist.ETH2WETH().getWethToken(function (err, unicornToken) {
                if(!err) {
                    Meteor.setTimeout(function(){
                        let tokenId = Helpers.makeId('token', unicornToken.address);
                        let dapp_hasWethToken = Tokens.findOne(tokenId);

                        if (dapp_hasWethToken === undefined) {
                            let dapp_isWeth = Tokens.findOne({isWeth: 1});

                            if (dapp_isWeth !== undefined) {
                                Tokens.remove(dapp_isWeth._id);
                            }

                            Tokens.upsert(tokenId, {
                                $set: {
                                    address: unicornToken.address,
                                    name: unicornToken.name,
                                    symbol: unicornToken.symbol,
                                    balances: {},
                                    decimals: unicornToken.decimals,
                                    isWeth: 1
                                }
                            });
                        }

                    }, 2000);
                } else {
                    console.log('getWethToken err: ', err);
                }
            });

            // erc20
            mist.ERC202WERC20().getWerc20TokenAddressList(function (err, result) {
                if (!err) {
                    Meteor.setTimeout(function () {

                      let dapp_isWethList = Tokens.find({isWerc20: 1}).forEach(function (dapp_isWeth) {
                        Tokens.remove(dapp_isWeth._id);
                      });

                        _.each(result, function (tokenAddress, index) {

                            const _tokenAddress = tokenAddress;
                            let unicornToken = {};
                            unicornToken.address = _tokenAddress;

                            // check if the token has information about itself asynchrounously
                            let tokenInstance = TokenContract.at(tokenAddress);

                            tokenInstance.symbol(function (e, symbol) {
                                unicornToken.symbol = symbol;

                                tokenInstance.name(function (e, name) {
                                    unicornToken.name = name;
                                    tokenInstance.decimals(function (e, decimals) {
                                        unicornToken.decimals = Number(decimals);

                                        // console.log("unicornToken:", unicornToken);

                                        let tokenId = Helpers.makeId('token', unicornToken.address);
                                        let dapp_hasWerc20Token = Tokens.findOne(tokenId);

                                        if (dapp_hasWerc20Token === undefined) {

                                            Tokens.upsert(tokenId, {
                                                $set: {
                                                    address: unicornToken.address,
                                                    name: unicornToken.name,
                                                    symbol: `W${unicornToken.symbol}`,
                                                    balances: {},
                                                    decimals: unicornToken.decimals,
                                                    isWerc20: 1
                                                }
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    },2000);
                } else {
                  console.log('getWerc20Token err: ', err);
                }
            });

            // wbtc
            mist.BTC2WBTC().getWbtcToken(function (err, unicornToken) {
                if(!err) {
                    Meteor.setTimeout(function(){
                        let tokenId = Helpers.makeId('token', unicornToken.address);
                        let dapp_hasWethToken = Tokens.findOne(tokenId);

                        if (dapp_hasWethToken === undefined) {
                            let dapp_isWeth = Tokens.findOne({isWbtc: 1});

                            if (dapp_isWeth !== undefined) {
                                Tokens.remove(dapp_isWeth._id);
                            }

                            Tokens.upsert(tokenId, {$set: {
                                    address: unicornToken.address,
                                    name: unicornToken.name,
                                    symbol: unicornToken.symbol,
                                    balances: {},
                                    decimals: unicornToken.decimals,
                                    isWbtc: 1
                                }});
                        }

                    }, 2000);
                } else {
                    console.log('getWbtcToken err: ', err);
                }
            });



            const defaultGasprice = 180000000000;
            const sending = new Set();
            Session.set('NUM', 3);
            let InterID = Meteor.setInterval(function() {
                function finish() {
                    Session.set('isShowModal', true);
                    Session.set('popStorePwd', true);

                    EthElements.Modal.question({
                        template: 'views_modals_storepassword',
                        data: {
                            needPwd: needPwd
                        },
                    }, {
                        closeable: false
                    });
                }
                const needPwd = {
                    'redeem': [],
                    'revoke': []
                };
                const pending = {
                    'redeem': [],
                    'revoke': []
                };
                mist.ERC202WERC20().listAllCrossTrans(function(err, result) {
                    if (!err) {
                        mist.BTC2WBTC().listHistory('BTC', (errBtc, resultBtc) => {
                            if(!errBtc) {

                                resultBtc.forEach(item => {
                                    item.hashX = item.HashX;
                                    if(item.hashX) {
                                        if(['sentRedeemFailed', 'waitingX'].includes(item.status)) {
                                            result['canRedeem'].push(item);
                                        }
                                        if(['waitingRevoke', 'sentRevokeFailed'].includes(item.status)) {
                                            result['canRevoke'].push(item);
                                        }
                                    }
                                })
                                result['canRedeem'].forEach(item => {
                                    !Session.get(item.hashX) ? Session.set(item.hashX, 1) : '';
                                    if(Session.get(item.hashX) <= Session.get('NUM')) {
                                        if(['WAN', 'BTC'].includes(item.chain)) {
                                            if(item.chain === 'BTC') {
                                                !Session.get(`0x${item.crossAddress}`) ? needPwd['redeem'].push(item) : pending['redeem'].push(item)
                                            } else {
                                                !Session.get(item.crossAddress) ? needPwd['redeem'].push(item) : pending['redeem'].push(item)
                                            }
                                        } else {
                                            !Session.get(item.to) ? needPwd['redeem'].push(item) : pending['redeem'].push(item);
                                        }

                                    }
                                });

                                result['canRevoke'].forEach(item => {
                                    !Session.get(item.hashX) ? Session.set(item.hashX, 1) : '';
                                    if(Session.get(item.hashX) <= Session.get('NUM')) {
                                        !Session.get(item.from) ? needPwd['revoke'].push(item) : pending['revoke'].push(item);
                                    }
                                });
                                if (Session.get('display') !== 'none' && !Session.get('popStorePwd') && (needPwd['redeem'].length !== 0 || needPwd['revoke'].length !== 0)) {
                                    const tasks = needPwd['redeem'].concat(needPwd['revoke']);
                                    let completed = 0;
                                    tasks.forEach(item => {
                                        let tokenOrigAddr;
                                        if (item.tokenStand === 'E20') {
                                            tokenOrigAddr = item.srcChainAddr === 'WAN' ? item.dstChainAddr : item.srcChainAddr;
                                            mist.ERC202WERC20('ETH').getErc20Info(tokenOrigAddr, (error, result) => {
                                                if (!error) {
                                                    item.decimals = result.decimals;
                                                    if (++completed === tasks.length) {
                                                        finish();
                                                    }
                                                }
                                            });
                                        }
                                        if (item.tokenStand === 'ETH') {
                                            item.decimals = 18;
                                            if (++completed === tasks.length) {
                                                finish();
                                            }
                                        }
                                        if(['WAN', 'BTC'].includes(item.chain)) {
                                            item.decimals = 8;
                                            if (++completed === tasks.length) {
                                                finish();
                                            }
                                        }
                                    });
                                }
                                
                                pending['redeem'].filter(item => !sending.has(item.hashX)).forEach((trans_data) => {
                                    sending.add(trans_data.hashX);
                                    if(trans_data.tokenStand === 'E20' && Session.get(trans_data.to)) {
                                        let getGas, gasPrice;
                                        let trans = {
                                            lockTxHash: trans_data.lockTxHash, 
                                            amount: trans_data.contractValue.toString(10),
                                            storemanGroup: trans_data.storeman, 
                                            cross: trans_data.crossAddress,
                                            x: trans_data.x, 
                                            hashX: trans_data.hashX
                                        };
                                        if (trans_data.srcChainType !== 'WAN') {
                                            trans_data.tokenAddr = trans_data.srcChainAddr;
                                            trans_data.tokenType = trans_data.srcChainType;
                                            mist.ERC202WERC20(trans_data.tokenType).getGasPrice(trans_data.dstChainType, function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX)
                                                } else {
                                                    getGas = getGasPrice.RefundGas;
                                                    gasPrice = getGasPrice.gasPrice;
                                                    if (gasPrice < defaultGasprice) {
                                                        gasPrice = defaultGasprice
                                                    }
                                                    trans.gasLimit = getGas;
                                                    trans.gasPrice = gasPrice;
                                                    let pwd = Session.get(trans_data.to);
                                                    mist.ERC202WERC20(trans_data.tokenType).sendRefundTrans(trans_data.tokenAddr, trans_data.tokenType, trans, pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.to, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });
            
                                                }
                                            });
                                        } else {
                                            trans_data.tokenAddr = trans_data.dstChainAddr;
                                            trans_data.tokenType = trans_data.dstChainType;
                                            mist.WERC202ERC20(trans_data.tokenType).getGasPrice(trans_data.dstChainType, function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX);
                                                } else {
                                                    trans.gasLimit = getGasPrice.RefundGas;
                                                    trans.gasPrice = getGasPrice.gasPrice;
                                                    let pwd = Session.get(trans_data.to);
                                                    mist.WERC202ERC20(trans_data.tokenType).sendRefundTrans(trans_data.tokenAddr, trans_data.tokenType, trans, pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.to, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    if(trans_data.tokenStand === 'ETH' && Session.get(trans_data.to)) {
                                        let getGas, gasPrice;
                                        let trans = {
                                            lockTxHash: trans_data.lockTxHash, 
                                            amount: trans_data.contractValue.toString(10),
                                            storemanGroup: trans_data.storeman, 
                                            cross: trans_data.crossAddress,
                                            x: trans_data.x, 
                                            hashX: trans_data.hashX
                                        };
                                        if (trans_data.srcChainType !== 'WAN') {
                                            trans_data.tokenAddr = trans_data.srcChainAddr;
                                            trans_data.tokenType = trans_data.srcChainType;
                                            mist.ETH2WETH().getGasPrice('WAN', function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX)
                                                } else {
                                                    getGas = getGasPrice.RefundGas;
                                                    gasPrice = getGasPrice.gasPrice;
                                                    if (gasPrice < defaultGasprice) {
                                                        gasPrice = defaultGasprice
                                                    }
                                                    trans.gasLimit = getGas;
                                                    trans.gasPrice = gasPrice;
                                                    let pwd = Session.get(trans_data.to);
                                                    mist.ETH2WETH().sendRefundTrans(trans, pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.to, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });
            
                                                }
                                            });
                                        } else {
                                            trans_data.tokenAddr = trans_data.dstChainAddr;
                                            trans_data.tokenType = trans_data.dstChainType;
                                            mist.WETH2ETH().getGasPrice('ETH', function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX);
                                                } else {
                                                    trans.gasLimit = getGasPrice.RefundGas;
                                                    trans.gasPrice = getGasPrice.gasPrice;
                                                    let pwd = Session.get(trans_data.to);
                                                    mist.WETH2ETH().sendRefundTrans(trans, pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.to, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    if(['WAN', 'BTC'].includes(trans_data.chain)) {
                                        if(trans_data.chain === 'BTC' && Session.get(`0x${trans_data.crossAddress}`)) {
                                            let params = {
                                                crossAddress: trans_data.crossAddress,
                                                wanPassword: Session.get(`0x${trans_data.crossAddress}`),
                                                x: trans_data.x
                                            };
                                            mist.BTC2WBTC().redeemBtc('BTC', params, function (err,data) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX);
                                                    Session.set(`0x${trans_data.crossAddress}`, null);
                                                    Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                }
                                            });
                                        } else if(trans_data.chain === 'WAN' && Session.get(trans_data.crossAddress)) {
                                            let params = {
                                                HashX: trans_data.HashX, 
                                                crossAddress: trans_data.crossAddress, 
                                                X: trans_data.x,
                                                btcPassword: Session.get(trans_data.crossAddress)
                                            }
                                            mist.BTC2WBTC().redeemWbtc('BTC', params, function (err,data) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX);
                                                    Session.set(trans_data.crossAddress, null);
                                                    Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                }
                                            });
                                        }
                                    }
                                });
                                pending['revoke'].filter(item => !sending.has(item.hashX)).forEach((trans_data) =>{
                                    sending.add(trans_data.hashX);
   
                                    if(trans_data.tokenStand === 'E20' && Session.get(trans_data.from)) {
                                        let trans = {
                                            lockTxHash: trans_data.lockTxHash, 
                                            amount: trans_data.contractValue.toString(10),
                                            storemanGroup: trans_data.storeman, 
                                            cross: trans_data.crossAddress,
                                            x: trans_data.x, 
                                            hashX: trans_data.hashX
                                        };
                                        if (trans_data.srcChainType === 'WAN') {
                                            trans_data.tokenAddr = trans_data.dstChainAddr;
                                            trans_data.tokenType = trans_data.dstChainType;
                                            mist.WERC202ERC20(trans_data.tokenType).getGasPrice(trans_data.dstChainType, function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX)
                                                } else {
                                                    getGas = getGasPrice.RevokeGas;
                                                    gasPrice = getGasPrice.gasPrice;
                                                    if (gasPrice < defaultGasprice) {
                                                        gasPrice = defaultGasprice
                                                    }
                                                    trans.gasLimit = getGas;
                                                    trans.gasPrice = gasPrice;
                                                    let pwd = Session.get(trans_data.from);
                                                    mist.WERC202ERC20(trans_data.tokenType).sendRevokeTrans(trans_data.tokenAddr,trans_data.tokenType,trans,pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.from, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });                    
                                        
                                                }
                                            });
                                        } else {
                                            trans_data.tokenAddr = trans_data.srcChainAddr;
                                            trans_data.tokenType = trans_data.srcChainType;
                                            mist.ERC202WERC20(trans_data.tokenType).getGasPrice(trans_data.dstChainType, function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX)
                                                } else {
                                                    trans.gasLimit = getGasPrice.RevokeGas;
                                                    trans.gasPrice = getGasPrice.gasPrice;
                                                    let pwd = Session.get(trans_data.from);
                                                    mist.ERC202WERC20(trans_data.tokenType).sendRevokeTrans(trans_data.tokenAddr,trans_data.tokenType,trans,pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.from, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });                    
                                        
                                                }
                                            });
                                        }
                                    }
                                    if(trans_data.tokenStand === 'ETH' && Session.get(trans_data.from)) {
                                        let trans = {
                                            lockTxHash: trans_data.lockTxHash, 
                                            amount: trans_data.contractValue.toString(10),
                                            storemanGroup: trans_data.storeman, 
                                            cross: trans_data.crossAddress,
                                            x: trans_data.x, 
                                            hashX: trans_data.hashX
                                        };
                                        if (trans_data.srcChainType === 'WAN') {
                                            trans_data.tokenAddr = trans_data.dstChainAddr;
                                            trans_data.tokenType = trans_data.dstChainType;
                                            mist.WETH2ETH().getGasPrice('WAN', function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX)
                                                } else {
                                                    getGas = getGasPrice.RevokeGas;
                                                    gasPrice = getGasPrice.gasPrice;
                                                    if (gasPrice < defaultGasprice) {
                                                        gasPrice = defaultGasprice
                                                    }
                                                    trans.gasLimit = getGas;
                                                    trans.gasPrice = gasPrice;
                                                    let pwd = Session.get(trans_data.from);
                                                    mist.WETH2ETH().sendRevokeTrans(trans,pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.from, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });                    
                                        
                                                }
                                            });
                                        } else {
                                            trans_data.tokenAddr = trans_data.srcChainAddr;
                                            trans_data.tokenType = trans_data.srcChainType;
                                            mist.ETH2WETH().getGasPrice('ETH', function (err, getGasPrice) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX)
                                                } else {
                                                    trans.gasLimit = getGasPrice.RevokeGas;
                                                    trans.gasPrice = getGasPrice.gasPrice;
                                                    let pwd = Session.get(trans_data.from);
                                                    mist.ETH2WETH().sendRevokeTrans(trans, pwd, function (err) {
                                                        if (err) {
                                                            Helpers.showError(err);
                                                            sending.delete(trans_data.hashX);
                                                            Session.set(trans_data.from, null);
                                                            Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                        }
                                                    });                             
                                                }
                                            });
                                        }
                                    }
                                    if(['WAN', 'BTC'].includes(trans_data.chain) && Session.get(trans_data.from)) {
                                 
                                        if(trans_data.chain === 'BTC') {
                                            let params = {
                                                from: trans_data.from,
                                                HashX: trans_data.HashX,
                                                btcPassword: Session.get(trans_data.from)
                                            };
                                            mist.BTC2WBTC().revokeBtc('BTC', params, function (err,data) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX);
                                                    Session.set(trans_data.from, null);
                                                    Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                }
                                            });
                                        } else {
                                            let params = {
                                                from: trans_data.from, 
                                                HashX: trans_data.HashX, 
                                                X: trans_data.x,
                                                btcPassword: Session.get(trans_data.from)
                                            };                        
                                            mist.BTC2WBTC().revokeWbtc('BTC', params, function (err,data) {
                                                if (err) {
                                                    Helpers.showError(err);
                                                    sending.delete(trans_data.hashX);
                                                    Session.set(trans_data.from, null);
                                                    Session.set(trans_data.hashX, Session.get(trans_data.hashX) + 1);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                console.log('listAllCrossTrans BTC err: ', err);
                            }
                        });
                    } else {
                      console.log('listAllCrossTrans ETH&ERC20 err: ', err);
                    }
                })
            }, 10000);
        }        
    });
});

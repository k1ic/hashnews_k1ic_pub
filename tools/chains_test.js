/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const multibase = require('multibase');
const Mcrypto = require('@arcblock/mcrypto');
const ForgeSDK = require('@arcblock/forge-sdk');
const { fromJSON } = require('@arcblock/forge-wallet');
const { fromTokenToUnit, fromUnitToToken } = require('@arcblock/forge-util');
const { fromAddress } = require('@arcblock/forge-wallet');
const { fromSecretKey, WalletType } = require('@arcblock/forge-wallet');
const env = require('../api/libs/env');
const { 
  getDatachainList,
  AddDatachainNode,
  apiListChainAssets,
  apiListChainTopAccounts,
} = require('../api/routes/datachains');
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const type = WalletType({
  role: Mcrypto.types.RoleType.ROLE_APPLICATION,
  pk: Mcrypto.types.KeyType.ED25519,
  hash: Mcrypto.types.HashType.SHA3,
});
const wallet = fromSecretKey(process.env.APP_SK, type).toJSON();
const appWallet = fromJSON(wallet);

const defaultChainHost = env.chainHost;
const defaultChainId = env.chainId;

async function getForgeState(connId = defaultChainId){
  var res = null;
  var state = null;
  
  console.log('getForgeState connId=', connId);
 
  res = await ForgeSDK.doRawQuery(`{
      getForgeState {
        code
        state {
          token {
            symbol
            decimal
            name
            totalSupply
            description
            initialSupply
          }
          version
        }
      }
    }`,
    { conn: connId }
  );
  
  if(res && res.getForgeState && res.getForgeState.state){
    state = res.getForgeState.state;
  }
    
  return state;
}

async function getAccoutState(accoutAddr, connId = defaultChainId){
  var res = null;
  console.log('getAccoutState connId=', connId, 'accoutAddr=', accoutAddr);
  
  res = await ForgeSDK.doRawQuery(`{
      getAccountState(address: "${accoutAddr}") {
        code
        state {
          address
          balance
          moniker
          pk
        }
      }
    }`,
    { conn: connId }
  ); 
  return res;
}

async function forgeTxMemoTest(connId = defaultChainId){
  var res = null;
  var accountState = null;
  var accountBalance = null;
  var transferHash = null;
  
  const state = await getForgeState(connId);
  //console.log('getForgeState state=', state);
    
  /* default app account */
  res = await getAccoutState(wallet.address, connId);
  //console.log('default app getAccoutState res=', res);
    
  if(res && res.getAccountState && res.getAccountState.state){
    accountState = res.getAccountState.state;
    console.log('default app accountState=', accountState);
    accountBalance = parseFloat(fromUnitToToken(accountState.balance, state.token.decimal));
    console.log('default app accountBalance=', accountBalance);
      
    accountBalance = accountBalance.toFixed(6);
    if(accountBalance > 0){
      var tx_memo = {};
        
      /*Init tx_memo*/
      tx_memo['module'] = 'test';
      tx_memo['para'] = {
        content1: '中国信息通信研究院、中国通信标准化协会、中国互联网协会、可信区块链推进计划共同主办的“2019可信区块链峰会”在北京召开',
        content2: '中国信息通信研究院、中国通信标准化协会、中国互联网协会、可信区块链推进计划共同主办的“2019可信区块链峰会”在北京召开',
        content3: '中国',
      };
      console.log('tx_memo=', JSON.stringify(tx_memo));
        
      /*tx data value support max length 191*/
      console.log('tx_memo.length=', JSON.stringify(tx_memo).length);
        
      transferHash = await ForgeSDK.sendTransferTx({
          tx: {
            itx: {
              to: process.env.APP_OWNER_ACCOUNT,
              value: fromTokenToUnit(0.001, state.token.decimal),
              data: {
                typeUrl: 'json',
                value: tx_memo,
              },
            },
          },
          wallet: appWallet,
        },
        { conn: connId }
      );
      console.log('default app transferHash=', transferHash);
        
    }else{
      console.log('Default app account balance is empty');
    }
  }
}



(async () => {
  try {
    
    if (!process.env.MONGO_URI) {
      throw new Error('Cannot start application without process.env.MONGO_URI');
    }else{
      console.log('MONGO_URI=', process.env.MONGO_URI);
    }
    
    // Connect to database
    let isConnectedBefore = false;
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, autoReconnect: true });
    mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
    mongoose.connection.on('disconnected', () => {
      console.log('Lost MongoDB connection...');
      if (!isConnectedBefore) {
        mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, autoReconnect: true });
      }
    });
    mongoose.connection.on('connected', () => {
      isConnectedBefore = true;
      console.log('Connection established to MongoDB');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('Reconnected to MongoDB');
    });
    
    // wait database conection
    while(1){
      if(isConnectedBefore){
        console.log('Database connected');
        break;
      }else{
        console.log('Database connecting...');
        await sleep(1000);
      }
    }
    
    /*Connect to data chains*/
    const dataChainList = await getDatachainList(); 
    for(var i=0; i<dataChainList.length; i++){
      ForgeSDK.connect(dataChainList[i].chain_host, {
        chainId: dataChainList[i].chain_id,
        name: dataChainList[i].chain_id
      });
      console.log(`connected to app ${dataChainList[i].name} data chain host:${dataChainList[i].chain_host} id: ${dataChainList[i].chain_id}`);
    }

    /*Connect to app default chain*/
    if (defaultChainHost) {
      ForgeSDK.connect(defaultChainHost, {
        chainId: defaultChainId,
        name: defaultChainId,
        default: true
      });
      console.log(`connected to app default chain host:${defaultChainHost} id: ${defaultChainId}`);
    }
    
    var forgeState = null;
    
    for(var i=0; i<dataChainList.length; i++){
      forgeState = await getForgeState(dataChainList[i].chain_id);
      console.log('app data chain', dataChainList[i].name, 'state', forgeState);
    }
    forgeState = await getForgeState(defaultChainId);
    console.log('app default chain state', forgeState);
    
    /*List assets*/
    var params = {};
    var result = '';
    //params = {chainName: 'titanium', pagingSize: 10};
    //result = await apiListChainAssets(params);
    //console.log('titanium chain assets=', result);
    params = {chainName: 'zinc', pagingSize: 10};
    result = await apiListChainAssets(params);
    console.log('zinc chain assets=', result);
    
    /*list top accounts*/
    //params = {chainName: 'titanium', pagingSize: 10};
    //result = await apiListChainTopAccounts(params);
    //console.log('titanium top accounts=', result);
    params = {chainName: 'zinc', pagingSize: 10};
    result = await apiListChainTopAccounts(params);
    console.log('zinc top accounts=', result);
    
    /*Tx memo test*/
    //await forgeTxMemoTest();
    
    /*AddDatachainNode API test*/
    /*
    const fields = {
      chain_name: ['argons'],
      chain_host: ['https://argons.abtnetwork.io/api'],
      chain_id: ['argons-2019-11-07'],
    };
    await AddDatachainNode(fields);
    */
    
    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();

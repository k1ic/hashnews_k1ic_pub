/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const multiparty = require('multiparty');
const ForgeSDK = require('@arcblock/forge-sdk');
const { fromJSON } = require('@arcblock/forge-wallet');
const { fromTokenToUnit, fromUnitToToken } = require('@arcblock/forge-util');
const { wallet, newsflashWallet } = require('../libs/auth');
const { utcToLocalTime } = require('../libs/time');
const { getMonikerFragment } = require('../libs/user');

const { Datachain } = require('../models');
const env = require('../libs/env');

const appWallet = fromJSON(wallet);
const newsflashAppWallet = fromJSON(newsflashWallet);

const isProduction = process.env.NODE_ENV === 'production';
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const forgeTxDPointMaxNum = 6; /*The max decimal point is 6. The fromTokenToUnit API will failure when max then 6*/
const forgeTxDPointMaxPow = Math.pow(10, forgeTxDPointMaxNum);

function forgeTxValueSecureConvert(value){
  /*convert the tx value base on max decimal pointer*/
  return Math.floor((value)*forgeTxDPointMaxPow)/forgeTxDPointMaxPow; /*round down*/
}

async function forgeChainConnect(connId){
  var doc = await Datachain.findOne({ chain_id: connId });
  if(doc){
    ForgeSDK.connect(doc.chain_host, {
      chainId: doc.chain_id,
      name: doc.chain_id
    });
    if(!isProduction){
      console.log(`connected to ${doc.name} chain host:${doc.chain_host} id: ${doc.chain_id}`);
    }
  }else{
    if(!isProduction){
      console.log('forgeChainConnect invalid connId', connId);
    }
  }
}

async function doRawQuery(params){
  var res = {};
  
  if(typeof(params.queryCmd) == "undefined"){
    return res;
  }
  const queryCmd = params.queryCmd;
  
  var chainName = env.assetChainName;
  var chainHost = env.assetChainHost;
  var connId = env.assetChainId;
  if(typeof(params.chainName) != "undefined"){
    chainName = params.chainName;
  }
  var doc = await Datachain.findOne({ name: chainName });
  if(doc){
    chainHost = doc.chain_host;
    connId = doc.chain_id;
  }
  
  //connect to chain
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(
    queryCmd,
    { conn: connId }
  );
  
  return res;
}

async function getAssetState(asset_addr, connId){
  var res = null;
  
  //connect to chain
  await forgeChainConnect(connId);
  
  //console.log('getAssetState asset_addr=', asset_addr);
  
  res = await ForgeSDK.doRawQuery(`{
      getAssetState(address: "${asset_addr}") {
        state {
          moniker
          context {
            genesisTx {
              hash
            }
          }
        }
        code
      }
    }`,
    { conn: connId }
  );
  
  return res;
}

async function listHashNewsAssets (cursor, size, connId){
  var res = null;
  
  /*connect to chain*/
  await forgeChainConnect(connId);
  
  if(cursor && cursor.length > 0){
    res = await ForgeSDK.doRawQuery(`{
        listAssets(ownerAddress: "${newsflashWallet.address}", paging: {size: ${size}}) {
          assets {
            address
            genesisTime
            data {
              value
            }
          }
          page {
            cursor
            next
            total
          }
          code
        }
      }`, 
      { conn: connId }
    ); 
  }else{
    res = await ForgeSDK.doRawQuery(`{
        listAssets(ownerAddress: "${newsflashWallet.address}", paging: {size: ${size}, cursor: "${cursor}"}) {
          assets {
            address
            genesisTime
            data {
              value
            }
          }
          page {
            cursor
            next
            total
          }
          code
        }
      }`, 
      { conn: connId }
    ); 
  }
  
  return res;
}


async function listAllAssets (cursor, size, connId){
  var res = null;
  
  /*connect to chain*/
  await forgeChainConnect(connId);
  
  if(cursor && cursor.length > 0){
    res = await ForgeSDK.doRawQuery(`{
        listTransactions(paging: {size: ${size}, cursor: "${cursor}"}, typeFilter: {types: "create_asset"}) {
          code
          page {
            cursor
            next
            total
          }
          transactions {
            code
            hash
            receiver
            sender
            time
            type
            valid
          }
        }
      }`, 
      { conn: connId }
    ); 
  }else{
    res = await ForgeSDK.doRawQuery(`{
        listTransactions(paging: {size: ${size}}, typeFilter: {types: "create_asset"}) {
          code
          page {
            cursor
            next
            total
          }
          transactions {
            code
            hash
            receiver
            sender
            time
            type
            valid
          }
        }
      }`, 
      { conn: connId }
    ); 
  }
  
  return res;
}

async function listTopAccounts (cursor, size, connId){
  var res = null;
  
  /*connect to chain*/
  await forgeChainConnect(connId);
  
  if(cursor && cursor.length > 0){
    res = await ForgeSDK.doRawQuery(`{
        listTopAccounts(paging: {size: ${size}, cursor: "${cursor}"}) {
          accounts {
            balance
            numTxs
            totalStakes
            totalUnstakes
            numAssets
            moniker
            address
          }
          code
          page {
            cursor
            next
            total
          }
        }
      }`, 
      { conn: connId }
    ); 
  }else{
    res = await ForgeSDK.doRawQuery(`{
        listTopAccounts(paging: {size: ${size}}) {
          accounts {
            balance
            numTxs
            totalStakes
            totalUnstakes
            numAssets
            moniker
            address
          }
          code
          page {
            cursor
            next
            total
          }
        }
      }`, 
      { conn: connId }
    ); 
  }
  
  return res;
}

async function getAccoutState(accoutAddr, connId){
  var res = null;
  //console.log('getAccoutState accoutAddr=', accoutAddr, 'connId=', connId);
  
  await forgeChainConnect(connId);
  
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

async function getForgeState(connId){
  var res = null;
  
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(`{
      getForgeState {
        code
        state {
          version
          token {
            decimal
            description
            inflationRate
            initialSupply
            name
            symbol
            totalSupply
            unit
          }
          txConfig {
            maxAssetSize
            maxListSize
            maxMultisig
            minimumStake
          }
        }
      }
    }`, 
    { conn: connId }
  ); 
  return res;
}

async function getForgeStats(connId){
  var res = null;
  
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(`{
      getForgeStats {
        forgeStats {
          numStakeTxs
          numDeclareTxs
          numCreateAssetTxs
          numValidators
        }
        code
      }
    }`, 
    { conn: connId }
  ); 
  return res;
}

async function getTotalAssets(connId){
  var res = null;
  var totalAssets = 0;
  
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(`{
      listTransactions(typeFilter: {types: "create_asset"}) {
        page {
          total
        }
        code
      }
    }`, 
    { conn: connId }
  ); 
  
  if(res && res.listTransactions && res.listTransactions.code === 'OK'){
    totalAssets = res.listTransactions.page.total;
  }
  
  return totalAssets;
}


async function getTotalAccounts(connId){
  var res = null;
  var totalAccounts = 0;
  
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(`{
      listTopAccounts {
        page {
          total
        }
        code
      }
    }`, 
    { conn: connId }
  ); 
  
  if(res && res.listTopAccounts && res.listTopAccounts.code === 'OK'){
    totalAccounts = res.listTopAccounts.page.total;
  }
  
  return totalAccounts;
}


async function getChainInfo(connId){
  var res = null;
  
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(`{
      getChainInfo {
        info {
          address
          appHash
          blockHash
          blockHeight
          blockTime
          consensusVersion
          id
          moniker
          network
          synced
          totalTxs
          version
          votingPower
        }
        code
      }
    }`, 
    { conn: connId }
  ); 
  return res;
}

async function getNetInfo(connId){
  var res = null;
  
  await forgeChainConnect(connId);
  
  res = await ForgeSDK.doRawQuery(`{
      getNetInfo {
        netInfo {
          nPeers
        }
        code
      }
    }`, 
    { conn: connId }
  ); 
  return res;
}

async function declareAccount(objWallet, strMoniker, connId){
  var res = null;
  res = await ForgeSDK.sendDeclareTx({
      tx: {
        itx: {
          moniker: strMoniker,
         },
      },
      wallet: objWallet,
    },
    { conn: connId }
  );
  
  return res;
}

async function AddDatachainNode(fields){
  /*fields verify*/
  if(!fields
    || typeof(fields.chain_name) == "undefined"
    || typeof(fields.chain_host) == "undefined"
    || typeof(fields.chain_id) == "undefined"){
    console.log('AddDatachainNode invalid fields');
    return false;
  }
  
  /*verify input chais parameter*/
  const chain_name = fields.chain_name[0];
  const chain_host = fields.chain_host[0];
  const chain_id = fields.chain_id[0];
  var doc = null;
  doc = await Datachain.findOne({ name: chain_name });
  if(doc){
    console.log('AddDatachainNode chain name '+chain_name+' already exist');
    return false;
  }
  doc = await Datachain.findOne({ chain_host: chain_host });
  if(doc){
    console.log('AddDatachainNode chain host '+chain_host+' already exist');
    return false;
  }
  doc = await Datachain.findOne({ chain_id: chain_id });
  if(doc){
    console.log('AddDatachainNode chain id '+chain_id+' already exist');
    return false;
  }
  
  /*verify the chain data and declare the account*/
  ForgeSDK.connect(chain_host, {
    chainId: chain_id,
    name: chain_id
  });
  console.log(`connected to ${chain_name} chain host:${chain_host} id: ${chain_id}`);
  
  try {
    res = await getAccoutState(wallet.address, chain_id);
    if(!res || !res.getAccountState || !res.getAccountState.state){
      res = await declareAccount(appWallet, 'abtworld', chain_id);
    }
    res = await getAccoutState(newsflashWallet.address, chain_id);
    if(!res || !res.getAccountState || !res.getAccountState.state){
      res = await declareAccount(newsflashAppWallet, 'hashnews', chain_id);
    }
  } catch (err) {
    console.error('AddDatachainNode chain err', err);
    return false;
  }
  
  /*save chain data to db*/
  var new_doc = new Datachain({
    name: chain_name,
    chain_host: chain_host,
    chain_id: chain_id,
    createdAt: Date(),
  });
  await new_doc.save();
  console.log('AddDatachainNode added new chain node to db');
  
  return true;;
}

async function getDatachainItem(data_chain_name){
  let found_docs = [];
  var doc = null;
  
  if(data_chain_name === 'default'){
    doc = await Datachain.findOne({ chain_host: env.assetChainHost });
  }else{
    doc = await Datachain.findOne({ name: data_chain_name });
  }
  if(doc){
    found_docs.push(doc);
  }
  
  return found_docs;
}

async function getDatachainList(){
  let found = 0;
  let found_docs = [];
  
  Datachain.find().byState('online').exec(function(err, docs){
    if(docs && docs.length>0){
      console.log('Found', docs.length, 'datachain docs');
      found_docs = docs;
    }else{
      console.log('getDatachainList document not found!');
    }
    found = 1;
  });
    
  /*wait found result*/
  let wait_counter = 0;
  while(!found){
    await sleep(1);
    wait_counter++;
    if(wait_counter > 15000){
      break;
    }
  }
  
  if(!isProduction){
    console.log('getDatachainList wait_counter=' + wait_counter);
  }
  
  return found_docs;
}

async function apiGetChainNodeInfo(params){
  var chainName = env.assetChainName;
  var chainHost = env.assetChainHost;
  var connId = env.assetChainId;
  var pagingCursor = '';
  var pagingSize = 10;

  if(typeof(params.chainName) != "undefined"){
    chainName = params.chainName;
  }
  var doc = await Datachain.findOne({ name: chainName });
  if(doc){
    chainHost = doc.chain_host;
    connId = doc.chain_id;
  }
  
  var chainNodeInfo = {};
  chainNodeInfo['chainName'] = chainName;
  chainNodeInfo['chainHost'] = chainHost.replace('/api', '');
  
  var res;
  res = await getForgeState(connId);
  if(res && res.getForgeState && res.getForgeState.code === 'OK'){
    //chainNodeInfo['version'] = res.getForgeState.state.version;
    chainNodeInfo['tokenSymbol'] = res.getForgeState.state.token.symbol;
    chainNodeInfo['tokenTotalSupply'] = res.getForgeState.state.token.totalSupply;
    chainNodeInfo['tokenDecimal'] = res.getForgeState.state.token.decimal;
    chainNodeInfo['maxAssetSize'] = res.getForgeState.state.txConfig.maxAssetSize;
    chainNodeInfo['minimumStake'] = fromUnitToToken(res.getForgeState.state.txConfig.minimumStake, 
      res.getForgeState.state.token.decimal);
  }
  
  res = await getForgeStats(connId);
  if(res && res.getForgeStats && res.getForgeStats.code === 'OK'){
    if(res.getForgeStats.forgeStats.numValidators && res.getForgeStats.forgeStats.numValidators.length > 0){
      let numValidators = 0;
      for(var i=0;i<res.getForgeStats.forgeStats.numValidators.length;i++){
        numValidators += res.getForgeStats.forgeStats.numValidators[i];
      }
      chainNodeInfo['numValidators'] = String(numValidators);
    }else{
      chainNodeInfo['numValidators'] = '0';
    }
    
    if(res.getForgeStats.forgeStats.numStakeTxs && res.getForgeStats.forgeStats.numStakeTxs.length > 0){
      chainNodeInfo['numStakes'] = res.getForgeStats.forgeStats.numStakeTxs[0];
    }else{
      chainNodeInfo['numStakes'] = '0';
    }
  }
  
  chainNodeInfo['numAccounts'] = String(await getTotalAccounts(connId));
  chainNodeInfo['numAssets'] = String(await getTotalAssets(connId));
  
  res = await getChainInfo(connId);
  if(res && res.getChainInfo && res.getChainInfo.code === 'OK'){
    chainNodeInfo['blockHeight'] = res.getChainInfo.info.blockHeight;
    chainNodeInfo['chainId'] = res.getChainInfo.info.network;
    chainNodeInfo['totalTxs'] = res.getChainInfo.info.totalTxs;
    chainNodeInfo['version'] = res.getChainInfo.info.version;
  }
  
  res = await getNetInfo(connId);
  if(res && res.getNetInfo && res.getNetInfo.code === 'OK'){
    chainNodeInfo['nPeers'] = String(res.getNetInfo.netInfo.nPeers);
  }
  
  return chainNodeInfo;
}

async function apiListChainAssets(params){
  var chainName = env.assetChainName;
  var chainHost = env.assetChainHost;
  var connId = env.assetChainId;
  var pagingCursor = '';
  var pagingSize = 10;
  if(typeof(params.chainName) != "undefined"){
    chainName = params.chainName;
  }
  if(typeof(params.pagingCursor) != "undefined"){
    pagingCursor = params.pagingCursor;
  }
  if(typeof(params.pagingSize) != "undefined"){
    pagingSize = params.pagingSize;
  }
  var doc = await Datachain.findOne({ name: chainName });
  if(doc){
    chainHost = doc.chain_host;
    connId = doc.chain_id;
  }
  var res = await listAllAssets(pagingCursor, pagingSize, connId);
  var resoult = null;
  if(res && res.listTransactions && res.listTransactions.code === 'OK'){
    resoult = {};
    resoult.page = res.listTransactions.page;
    resoult.assets = res.listTransactions.transactions;
    
    if(resoult.assets && resoult.assets.length > 0){
      for(var i=0;i<resoult.assets.length;i++){
        var assetRes = await getAssetState(resoult.assets[i].receiver, connId);
        if(assetRes 
          && assetRes.getAssetState 
          && assetRes.getAssetState.code === 'OK' 
          && assetRes.getAssetState.state){
          resoult.assets[i].moniker = getMonikerFragment(assetRes.getAssetState.state.moniker);
        }else{
          resoult.assets[i].moniker = '';
        }
        resoult.assets[i].asset_link = chainHost.replace('/api', '/node/explorer/assets/')+resoult.assets[i].receiver;
        resoult.assets[i].hash_link = chainHost.replace('/api', '/node/explorer/txs/')+resoult.assets[i].hash;
        resoult.assets[i].time = utcToLocalTime(resoult.assets[i].time);
      }
    }
  }
  return resoult;
}


async function apiListChainTopAccounts(params){
  var chainName = env.assetChainName;
  var chainHost = env.assetChainHost;
  var connId = env.assetChainId;
  var pagingCursor = '';
  var pagingSize = 10;
  if(typeof(params.chainName) != "undefined"){
    chainName = params.chainName;
  }
  if(typeof(params.pagingCursor) != "undefined"){
    pagingCursor = params.pagingCursor;
  }
  if(typeof(params.pagingSize) != "undefined"){
    pagingSize = params.pagingSize;
  }
  var doc = await Datachain.findOne({ name: chainName });
  if(doc){
    chainHost = doc.chain_host;
    connId = doc.chain_id;
  }
  var res = await listTopAccounts(pagingCursor, pagingSize, connId);
  var resoult = null;
  if(res && res.listTopAccounts && res.listTopAccounts.code === 'OK'){
    resoult = {};
    
    var forgeRes = await getForgeState(connId);
    var token = {decimal: 16, symbol: 'TBA'};
    if(forgeRes && forgeRes.getForgeState && forgeRes.getForgeState.code === 'OK'){
      token = forgeRes.getForgeState.state.token;
    }
    resoult.token = token;
    resoult.page = res.listTopAccounts.page;
    resoult.accounts = res.listTopAccounts.accounts;
    
    if(resoult.accounts && resoult.accounts.length > 0){
      for(var i=0;i<resoult.accounts.length;i++){
        resoult.accounts[i].account_link = chainHost.replace('/api', '/node/explorer/accounts/')+resoult.accounts[i].address;
        resoult.accounts[i].moniker = getMonikerFragment(resoult.accounts[i].moniker);
        var balanceToken = parseFloat(fromUnitToToken(resoult.accounts[i].balance, token.decimal));
        resoult.accounts[i].balance = String(forgeTxValueSecureConvert(balanceToken));
      }
    }
  }
  return resoult;
}

module.exports = {
  init(app) {
    /*Get datachains API command list*/
    app.get('/api/datachainsget', async (req, res) => {
      try {
        var params = req.query;
        if(params){
          if(!isProduction){
            console.log('api.datachainsget params=', params);
          }
          const cmd = params.cmd;
          if (typeof(cmd) != "undefined") {
            switch(cmd){
              case 'getChainNodes':
                const data_chain_name = req.query.data_chain_name;
                if(typeof(data_chain_name) != "undefined"){
                  var dataChainList = [];
                  if(data_chain_name === 'all'){
                    dataChainList = await getDatachainList();
                  }else{
                    dataChainList = await getDatachainItem(data_chain_name);
                  }
                  if(dataChainList.length > 0){
                    res.json(dataChainList);
                    return;
                  }
                }
                break;
              case 'getNodeInfo':
                var nodeInfo = await apiGetChainNodeInfo(params);
                if(nodeInfo && Object.keys(nodeInfo).length > 0){
                  res.json(nodeInfo);
                  return;
                }
                break;
              case 'listAssets':
                var assets = await apiListChainAssets(params);
                if(assets){
                  res.json(assets);
                  return;
                }
                break;
              case 'listTopsAccouts':
                var accounts = await apiListChainTopAccounts(params);
                if(accounts){
                  res.json(accounts);
                  return;
                }
                break;
              case 'doRawQuery':
                try {
                  var rawRes = await doRawQuery(params);
                  res.json(rawRes);
                  return;
                } catch (err) {
                  //console.error('doRawQuery error', err);
                }
                break;
              default:
                break;
            }
          }
        }
        res.json(null);
      } catch (err) {
        console.error('api.datachainsget.error', err);
        res.json(null);
      }
    });
    /*end of /api/datachainsget get*/
    
    app.post('/api/datachainsset', async (req, res) => {
      try {
        var form = new multiparty.Form();
        form.maxFieldsSize = 10485760;
      
        //console.log('api.datachainsset req', req);
        //console.log('api.datachainsset req.body=', req.body);

        form.parse(req, async function (err, fields, files) {
          if(err){
            console.log('api.datachainsset err=', err);
            res.statusCode = 404;
            res.write('datachains set error');
            res.end();
            return ;
          }
          
          if(typeof(fields.cmd) != "undefined" && fields.cmd[0] != "undefined"){
            var result = false;
            var resValue = 'OK';
            
            const cmd = fields.cmd[0];
            
            if(!isProduction){
              console.log('api.datachainsset cmd=', cmd);
            }
            
            /*cmd list
             *1. add: add chain node
             */
            switch (cmd) {
              case 'add':
                result = await AddDatachainNode(fields);
                break;
              default:
                break;
            }
            
            if(result){
              if(!isProduction){
                console.log('api.datachainsset ok');
              }
              
              res.statusCode = 200;
              res.write(resValue);
              res.end();
              return;
            }
          }
          
          console.log('api.datachainsset error');
          res.statusCode = 404;
          res.write('datachains set error');
          res.end();
        });
      } catch (err) {
        console.error('api.datachainsset.error', err);
        res.statusCode = 404;
        res.write('datachains set error');
        res.end();
        return ;
      }
    });
    /*end of /api/datachainsset post*/
  },
  
  getDatachainList,
  forgeChainConnect,
  AddDatachainNode,
  apiListChainAssets,
  apiListChainTopAccounts,
};

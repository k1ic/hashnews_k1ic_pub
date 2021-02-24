/* eslint-disable no-console */
const multibase = require('multibase');
const ForgeSDK = require('@arcblock/forge-sdk');
const { fromJSON } = require('@arcblock/forge-wallet');
const { fromTokenToUnit, fromUnitToToken } = require('@arcblock/forge-util');
const { fromAddress } = require('@arcblock/forge-wallet');
const { fromSecretKey, WalletType } = require('@arcblock/forge-wallet');
const { wallet, newsflashWallet, type } = require('../../libs/auth');
const env = require('../../libs/env');
//const AssetPicList = require('../../../src/libs/asset_pic');
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));
const { Picture, Newsflash } = require('../../models');
const { getNewsByAssetDid, cleanUserDeadNews } = require('../newsflash');
const { forgeTxValueSecureConvert, waitAndGetTxHash } = require('../../libs/transactions');
const { utcToLocalTime } = require('../../libs/time');

//const appWallet = fromJSON(wallet);
//const newsflashAppWallet = fromJSON(newsflashWallet);

const appWallet = fromSecretKey(process.env.APP_SK, type);
const newsflashAppWallet = fromSecretKey(process.env.APP_NEWSFLASH_SK, type);

const pay_balance_unit_min = 0.0001;

async function paytipHook(hash, forgeState, userDid) {
  try {
    console.log('paytipHook');
    
    const txRes = await waitAndGetTxHash(hash, env.chainId);
    
    if(txRes && txRes.getTx && txRes.getTx.code === 'OK' && txRes.getTx.info){
      const tx_memo = JSON.parse(txRes.getTx.info.tx.itxJson.data.value);
      const tx_value = parseFloat(fromUnitToToken(txRes.getTx.info.tx.itxJson.value, forgeState.token.decimal));
      const tx_from = txRes.getTx.info.tx.from;
      const tx_to = txRes.getTx.info.tx.itxJson.to;
      const tx_local_time = utcToLocalTime(txRes.getTx.info.time);
      var transferHash = null;
      var res = null;
            
      console.log('Hook tx from:', tx_from, 'to: ', tx_to);
      console.log('Hook tx_value=', tx_value, 'tx_memo=', tx_memo);
      console.log('Hook tx_memo.module=', tx_memo.module);
      //console.log('Hook tx_local_time=', tx_local_time);
      
      if(tx_memo.module == 'newsflash' || tx_memo.module == 'article'){
        if(typeof(tx_memo.para.asset_did) != "undefined" && tx_memo.para.asset_did.length > 0){
          var newsflash_doc = await getNewsByAssetDid(tx_memo.para.asset_did);
          if(newsflash_doc){
            /*Update newsflash doc*/
            console.log('newsflash update paytip doc');
            newsflash_doc.paytip_counter += 1;
            if(tx_memo.module == 'article'){
              //newsflash_doc.hot_index += (10*newsflash_doc.news_weights);
              newsflash_doc.hot_index += (10*Math.round(tx_value/pay_balance_unit_min));
            }else{
              //newsflash_doc.hot_index += (10*newsflash_doc.news_weights);
              newsflash_doc.hot_index += (1*Math.round(tx_value/pay_balance_unit_min));
            }
            newsflash_doc.total_paytip_balance += tx_value;
            var paytip_list_item = {
              uname: tx_memo.para.payer_uname,
              udid: tx_from,
              mbalance: tx_value,
              comment: tx_memo.para.comment,
              time: tx_local_time
            };
            //newsflash_doc.paytip_list.push(paytip_list_item); /*Add to tail*/
            newsflash_doc.paytip_list.unshift(paytip_list_item); /*Add to head*/
            newsflash_doc.markModified('paytip_list');
            newsflash_doc.updatedAt = Date();
            await newsflash_doc.save();
          }else{
            console.log('Asset_did=', tx_memo.para.asset_did, 'not in local db');
          }
        }       
      }
    }
  } catch (err) {
    console.error('paytipHook error', err);
  } 
}

module.exports = {
  action: 'paytip',
  claims: {
    signature: async ({ extraParams: { locale, tipValue, tipAddr, dapp, para } }) => {
      const { state } = await ForgeSDK.getForgeState(
        {},
        { ignoreFields: ['state.protocols', /\.txConfig$/, /\.gas$/] }
      );
      var tx_memo = {};
      
      console.log('pay tip value=', tipValue, 'addr=', tipAddr);
      console.log('dapp=', dapp);
      console.log('para=', para);
      
      /*Init tx_memo*/
      /*tx memo example
       *{module: 'newsflash', para: {action: 'pay_tip', asset_did:'xxx', payer_uname:'', comment: ''}}
       *{module: 'article', para: {action: 'pay_tip', asset_did:'xxx', payer_uname:'', comment: ''}}
       */
      tx_memo['module'] = dapp;
      tx_memo['para'] = JSON.parse(para);
      //console.log('tx_memo=', JSON.stringify(tx_memo));
      console.log('tx_memo=', tx_memo);
      
      const description = {
        en: `Pay tip ${tipValue} ${state.token.symbol}`,
        zh: `打赏支付 ${tipValue} ${state.token.symbol}`,
      };

      return {
        type: 'TransferTx',
        data: {
          itx: {
            to: tipAddr,
            value: fromTokenToUnit(tipValue, state.token.decimal),
            data: {
              typeUrl: 'json',
              value: tx_memo,
            },
          },
        },
        description: description[locale] || description.en,
      };
    },
  },
  onAuth: async ({ claims, userDid, extraParams: { locale } }) => {
    console.log('paytip.onAuth', { claims, userDid });
    try {
      const claim = claims.find(x => x.type === 'signature');
      const tx = ForgeSDK.decodeTx(multibase.decode(claim.origin));
      const user = fromAddress(userDid);
      const { state } = await ForgeSDK.getForgeState(
        {},
        { ignoreFields: ['state.protocols', /\.txConfig$/, /\.gas$/] }
      );

      const hash = await ForgeSDK.sendTransferTx({
        tx,
        wallet: user,
        signature: claim.sig,
      });

      console.log('paytip.onAuth', hash);
      
      /*paytip hook*/
      paytipHook(hash, state, userDid);
      
      return { hash, tx: claim.origin };
    } catch (err) {
      console.error('pay.onAuth.error', err);
      const errors = {
        en: 'Paytip failed!',
        zh: '小费支付失败！',
      };
      throw new Error(errors[locale] || errors.en);
    }
  },
};

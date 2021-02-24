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
const { Picture, EcoPartner } = require('../../models');
const { getNewsByAssetDid, cleanUserDeadNews } = require('../newsflash');
const { createNewsflahAsset } = require('../../libs/assets');
const { forgeTxValueSecureConvert, waitAndGetTxHash } = require('../../libs/transactions');
const { utcToLocalTime } = require('../../libs/time');

const isProduction = process.env.NODE_ENV === 'production';

//const appWallet = fromJSON(wallet);
//const newsflashAppWallet = fromJSON(newsflashWallet);

const appWallet = fromSecretKey(process.env.APP_SK, type);
const newsflashAppWallet = fromSecretKey(process.env.APP_NEWSFLASH_SK, type);

async function newsflashPaymentHookV2(hash, forgeState, userDid) {
  try {
    
    if(!isProduction){
      console.log('newsflashPaymentHookV2');
    }
    
    const txRes = await waitAndGetTxHash(hash, env.chainId);
    
    if(txRes && txRes.getTx && txRes.getTx.code === 'OK' && txRes.getTx.info){
      const tx_memo = JSON.parse(txRes.getTx.info.tx.itxJson.data.value);
      const tx_value = parseFloat(fromUnitToToken(txRes.getTx.info.tx.itxJson.value, forgeState.token.decimal));
      const tx_from = txRes.getTx.info.tx.from;
      const tx_to = txRes.getTx.info.tx.itxJson.to;
      const tx_local_time = utcToLocalTime(txRes.getTx.info.time);
      var transferHash = null;
      var res = null;
      
      if(!isProduction){  
        console.log('Hook tx from:', tx_from, 'to: ', tx_to);
        console.log('Hook tx_value=', tx_value, 'tx_memo=', tx_memo);
        console.log('Hook tx_memo.module=', tx_memo.module);
        //console.log('Hook tx_local_time=', tx_local_time);
      }
      
      if(tx_memo.module == 'newsflash'){
        if(!isProduction){  
          console.log('newsflash tx hook');
        }
              
        if(typeof(tx_memo.para.asset_did) != "undefined" && tx_memo.para.asset_did.length > 0){
          var newsflash_doc = await getNewsByAssetDid(tx_memo.para.asset_did);
          if(newsflash_doc){
            /*create asset*/
            transferHash = await createNewsflahAsset(tx_memo.para.asset_did, newsflash_doc.data_chain_nodes[0].chain_id);
            
            /*Update newsflash doc*/
            if(transferHash && transferHash.length > 0){              
              /*pay back ratio*/
              /*1. 25% to dapp owner
               *2. 25% to eco partner
               *3. 50% to minner 
               */
              const pay_value_for_dapp_owner = forgeTxValueSecureConvert(tx_value*0.25);
              const pay_value_for_eco_partner = forgeTxValueSecureConvert(tx_value*0.25);
              const remain_value_for_minner = forgeTxValueSecureConvert(tx_value - pay_value_for_dapp_owner - pay_value_for_eco_partner);
              if(!isProduction){
                console.log('hook pay dapp owner=',pay_value_for_dapp_owner, 'eco partner=', pay_value_for_eco_partner, 'minner=',remain_value_for_minner);
              }
              
              /********************************************************************************************
               *************************minner balance assignment******************************************
               ********************************************************************************************/
              /*1. comment : 60% - for TOP(total_comment_minner_number)
                2. like    : 20% - for TOP(total_like_minner_number)
                3. forward : 20% - for TOP(total_forward_minner_number)
               */
              const total_comment_minner_balance = forgeTxValueSecureConvert(remain_value_for_minner * 0.6);
              const total_like_minner_balance = forgeTxValueSecureConvert(remain_value_for_minner * 0.2);
              const total_forward_minner_balance = forgeTxValueSecureConvert(remain_value_for_minner * 0.2);
              
              const each_comment_minner_balance = forgeTxValueSecureConvert(total_comment_minner_balance/newsflash_doc.total_comment_minner_number);
              const each_like_minner_balance = forgeTxValueSecureConvert(total_like_minner_balance/newsflash_doc.total_like_minner_number);
              const each_forward_minner_balance = forgeTxValueSecureConvert(total_forward_minner_balance/newsflash_doc.total_forward_minner_number);
              
              if(!isProduction){
                console.log('hook pay minner balance assignment total comment='+total_comment_minner_balance+' like='+total_like_minner_balance+' forward='+total_forward_minner_balance);
                console.log('hook pay minner balance assignment each comment='+each_comment_minner_balance+' like='+each_like_minner_balance+' forward='+each_forward_minner_balance);
                console.log('update newsflash doc');
              }
              
              newsflash_doc.news_hash = transferHash;
              newsflash_doc.news_time = tx_local_time;
              newsflash_doc.hash_href.push(newsflash_doc.data_chain_nodes[0].chain_host.replace('/api', '/node/explorer/txs/')+transferHash);
              newsflash_doc.total_payed_balance = tx_value;
              newsflash_doc.total_comment_minner_balance = total_comment_minner_balance;
              newsflash_doc.total_like_minner_balance = total_like_minner_balance;
              newsflash_doc.total_forward_minner_balance = total_forward_minner_balance;
              newsflash_doc.each_comment_minner_balance = each_comment_minner_balance;
              newsflash_doc.each_like_minner_balance = each_like_minner_balance;
              newsflash_doc.each_forward_minner_balance = each_forward_minner_balance;
              if(each_comment_minner_balance > 0){
                newsflash_doc.remain_comment_minner_balance = total_comment_minner_balance;
              }else{
                newsflash_doc.remain_comment_minner_balance = 0;
              }
              if(each_like_minner_balance > 0){
                newsflash_doc.remain_like_minner_balance = total_like_minner_balance;
              }else{
                newsflash_doc.remain_like_minner_balance = 0;
              }
              if(each_forward_minner_balance > 0){
                newsflash_doc.remain_forward_minner_balance = total_forward_minner_balance;
              }else{
                newsflash_doc.remain_forward_minner_balance = 0;
              }
              newsflash_doc.state = 'chained';
              await newsflash_doc.save();
              //console.log('newsflash_doc update to: ', newsflash_doc);
              
              /*****************************************************************************
               ****************************[start]pay to dapp owner*************************
               *****************************************************************************/
              try {
                transferHash = await ForgeSDK.sendTransferTx({
                  tx: {
                    itx: {
                      to: process.env.APP_OWNER_ACCOUNT,
                      value: fromTokenToUnit(pay_value_for_dapp_owner, forgeState.token.decimal),
                    },
                  },
                  wallet: newsflashAppWallet,
                });
                if(!isProduction){
                  console.log('pay for dapp owner', transferHash);
                }
              } catch (err) {
                transferHash = null;
                console.error('pay for dapp owner err', err);
              }
              /*****************************************************************************
               ***************************[end]pay to dapp owner****************************
               *****************************************************************************/
               
              /*****************************************************************************
               ***************************[start]pay to eco partner*************************
               *****************************************************************************/
              var new_docs = [];
              var found = 0;
              EcoPartner.find().byActivePartner().exec(function(err, docs){
                if(docs && docs.length>0){
                  new_docs = docs;
                }else{
                }
                found = 1;
              });
  
              /*wait found result*/
              var wait_counter = 0;
              while(!found){
                await sleep(1);
                wait_counter++;
                if(wait_counter > 15000){
                  break;
                }
              }
              var eco_partner_ctatio = 0;
              if(new_docs && new_docs.length>0){
                new_docs.map(function( e ) {
                  eco_partner_ctatio += e.cratio;
                });
              }
              if(eco_partner_ctatio > 0 && eco_partner_ctatio <= 1){
                for(var i=0;i<new_docs.length;i++){
                  if(new_docs[i].cratio > 0){
                    try {
                      var tmp_pay_value = forgeTxValueSecureConvert(pay_value_for_eco_partner*new_docs[i].cratio);
                      if(tmp_pay_value > 0){
                        transferHash = await ForgeSDK.sendTransferTx({
                          tx: {
                            itx: {
                              to: new_docs[i].did,
                              value: fromTokenToUnit(tmp_pay_value, forgeState.token.decimal),
                            },
                          },
                          wallet: newsflashAppWallet,
                        });
                        if(!isProduction){
                          console.log('pay to eco partner did=', new_docs[i].did, 'value=', tmp_pay_value);
                        }
                      }else{
                        if(!isProduction){
                          console.log('Invalid pay value for eco partner did=', new_docs[i].did);
                        }
                      }
                    } catch (err) {
                      transferHash = null;
                      if(!isProduction){
                        console.error('pay to eco partner did=', new_docs[i].did, 'err', err);
                      }
                    }
                  }
                }
              }else{
                if(!isProduction){
                  console.error('Eco partner invalid cratio=', eco_partner_ctatio);
                }
              }
              /*****************************************************************************
               ****************************[end]pay to eco partner**************************
               *****************************************************************************/
               
            }else{
              transferHash = await ForgeSDK.sendTransferTx({
                tx: {
                  itx: {
                    to: tx_from,
                    value: fromTokenToUnit(tx_value, forgeState.token.decimal),
                    data: {
                      typeUrl: 'json',
                      value: tx_memo,
                    },
                  },
                },
                wallet: newsflashAppWallet,
              });
              
              if(!isProduction){
                console.log('return back the token to user because of create asset error', transferHash);
              }
            }
                  
            /*clean dead news*/
            await cleanUserDeadNews(userDid);
            
            if(!isProduction){
              console.log('clean dead news for user', userDid);
            }
          }else{
            /*return back the token to user when asset not exist*/
            transferHash = await ForgeSDK.sendTransferTx({
              tx: {
                itx: {
                  to: tx_from,
                  value: fromTokenToUnit(tx_value, forgeState.token.decimal),
                  data: {
                    typeUrl: 'json',
                    value: tx_memo,
                  },
                },
              },
              wallet: newsflashAppWallet,
            });
            
            if(!isProduction){
              console.log('return back the token to user because of asset not exist in db', transferHash);
            }
          }
        }       
      }
    }
  } catch (err) {
    if(!isProduction){
      console.error('newsflashPaymentHookV2 error', err);
    }
  } 
}

module.exports = {
  action: 'payment_nf',
  claims: {
    signature: async ({ extraParams: { locale, toPay, dapp, para } }) => {
      const { state } = await ForgeSDK.getForgeState(
        {},
        { ignoreFields: ['state.protocols', /\.txConfig$/, /\.gas$/] }
      );
      var tx_memo = {};
      var pay_to_addr = null;
      
      if(!isProduction){
        console.log('toPay=', toPay);
        console.log('dapp=', dapp);
        console.log('para=', para);
      }
      
      if (typeof(dapp) != "undefined" && dapp && dapp.length > 0){
        switch(dapp){
          case 'newsflash':
            pay_to_addr = newsflashWallet.address;
            break;
          default:
            pay_to_addr = wallet.address;
            break;
        }
      }else{
        pay_to_addr = wallet.address;
      }
      
      /*Init tx_memo*/
      tx_memo['module'] = dapp;
      tx_memo['para'] = JSON.parse(para);
      
      if(!isProduction){
        //console.log('tx_memo=', JSON.stringify(tx_memo));
        console.log('pay_nf.claims tx_memo=', tx_memo);
      }
      
      const description = {
        en: `Please pay ${toPay} ${state.token.symbol}`,
        zh: `需支付 ${toPay} ${state.token.symbol}`,
      };

      return {
        type: 'TransferTx',
        data: {
          itx: {
            to: pay_to_addr,
            value: fromTokenToUnit(toPay, state.token.decimal),
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
    if(!isProduction){
      console.log('pay_nf.onAuth', { claims, userDid });
    }
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
      
      if(!isProduction){
        console.log('pay_nf.onAuth', hash);
      }
      
      /*payment hook for newsflash*/
      newsflashPaymentHookV2(hash, state, userDid);
      
      return { hash, tx: claim.origin };
    } catch (err) {
      if(!isProduction){
        console.error('pay.onAuth.error', err);
      }
      const errors = {
        en: 'Payment failed!',
        zh: '支付失败',
      };
      throw new Error(errors[locale] || errors.en);
    }
  },
};

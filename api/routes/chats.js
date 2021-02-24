/* eslint-disable no-console */
const mongoose = require('mongoose');
const { Chat } = require('../models');
const multiparty = require('multiparty');
const ForgeSDK = require('@arcblock/forge-sdk');
const env = require('../libs/env');
const { getLocalTimeStr } = require('../libs/time');
const { getUserDidFragment } = require('../libs/user');

const isProduction = process.env.NODE_ENV === 'production';
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

async function ChatAdd(fields){
  /*fields verify*/
  if(!fields
    || typeof(fields.user) == "undefined"
    || typeof(fields.group) == "undefined"
    || typeof(fields.content) == "undefined"){
    console.log('ChatAdd invalid fields');
    return false;
  }
  
  /*save newsflash to db when not exist*/
  const user = JSON.parse(fields.user[0]);
  const uname_with_did = user.name+'('+getUserDidFragment(user.did)+')';
  var doc = new Chat({
    uname: uname_with_did,
    udid: user.did,
    uavatar: user.avatar_small,
    time: getLocalTimeStr(),
    group: fields.group[0],
    content: fields.content[0],
    createdAt: Date(),
  });
  await doc.save();
  console.log('ChatAdd saved to db');
  
  return true;;
}

async function ChatGet(params){
  var found_docs = [];
  var found = 0;
  const group = params.group;
  const udid_to_show = params.udid_to_show;
  
  /*parameter verify*/
  if(typeof(group) == "undefined"
    || typeof(udid_to_show) == "undefined"){
    console.log('ChatAdd invalid parameter');
    return [];
  }
  
  if(udid_to_show && udid_to_show.length > 0){
    Chat.find().byGroupAndUdid(group, udid_to_show).exec(function(err, docs){
      if(docs && docs.length>0){
        console.log('ChatGet byGroupAndUdid Found', docs.length, 'docs');
        found_docs = docs;
      }else{
        console.log('ChatGet byGroupAndUdid document not found!');
      }
      found = 1;
    })
  }else{
    Chat.find().byGroup(group).exec(function(err, docs){
      if(docs && docs.length>0){
        console.log('ChatGet byGroup Found', docs.length, 'docs');
        found_docs = docs;
      }else{
        console.log('ChatGet byGroup document not found!');
      }
      found = 1;
    })
  }
  
  /*wait found result*/
  var wait_counter = 0;
  while(!found){
    await sleep(1);
    wait_counter++;
    if(wait_counter > 15000){
      break;
    }
  }
  
  console.log('ChatGet wait counter', wait_counter);
  //console.log(found_docs);
  
  return found_docs;
}

function postErrReply(res){
  res.statusCode = 404;
  res.write('did chat add error');
  res.end();
}

module.exports = {
  init(app) {
    /*Get chats API command list*/
    app.get('/api/didchatget', async (req, res) => {
      try {
        var params = req.query;
        if(params){
          console.log('api.didchatget params=', params);
          const chats = await ChatGet(params);
          if(chats && chats.length > 0){
            console.log('api.didchatget.ok - chats.length', chats.length);
            const final_chats = chats.slice(0, 499);
            console.log('api.didchatget.ok - final_chats.length', final_chats.length);
            res.json(final_chats);
            return;
          }
        }
        res.json(null);
      } catch (err) {
        console.error('api.didchatget.error', err);
        res.json(null);
      }
    });
    /*end of /api/didchatget*/
    
    app.post('/api/didchatadd', async (req, res) => {
      try {
        var form = new multiparty.Form();
        form.maxFieldsSize = 10485760;
      
        //console.log('api.didchatadd req', req);
        //console.log('api.didchatadd req.body=', req.body);

        form.parse(req, async function (err, fields, files) {
          if(err){
            console.log('api.didchatadd err=', err);
            postErrReply(res);
            return ;
          }
          
          if( isProduction && (
            typeof(fields.user) == "undefined" 
            || fields.user[0] == "undefined")){
            console.log('api.didchatadd invalid filed');
            postErrReply(res);
            return ;
          }
          
          var result = await ChatAdd(fields);
          if(result){
            console.log('api.didchatadd ok');
            res.statusCode = 200;
            res.write('OK');
            res.end();
            return;
          }else{
            console.log('api.didchatadd error');
            postErrReply(res);
            return;
          }
        });
      } catch (err) {
        console.error('api.didchatadd.error', err);
        postErrReply(res);
        return;
      }
    });
    /*end of /api/didchatadd post*/
  },
};

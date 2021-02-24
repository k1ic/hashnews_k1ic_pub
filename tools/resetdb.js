require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../api/libs/env');
const { Picture, Newsflash } = require('../api/models');
const AssetPicList = require('../src/libs/asset_pic');
const { HashString } = require('../api/libs/crypto');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

async function pictureDappDbReset(){
  var found = 0;
  var found_docs = [];
  
  Picture.find().exec(function(err, docs){
    if(docs && docs.length>0){
      console.log('Found', docs.length, ' picture docs');
      found_docs = docs;
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
  console.log('pictureDappDbReset wait_counter=' + wait_counter);
 
  /*reset dbs*/
  console.log('Reset ' + found_docs.length + ' picture docs');
  for(var i=0;i<found_docs.length;i++){
    var doc = found_docs[i];
    doc.payed_balance = 0;
    doc.payer_list = [];
    doc.payed_counter = 0;
    await doc.save();
  }
}

async function newsflashDappDbReset(){
  var found = 0;
  var found_docs = [];
  
  Newsflash.find().exec(function(err, docs){
    if(docs && docs.length>0){
      console.log('Found', docs.length, ' newsflash docs');
      found_docs = docs;
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
  console.log('newsflashDappDbReset wait_counter=' + wait_counter);
 
  /*reset dbs*/
  console.log('Reset ' + found_docs.length + ' newsflash docs');
  for(var i=0;i<found_docs.length;i++){
    var doc = found_docs[i];
    if(doc.asset_did && doc.content_did && doc.news_type && doc.news_content){
      doc.total_comment_minner_balance = 0;
      doc.total_like_minner_balance = 0;
      doc.total_forward_minner_balance = 0;
      doc.each_comment_minner_balance = 0;
      doc.each_like_minner_balance = 0;
      doc.each_forward_minner_balance = 0;
      doc.remain_comment_minner_balance = 0;
      doc.remain_like_minner_balance = 0;
      doc.remain_forward_minner_balance = 0;
      if(doc.comment_list && doc.comment_list.length > 0){
        doc.comment_list = doc.comment_list.map(function( e ) {
          e.mbalance = 0;
          return e;
        });
        doc.markModified('comment_list');
      }
      if(doc.like_list && doc.like_list.length > 0){
        doc.like_list = doc.like_list.map(function( e ) {
          e.mbalance = 0;
          return e;
        });
        doc.markModified('like_list');
      }
      if(doc.forward_list && doc.forward_list.length > 0){
        doc.forward_list = doc.forward_list.map(function( e ) {
          e.mbalance = 0;
          return e;
        });
        doc.markModified('forward_list');
      }
      await doc.save();
    }else{
      await doc.remove();
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
 
    // reset picture dapp db
    //await pictureDappDbReset();
    
    // reset newsflash dapp db
    //await newsflashDappDbReset();
    
    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();
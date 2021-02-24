/* eslint-disable no-console */
const mongoose = require('mongoose');
const { Picture } = require('../models');
const fs = require('fs');
const path = require('path');
const multiparty = require('multiparty');
const { 
  Base64ImageDataToFile, 
  ThumbImageGen,
  UserPaymentHdDirGet,
  UserPaymentThumbDirGet,
  UserPaymentWebHdDirGet,
  UserPaymentWebThumbDirGet,
  UserPaymentDirInit,
  ImageFileRemove
} = require('../libs/image');
const { HashString, HashFile } = require('../libs/crypto');
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const isProduction = process.env.NODE_ENV === 'production';

/*
*state option value:
*1. commited
*2. approved
*3. rejected
*/
const upload_state_default = 'approved';

async function findPics(strAssetDid){
  var new_docs = [];
  var found = 0;
  
  Picture.find().byAssetDid(strAssetDid).exec(function(err, docs){
    if(docs && docs.length>0){
      console.log('Found', docs.length, 'asset_did docs');
      new_docs = docs;
    }else{
      console.log('asset_did document not found!');
    }
    found = 1;
  })
  
  /*wait found result*/
  var wait_counter = 0;
  while(!found){
    await sleep(1);
    wait_counter++;
    if(wait_counter > 15000){
      break;
    }
  }
  
  console.log('findPics wait counter', wait_counter);
  //console.log(new_docs);
  
  return new_docs;
}

module.exports = {
  init(app) {
    app.post('/api/picUpload', async (req, res) => {
      try {
        var form = new multiparty.Form();
        form.maxFieldsSize = 10485760;
      
        //console.log('api.picUpload req', req);
        //console.log('api.picUpload req.body=', req.body);

        form.parse(req, async function (err, fields, files) {
          if(err){
            console.log('api.picUpload err=', err);
            res.statusCode = 404;
            res.write('upload error');
            res.end();
            return ;
          }
          
          if( isProduction && (
            typeof(fields.user) == "undefined"
            || typeof(fields.asset_type) == "undefined"  
            || typeof(fields.files) == "undefined" 
            || typeof(fields.token) == "undefined"
            || typeof(fields.imageUrl) == "undefined"
            || typeof(fields.pic_title) == "undefined"
            || typeof(fields.pic_description) == "undefined"
            || typeof(fields.pic_worth) == "undefined"
            || fields.user[0] == "undefined")){
            res.statusCode = 404;
            res.write('upload error');
            res.end();
            return ;
          }
        
          //console.log('files=', files);
          //console.log('fields.user=', fields.user);
          //console.log('fields.files[0]=', fields.files[0]);
          //console.log('fields.originFileObj[0]=', fields.originFileObj[0]);
          //console.log('fields.token[0]=', fields.token[0]);
          //console.log('fields.imageUrl[0]=', fields.imageUrl[0]);
          const asset_type = fields.asset_type[0];
          const upload_file = JSON.parse(fields.files[0]);
          const token = JSON.parse(fields.token[0]);
          const imageUrl = JSON.parse(fields.imageUrl[0]);
          const pic_title = fields.pic_title[0];
          const pic_description = fields.pic_description[0];
          const pic_worth = fields.pic_worth[0];
          console.log('asset type=', asset_type);
          console.log('pic tile=', pic_title);
          console.log('pic description=', pic_description);
          console.log('pic worth=', pic_worth, token.symbol);
          console.log('token.symbol=', token.symbol);
          console.log('token.decimal=', token.decimal);
          if(typeof(fields.user) != "undefined" && fields.user[0] != "undefined"){
            /*json to object*/
            const user = JSON.parse(fields.user[0]);
            /*user object example
            user= { email: '2439897034@qq.com',
              mobile: '',
              _id: '5dafad899fa62d1bdcf34301',
              did: 'z1emeg4eeh55Epfdz1bV3jhC9VxQ35H5yPb',
              name: 'Ð¡°ÍÊ¿',
               __v: 0 }
            */
            console.log('user=', user);
            
            await UserPaymentDirInit(user.did);
            const hd_filename = HashString('sha1', Date())+'.jpg';
            const hd_file = UserPaymentHdDirGet(user.did)+'/'+hd_filename;
            const hd_web_file = UserPaymentWebHdDirGet(user.did)+'/'+hd_filename;
            Base64ImageDataToFile(imageUrl, hd_file);
            const asset_did = HashFile('sha1', hd_file);
            console.log('asset_did=',asset_did);
            const picDb = await findPics(asset_did);
            if(picDb && picDb.length > 0){
              console.log('api.picUpload upload picture already uploaded');
              /*remove uload files*/
              await ImageFileRemove(hd_file);
              res.statusCode = 404;
              res.write('duplicate upload');
              res.end();
              return ;
            }
            const thumb_filename = HashString('md5', Date())+'.jpg';
            const thumb_file = UserPaymentThumbDirGet(user.did)+'/'+thumb_filename;
            const thumb_web_file = UserPaymentWebThumbDirGet(user.did)+'/'+thumb_filename;
            await ThumbImageGen(hd_file, thumb_file, 25, 25);

            /*save upload to db*/
            var pic_new = new Picture({
              category: asset_type,
              owner: user.name,
              contact: user.email,
              owner_did: user.did,
              blur_src: thumb_web_file,
              hd_src: hd_web_file,
              asset_did: asset_did,
              link: '/payment?asset_did='+asset_did,
              title: pic_title,
              description: pic_description,
              worth: pic_worth,
              token_sym: token.symbol,
              payback_rate: '0.6',
              state: upload_state_default,
              createdAt: Date(),
            });
            await pic_new.save();
            console.log('api.picUpload save upload to db');
          }
        
          //console.log('upload_file.lastModified=', upload_file.lastModified);
          //console.log('upload_file.lastModifiedDate=', upload_file.lastModifiedDate);
          //console.log('upload_file.originFileObj=', upload_file.originFileObj);
          //console.log('upload_file.percent=', upload_file.percent);
          //console.log('upload_file.size=', upload_file.size);
          //console.log('upload_file.thumbUrl=', upload_file.thumbUrl);
          //console.log('upload_file.type=', upload_file.type);
          //console.log('upload_file.uid=', upload_file.uid);
          res.statusCode = 200;
          res.write('upload success');
          res.end();
        });
      } catch (err) {
        console.error('api.picUpload.error', err);
        res.statusCode = 404;
        res.write('upload error');
        res.end();
        return ;
      }
    });
    /*end of /api/picUpload pose*/
    
    
  },
};

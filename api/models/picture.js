const mongoose = require('mongoose');

const PictureSchema = new mongoose.Schema({
  category: { type: String, required: true, default: 'human' },
  owner: { type: String, required: true, default: '' },
  contact: { type: String, required: true, default: '' },
  owner_did: { type: String, required: true, default: '' },
  blur_src: { type: String, required: true, default: '' },
  hd_src: { type: String, required: true, default: '' },
  asset_did: { type: String, required: true, default: '' },
  link: { type: String, required: true, default: '' },
  title: { type: String, required: true, default: '' },
  description: { type: String, default: '' },
  worth: { type: String, required: true, default: '18' },
  token_sym: { type: String, required: true, default: 'TBA' },
  payback_rate: { type: String, required: true, default: '0.6' },
  state: { type: String, required: true, default: 'commit' },
  payed_balance: { type: Number, default: 0 },
  payer_list: { type: Array, default: [] },
  payed_counter: { type: Number, default: 0 },
  like_counter: { type: Number, default: 0 },
  comment_counter: { type: Number, default: 0 },
  share_counter: { type: Number, default: 0 },
  like_list: { type: Array, default: [] },
  comment_list: { type: Array, default: [] },
  share_list: { type: Array, default: [] },
  hot_index: { type: Number, default: 0 },
  star_level: { type: Number, default: 0 },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

PictureSchema.query.byAssetDid = function(strAssetDid){
  return this.find({asset_did: strAssetDid}).sort({"createdAt":-1});
}

PictureSchema.query.byState = function(strState){
  return this.find({state: strState}).sort({"createdAt":-1});
}

PictureSchema.query.hotByPayCounter = function(){
  var docs =  this.find({$and: [
    {state: "approved"},
    {payed_counter: {$gt: 0}}
  ]}).sort({"payed_counter":-1, "updatedAt":-1});
  
  return docs;
}

PictureSchema.query.hotByPayBalance = function(){
  var docs =  this.find({$and: [
    {state: "approved"},
    {payed_balance: {$gt: 0}}
  ]}).sort({"payed_balance":-1, "updatedAt":-1});
  
  return docs;
}

PictureSchema.query.hotByHotIndex = function(){
  var docs =  this.find({$and: [
    {state: "approved"},
    {hot_index: {$gt: 0}}
  ]}).sort({"hot_index":-1, "updatedAt":-1});
  
  return docs;
}

PictureSchema.query.byMultiState = function(arrStates, sortField, sortOrder){
  console.log('picture query byMultiState arrStates=',arrStates,"sortField=",sortField,'sortOrder=',sortOrder);
  if(sortOrder == 'ascend'){
    if(sortField == 'createdAt'){
      return this.find({state:{$in:arrStates}}).sort({"createdAt":1});
    }else{
      return this.find({state:{$in:arrStates}}).sort({"createdAt":1});
    }
  }else{
    if(sortField == 'createdAt'){
      return this.find({state:{$in:arrStates}}).sort({"createdAt":-1});
    }else{
      return this.find({state:{$in:arrStates}}).sort({"createdAt":-1});
    }
  }
}

PictureSchema.query.byOwnerDid = function(strOwnerDid, sortField, sortOrder){
  if(sortOrder == 'ascend'){
    if(sortField == 'createdAt'){
       return this.find({owner_did: strOwnerDid}).sort({"createdAt":1});
    }else{
       return this.find({owner_did: strOwnerDid}).sort({"createdAt":1});
    }
  }else{
    if(sortField == 'createdAt'){
      return this.find({owner_did: strOwnerDid}).sort({"createdAt":-1});
    }else{
      return this.find({owner_did: strOwnerDid}).sort({"createdAt":-1});
    }
  }
}

PictureSchema.query.byOwnerDidAndMultiState = function(strOwnerDid, arrStates, sortField, sortOrder){
  if(sortOrder == 'ascend'){
    if(sortField == 'createdAt'){
       return this.find({$and: [
           {owner_did: strOwnerDid},
           {state:{$in:arrStates}}
         ]}).sort({"createdAt":1});
    }else{
       return this.find({$and: [
           {owner_did: strOwnerDid},
           {state:{$in:arrStates}}
         ]}).sort({"createdAt":1});
    }
  }else{
    if(sortField == 'createdAt'){
       return this.find({$and: [
           {owner_did: strOwnerDid},
           {state:{$in:arrStates}}
         ]}).sort({"createdAt":-1});
    }else{
       return this.find({$and: [
           {owner_did: strOwnerDid},
           {state:{$in:arrStates}}
         ]}).sort({"createdAt":-1});
    }
  }
}

const Picture = mongoose.model('picture', PictureSchema);

module.exports = Picture;

const mongoose = require('mongoose');

const DatachainSchema = new mongoose.Schema({
  name: { type: String, required: true, default: '' },
  chain_host: { type: String, required: true, default: '' },
  chain_id: { type: String, required: true, default: '' },
  hot_index: { type: Number, required: true, default: 100 },
  state: { type: String, required: true, default: 'online' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

DatachainSchema.query.byState = function(strState){
  var docs =  this.find({$and: [
    {state: strState}
  ]}).sort({"hot_index":-1, "createdAt":-1});
  
  return docs;
}

const Datachain = mongoose.model('datachain', DatachainSchema);

module.exports = Datachain;

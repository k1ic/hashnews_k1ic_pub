const mongoose = require('mongoose');

const EcoPartnerSchema = new mongoose.Schema({
  did: { type: String, required: true, default: '' },
  name: { type: String, required: true, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, required: true, default: '' },
  cratio: { type: Number, required: true, default: 0 },
  state: { type: String, required: true, default: 'active' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});


EcoPartnerSchema.query.byActivePartner = function(){
  var docs =  this.find({$and: [
    {state: 'active'}
  ]}).sort({"createdAt":-1});
  
  return docs;
}

const EcoPartner = mongoose.model('ecopartner', EcoPartnerSchema);

module.exports = EcoPartner;

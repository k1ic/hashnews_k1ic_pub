const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  uname: { type: String, required: true, default: '' },
  udid: { type: String, required: true, default: '' },
  uavatar: { type: String, default: '' },
  time: { type: String, required: true, default: '' },
  group: { type: String, required: true, default: '' },
  content: { type: String, required: true, default: '' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

ChatSchema.query.byGroup = function(strGroup){
  return this.find({group: strGroup}).sort({"createdAt":-1});
}

ChatSchema.query.byGroupAndUdid = function(strGroup, strUdid){
  return this.find({$and: [
    {group: strGroup},
    {udid: strUdid}
  ]}).sort({"createdAt":-1});
}

const Chat = mongoose.model('chat', ChatSchema);

module.exports = Chat;

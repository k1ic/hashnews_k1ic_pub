const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  did: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  avatar_small: { type: String, default: '' },
  email: { type: String, default: '' },
  mobile: { type: String, default: '' },
  perm_publish: { type: Boolean, default: true },
  perm_comment: { type: Boolean, default: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;

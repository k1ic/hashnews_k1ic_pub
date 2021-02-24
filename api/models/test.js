const mongoose = require('mongoose');

/*https://blog.csdn.net/zccz14/article/details/51298545*/

const TestdbSchema = new mongoose.Schema({
  testDid: { type: String },
  testState: { type: String },
  testString: { type: String },
  testNumber: { type: Number },
  testBoolean: { type: Boolean },
  testBuffer: { type: Buffer },
  testArray: { type: Array },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

TestdbSchema.query.byState = function(strState){
  return this.find({testState: strState}).sort({"createdAt":-1});
}

const Testdb = mongoose.model('testdb', TestdbSchema);

module.exports = Testdb;

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../api/libs/env');
const { Testdb } = require('../api/models');
const { HashString } = require('../api/libs/crypto');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));

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
    
    //console.log('MongoDB collection Testdb obj=', Testdb);
    //const testDid = HashString('sha1', Date());
    const testDid = '7903c55df26dd063a45bc7639482bd7a860d6f6a';
    var doc = await Testdb.findOne({ testDid: testDid });
    if(doc) {
      doc.updatedAt = Date();
      doc.testString = 'Update to Hello World';
      doc.testNumber = 1.01234567890;
      doc.testBoolean = true;
  
      /*Buffer data*/
      var str = "你好JavaScript";
      var buf = new Buffer(str);
      doc.testBuffer = buf;
  
      /*Array data*/
      const arrayData = [
        {
          udid: 'z1mgd3jJwGt53MePTUQdDS3BsBxktmbSFrn',
          uname: '大米蜂',
          content: 'abtworld.cn',
          mbalance: 0.0001,
        },
        {
          udid: 'z1VdEmDWbKc3x8JDUWsaMRsjqutwpxuNsjV',
          uname: '小巴士',
          content: 'abtworld.cn/newsflash',
          mbalance: 0.0001,
        },
      ];
      doc.testArray = arrayData;
  
      await doc.save();
    }else{
      doc = new Testdb({
        testDid: testDid,
        testState: 'OK',
        testString: 'Hello World',
        createdAt: Date(),
      });
      await doc.save();
    }

    /*find and update doc*/
    doc = await Testdb.findOne({ testDid: testDid });
    if(doc) {
      if(doc.testArray && doc.testArray.length > 0){
        const index=doc.testArray.findIndex((element)=>element.udid == 'z1VdEmDWbKc3x8JDUWsaMRsjqutwpxuNsjV');
        if(index != -1){
          doc.testArray[index].mbalance += 0.0001;
          doc.markModified('testArray');
          await doc.save();
          console.log('doc update to', doc);
        }
      }
    }

    /*Delete document test*/
    //Testdb.remove({testDid: '7903c55df26dd063a45bc7639482bd7a860d6f6a'}).exec();
    
    /*MongoDB document query*/
    Testdb.find().byState('OK').exec(function(err, docs){
      if(docs && docs.length>0){
        console.log('Found', docs.length, 'OK docs');
        //console.log(docs);
        docs.map(function( doc ) {
          console.log('doc.testDid=', doc.testDid);
          console.log('doc.testState=', doc.testState);
          console.log('doc.testString=', doc.testString);
          console.log('doc.testNumber=', doc.testNumber);
          console.log('doc.testBoolean=', doc.testBoolean);
          console.log('doc.testBuffer=', doc.testBuffer.toString());
          //console.log('doc.testArray=', doc.testArray);
          var array = doc.testArray;
          Array.map(function( arr ) {
            console.log('arr.udid=', arr.udid);
            console.log('arr.uname=', arr.uname);
            console.log('arr.content=', arr.content);
            console.log('arr.mbalance=', arr.mbalance);
          });
          console.log('doc.createdAt=', doc.createdAt);
          console.log('doc.updatedAt=', doc.updatedAt);
        });
      }else{
        console.log('OK document not found!');
      }
       
      mongoose.disconnect();
      process.exit(0);
    })
    
    //mongoose.disconnect();
    //process.exit(0);
  } catch (err) {
    console.error(err);
    console.error(err.errors);
    process.exit(1);
  }
})();
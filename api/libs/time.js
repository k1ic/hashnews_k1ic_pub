/* eslint-disable no-underscore-dangle */
const moment = require('moment');

function getLocalTimeStr()
{ 
  var now = new Date();
  var local_time = moment(now).local().format('YY/MM/DD HH:mm:ss');
  
  return local_time; 
}

function utcToLocalTime(utcTimeStr){
  var local_time = moment(utcTimeStr).local().format('YY/MM/DD HH:mm:ss');
  
  return local_time; 
}

function getDateByDeltaYear(deltaYear){
  var time = new Date();
  time.setFullYear(time.getFullYear()+deltaYear);
  return time;
}

function getDateByDeltaMonth(deltaMonth){
  var time = new Date();
  time.setMonth(time.getMonth()+deltaMonth);
  return time;
}

function getDateByDeltaDay(deltaDay){
  var time = new Date();
  time.setDate(time.getDate()+deltaDay);
  return time;
}

function getDateByDeltaHour(deltaHour){
  var time = new Date();
  time.setHours(time.getHours()+deltaHour);
  return time;
}

function dateDiffInDay(firstDate,secondDate){
  var firstDate = new Date(firstDate);
  var secondDate = new Date(secondDate);
  var diff = Math.abs(firstDate.getTime() - secondDate.getTime());
  var result = parseInt(diff / (1000 * 60 * 60 * 24));
  return result;
}

function dateDiffInHour(firstDate,secondDate){
  var firstDate = new Date(firstDate);
  var secondDate = new Date(secondDate);
  var diff = Math.abs(firstDate.getTime() - secondDate.getTime());
  var result = parseInt(diff / (1000 * 60 * 60));
  return result;
}

module.exports = {
  getLocalTimeStr,
  utcToLocalTime,
  getDateByDeltaYear,
  getDateByDeltaMonth,
  getDateByDeltaDay,
  getDateByDeltaHour,
  dateDiffInDay,
  dateDiffInHour,
};

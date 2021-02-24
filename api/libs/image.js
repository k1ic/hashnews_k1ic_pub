/* eslint-disable no-underscore-dangle */
/* sudo apt install graphicsmagick */

const fs = require('fs');
const gm = require('gm');
const path = require('path');

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));


/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getFsStat(path){
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if(err){
        resolve(false);
      }else{
        resolve(stats);
      }
    })
  })
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
function mkdir(dir){
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, err => {
      if(err){
        resolve(false);
      }else{
        resolve(true);
      }
    })
  })
}

/**
 * 路径是否存在，不存在则递归创建
 * @param {string} dir 路径
 */
async function mkdir_r(dir){
  //console.log('mkdir_r ', dir);
  let isExists = await getFsStat(dir);
  //如果该路径且不是文件，返回true
  if(isExists && isExists.isDirectory()){
    return true;
  }else if(isExists){     //如果该路径存在但是文件，返回false
     return false;
  }
  
  //如果该路径不存在
  let tempDir = path.parse(dir).dir;      //拿到上级路径
  //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
  let status = await mkdir_r(tempDir);
  let mkdirStatus;
  if(status){
    mkdirStatus = await mkdir(dir);
  }
  return mkdirStatus;
}

function UserPaymentBaseDirGet(user_did)
{
  return __dirname+'/../../src/static/images/payment/'+user_did;
}

function UserPaymentHdDirGet(user_did)
{
  return __dirname+'/../../src/static/images/payment/'+user_did+'/hd';
}

function UserPaymentThumbDirGet(user_did)
{
  return __dirname+'/../../src/static/images/payment/'+user_did+'/thumb';
}

function UserPaymentWebHdDirGet(user_did)
{
  return '/static/images/payment/'+user_did+'/hd';
}

function UserPaymentWebThumbDirGet(user_did)
{
  return '/static/images/payment/'+user_did+'/thumb';
}

async function UserPaymentDirInit(user_did){
  console.log('UserPaymentDirInit user_did=', user_did);
  if(user_did && user_did.length > 0){
    /*verify and init user did root*/
    await mkdir_r(UserPaymentHdDirGet(user_did));
    await mkdir_r(UserPaymentThumbDirGet(user_did));
  }
}

function Base64ImageDataToFile(base64Data, strFileName){
  const imgeData = base64Data.replace(/^data:image\/\w+;base64,/, "");
  //const dataBuffer = new Buffer(imgeData, 'base64');
  const dataBuffer = Buffer.from(imgeData, 'base64');
  fs.writeFileSync(strFileName, dataBuffer);
}

function FileToBase64ImageData(strFile) {
  const image = fs.readFileSync(strFile);
  const base64ImageData = 'data:image/jpg;base64,'+Buffer.from(image, 'binary').toString('base64');
  return base64ImageData;
}

function Base64ImageToFile(base64Image, strFileName) {
  const dataBuffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(strFileName, dataBuffer);
}

function FileToBase64Image(strFile) {
  const image = fs.readFileSync(strFile);
  const base64Image = Buffer.from(image, 'binary').toString('base64');
  return base64Image;
}

async function ThumbImageGen(strSrcFile, strThumbFile, thumbWide, thumbHeigh, quality=100){
  console.log('ThumbImageGen ' + strSrcFile + ' ' + strThumbFile + ' ' + thumbWide + ' ' + thumbHeigh);
  return new Promise((resolve, reject) => {
    gm(strSrcFile)
      .resize(thumbWide,thumbHeigh, '!')
      .setFormat('JPEG')
      .quality(quality)
      .strip()
      .autoOrient()
      .write(strThumbFile, function(err){
        if(err){
          console.log("resize error: " + err);
          resolve('');
        }else{
          console.log("resize success");
          const data = FileToBase64ImageData(strThumbFile);
          resolve(data);
        }
      });
  });
}

async function ImageCrop(strSrcFile, strTgtFile, cropWide, cropHeigh, startX, startY){
  console.log('ImageCrop ' + strSrcFile + ' ' + strTgtFile + ' ' + cropWide + ' ' + cropHeigh);
  return new Promise((resolve, reject) => {
    gm(strSrcFile)
      .crop(cropWide, cropHeigh, startX, startY)
      .setFormat('JPEG')
      .quality(100)
      .strip()
      .autoOrient()
      .write(strTgtFile, function(err){
        if(err){
          console.log("crop error: " + err);
          resolve('');
        }else{
          console.log("crop success");
          const data = FileToBase64ImageData(strTgtFile);
          resolve(data);
        }
      });
  });
}

async function ImageFileRemove(strPath){
  let isExists = await getFsStat(strPath);
  
  if(isExists){
    fs.unlinkSync(strPath);
  }
}

//(async () => {
  //const iconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAT5SURBVHic7ZxLiB1FFIa/meiYSYzvxDdGVHRUNGA2iYqbRHQxaNQJUWMCgiCCuNdFVsaFiLiJKArGGZ8giqLgK2AQRVTEB0FRNKhk0CSO6EQd44wuyqbrVO7cZ1ed7tvng4bpe6tP/VPddar6VJ0LhmEYhmEYhmEYhmEYhmEYhmEYRhVYCpymLcJwjAIzwCxwl7IWA/gY+Pf/4xfgCF059eZ88puRHderKuqRQW0BPbKpwWe3JFdhAO5h+p5De8jfwAmKumrLGg69Gdlxh6Ku2rIdeRNmvb/fV9RVSxYDv5HfgF3AS8gbdK6auh6o6qC+DljinY8DE0GZm9LJMV4n7wlzwHJgITDlff4dMKCkr1acAvxD3vA7vO8eRbqtS5Or65EquqybgQXe+bj3d+i27J0kAZ+S94A/gKO97waAb73vLZQSmRVIl/R0gzL3BmWuS6auhjyAbOyrG5Q5LyjzYjJ1NWMBsIe8oX8CDpun7IdeuRkqFEqp0qC+FjjZO5/AzbYa4Q/uQ8D6WKLqzFNIV7SiSdllwEGvrIVSCuZIYJq8gb9o45rXkDewEqGUqrisMVz8KmN7G9dYKCUiO5BR3XY2NCxCBiAtlFIQpyJDJW90cO0TSLdV+lBKFVzWJuYPlbTCQikR+Jz8CZ/GDfDtMgj84F1voZQeWYl0OU92YeP+wIaFUnrgIWRjru3CxkWBjZeBY3s45osOlJ7bkQtG/XIcAG4tsJ0EMaeBU8AxEe1rMolbKCucmLOsHyPa1uarWIZj9pCzcW5rSauCDTgK2OCd76az949GXA6MeOev4J70TtkDbAP29qinUtyG9Nt3FmBzQ2BzSwE2a8NO8oY7CJxYgM1wV8o3WCilLc7Abe3xp6lF8Tiyl6wq0HYhlDF0shn55HYSKmlFaMtCKW3wJfkT/CswXKDtAVzUN7O/HwulNGUV0qU8EqGOrUEd10aoo2/YhmysyyLUMRLU8UKEOvqCIWAfeUPtJt4s6COvnhng+Ej1dEyZBvVRZMNk+R8x8Af3IeCGSPVUmpT5HctwqW9ZXe9GrKuSHAf8Rd5A7yWo81WvvjngrAR1tiTmm+pVwH24uFQrhpGb4GZwG6ljMox7e884gOs1rZgC7gGejSEq5g2ZBE6KaF+TvTi3VzgxB/XfI9rWZn8swzGXI9cDd+OWPZtxIbInfUC6m7kIWO2dT9J6gJ8GHoymSBntBJtB3EJaVv8+3DS4tlyBnOo+rKAhzDkZVdBQGh5DNsbq5sWjEGZlPa+goRSEC0Zfo7dg9Jmn408UN2dohk7WIf/xceKFSlrhbzldSE1DKX7+hvabcpj7/o6iFhXCDKedunIAeBP5gJypIULLZW1EvgMVuUzbLb6GAeBGLSEafEJJBlGPxbgX0kxXtM1wZeMCyjvNnEBqW5lagIbL2hycl8FdZdRuV0qYQPMzcLiqIkkYSkmuL3UPWYNM2HwGN9sqC3PIdY6lwJVKWpKQvfyp+eg2uBipMcpCVBkIZzG7dOU0xf8JqKSzwJQuawyZsNlNvmAqwlBKX+Ylvk3+1M0Cp+vKaUqznxHsC8Lk/7d05bRFGEpZnqLSVC5rIzL5P0zoLyO+Sx1AZnRVnueQWazdpLmlJvwFor6abY2Ru6ytylo6YQv5/t9rlLUUzjnAJdoiumAEuYnPMAzDMAzDMAzDMAzDMAzDMAzD6IH/AHiBs4jYg7WwAAAAAElFTkSuQmCC";
  //Base64ImageDataToFile(iconBase64, __dirname+'/tba.png');
  //const result = await ThumbImageGen(__dirname+'/avatar.jpg', __dirname+'/avatar_thumb.jpg', 40, 40);
  //console.log('ThumbImageGen result', result);
  //UserPaymentDirInit('abcdefg');
//})();

module.exports = {
  Base64ImageDataToFile,
  ThumbImageGen,
  ImageCrop,
  UserPaymentBaseDirGet,
  UserPaymentHdDirGet,
  UserPaymentThumbDirGet,
  UserPaymentWebHdDirGet,
  UserPaymentWebThumbDirGet,
  UserPaymentDirInit,
  ImageFileRemove,
};

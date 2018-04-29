var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk')
AWS.config.update({ region: 'ap-northeast-1' })
var s3 = new AWS.S3();
var rekognition = new AWS.Rekognition()

/* GET write description. */
router.get('/', async function(req, res, next) {
  var params = {
    Bucket: 'ebainternshiprekognitionimage',
    Prefix: 'img',
  }
  s3.listObjects(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      //console.log(data)
      let imgCnt = Object.keys(data.Contents).length
      console.log("Image count: ", imgCnt)
      let rngImg = data.Contents[Math.floor(Math.random() * imgCnt)].Key
      console.log("Random Image: ", rngImg)
      let rekogInfo = await rekog(rngImg)
      console.log(rekogInfo)
      console.log(rekogInfo.Labels)
      let imgInfo = {
        Key: rngImg,
        Labels: rekogInfo.Labels
      }
      res.send(rngImg)
    }
  })
})

const rekog = async (imageName) => {
  var params = {
    Image: {
      S3Object: {
        Bucket: 'ebainternshiprekognitionimage',
        Name: imageName
      }
    },
    MaxLabels: 123,
    MinConfidence: 50
  }
  await rekognition.detectLabels(params, function(err, data) {
    if (err) console.log(err, err.stack)
    else {
      console.log(data)
      return data
    }
  })
}

module.exports = router;
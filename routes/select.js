var express = require('express');
var router = express.Router();
var fs = require('fs');

var AWS = require('aws-sdk')
AWS.config.update({ region: 'ap-northeast-1' })
var s3 = new AWS.S3();
var ddb = new AWS.DynamoDB
var rekognition = new AWS.Rekognition()

var filejson = JSON.parse(fs.readFileSync('./secret/newfilenames.json'))

var keyLabel = ["Car", "Tree", "Building"]

router.get('/', async (req, res) => {
  let urllink = 'https://s3-ap-northeast-1.amazonaws.com/ebainternshiprekognitionimage/img/';
  let correctIncorrect = getRandom(keyLabel, 2)
  console.log('YES', correctIncorrect[0])
  console.log('NO', correctIncorrect[1])
  let params = {
    ExpressionAttributeValues: {
      ":v1": {
        S: correctIncorrect[0]
       },
       ":v2": {
         N: "85"
       }
     },
    KeyConditionExpression: "label = :v1",
    FilterExpression: "confidence >= :v2",
    TableName: "image-label"
  }
  let imageCount = Math.floor(Math.random() * 4) + 1

  let queryPromise = ddb.query(params).promise()
  let dataRaw = await queryPromise;
  let dataItems = dataRaw.Items

  let itemRandomArray = getRandom(dataItems, imageCount)
  let imageRandomArray = itemRandomArray.map((obj) => {
    return (Object.values(obj.image))
  }).reduce(function(prev, curr) {
    return prev.concat(curr);
  })

  let filenames = filejson.Images;
  let imageSecond = getRandom(filenames, 9-imageCount).map((name) => {
    return {"image": { S: name} }
  })
  console.log(imageSecond)
  params = {
    RequestItems: {
      "image-rekog": {
        Keys: imageSecond
      }
    }
  }
  let batchGetItemPromise = ddb.batchGetItem(params).promise()
  let dataSecondRaw = await batchGetItemPromise
  let dataSecond = dataSecondRaw.Responses['image-rekog']
  console.log(dataSecond)

  let imageWrongArray = []
  for (let i=0; i < dataSecond.length; i++) {
    let wrong = true
    for (let j=0; j < dataSecond[i].rekog.L.length; j++) {
      let label = dataSecond[i].rekog.L[j].M 
      if (label.Name.S === correctIncorrect[0] && label.Confidence.N > 75) {
        wrong = false
        break
      }
    }
    if (wrong) imageWrongArray.push(dataSecond[i].image.S)
    else imageRandomArray.push(dataSecond[i].image.S)
  }
  let linkRandomArray = imageRandomArray.map((name) => {
    return urllink + name
  })
  let linkWrongArray = imageWrongArray.map((name) => {
    return urllink + name
  })
  console.log('CORRECT' ,linkRandomArray)
  console.log('WRONG', linkWrongArray)

  res.send({Correct:linkRandomArray, Wrong:linkWrongArray})
  //res.render('select', {imageRandomArray})
})

function getRandom(arr, n) {
  var result = new Array(n),
      len = arr.length,
      taken = new Array(len);
  if (n > len)
      throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
      var x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

module.exports = router;
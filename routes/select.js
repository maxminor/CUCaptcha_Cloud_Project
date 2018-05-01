var express = require('express');
var router = express.Router();
var fs = require('fs');

var AWS = require('aws-sdk')
AWS.config.update({ region: 'ap-northeast-1' })
var s3 = new AWS.S3();
var ddb = new AWS.DynamoDB
var rekognition = new AWS.Rekognition()

var filejson = JSON.parse(fs.readFileSync('./secret/newfilenames.json'))

var keyLabel = ["Car", "Building"]

router.get('/', async (req, res) => {
  let urllink = 'https://s3-ap-northeast-1.amazonaws.com/ebainternshiprekognitionimage/img/';
  let correctIncorrect = getRandom(keyLabel, 2)
  console.log('YES', correctIncorrect[0])
  console.log('NO', correctIncorrect[1])

  //Getting correct image
  let params = {
    ExpressionAttributeValues: {
      ":v1": {
        S: correctIncorrect[0]
       },
       ":v2": {
         N: "80"
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

  //Getting wrong image
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
      if (label.Name.S === correctIncorrect[0] && label.Confidence.N > 80) {
        wrong = false
        break
      }
    }
    if (wrong) imageWrongArray.push(dataSecond[i].image.S)
    else imageRandomArray.push(dataSecond[i].image.S)
  }

  //Parsing url
  let linkRandomArray = imageRandomArray.map((name) => {
    return { link: urllink + name, haveLabel: true } 
  })
  let linkWrongArray = imageWrongArray.map((name) => {
    return { link: urllink + name, haveLabel: false }
  })
  console.log('CORRECT' ,linkRandomArray)
  console.log('WRONG', linkWrongArray)
  let images = (linkRandomArray.concat(linkWrongArray))
  res.render('select', { images: shuffle(images), object: correctIncorrect[0]})
})

router.post('/', async (req, res) => {
  let questionData = JSON.parse(req.body.question).map((obj) => {
    return (obj.haveLabel)
  })
  let pass = true
  let answerData = Object.keys(req.body)
  for (let i=0; i<9; i++) {
    if(questionData[i] === true && !answerData.includes(i.toString())) {
      console.log("me ta mai tob ", i)
      pass = false
    }
    if(questionData[i] === false && answerData.includes(i.toString())) {
      console.log("mai me tae tob", i)
      pass = false
    }
  }
  if (pass) res.render('writeResult')
  else res.redirect(req.baseUrl)
  //res.send(req.body)
  //res.send(questionData)
})

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
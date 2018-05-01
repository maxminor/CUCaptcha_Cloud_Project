var express = require('express');
var router = express.Router();
var fs = require('fs');

var AWS = require('aws-sdk')
AWS.config.update({ region: 'ap-northeast-1' })
var s3 = new AWS.S3();
var rekognition = new AWS.Rekognition()

const filejson = JSON.parse(fs.readFileSync('./secret/newfilenames.json'))
const urllink = 'https://s3-ap-northeast-1.amazonaws.com/ebainternshiprekognitionimage/img/';


function getRandomFilename() {
  let filenames = filejson.Images;
  return (filenames[Math.floor(Math.random() * filenames.length)])
}

router.get('/', (req, res) => {
  

  //console.log(filenames);

  let file = getRandomFilename();

  console.log(file);

  fullurllink = urllink + file;

  res.render('write', {imageurl: fullurllink, imageName: 'img/' + file});  
});



router.post('/', async(req, res) => {
  console.log(req.body);

  //subject to change
  const {imageName, answer1, answer2, answer3} = req.body;

  var params = {
    Image: {
      S3Object: {
        Bucket: 'ebainternshiprekognitionimage',
        Name: imageName
      }
    },
    MaxLabels: 123,
    MinConfidence: 50
  };

  try {
    const detectLabelsPromise = rekognition.detectLabels(params).promise();
    let data = await detectLabelsPromise;

    let labelresults = data.Labels.map((obj) => {
        return (obj.Name.toLowerCase());
      });

    console.log(labelresults);
    //loop though the result
    if (labelresults.includes(answer1.toLowerCase()) && labelresults.includes(answer2.toLowerCase()) && labelresults.includes(answer3.toLowerCase())) {
      res.render('writeResult');
    } else {
      let file = getRandomFilename();
      fullurllink = urllink + file;

      res.render('write', {imageurl: fullurllink, imageName: 'img/' + file, err : "Your description doesn't match what we find in the image, please try again"})
    }

  } catch (e) {
    console.log(e);
  }
});



  

// /* GET write description. */
// router.get('/', async function(req, res, next) {
//   var params = {
//     Bucket: 'ebainternshiprekognitionimage',
//     Prefix: 'img',
//   }
//   s3.listObjects(params, function(err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else {
//       //console.log(data)
//       let imgCnt = Object.keys(data.Contents).length
//       console.log("Image count: ", imgCnt)
//       let rngImg = data.Contents[Math.floor(Math.random() * imgCnt)].Key
//       console.log("Random Image: ", rngImg)
//       let rekogInfo = await rekog(rngImg)
//       console.log(rekogInfo)
//       console.log(rekogInfo.Labels)
//       let imgInfo = {
//         Key: rngImg,
//         Labels: rekogInfo.Labels
//       }
//       res.send(rngImg)
//     }
//   })
// })

// const rekog = async (imageName) => {
//   var params = {
//     Image: {
//       S3Object: {
//         Bucket: 'ebainternshiprekognitionimage',
//         Name: imageName
//       }
//     },
//     MaxLabels: 123,
//     MinConfidence: 50
//   }
//   await rekognition.detectLabels(params, function(err, data) {
//     if (err) console.log(err, err.stack)
//     else {
//       console.log(data)
//       return data
//     }
//   })
// }

module.exports = router;
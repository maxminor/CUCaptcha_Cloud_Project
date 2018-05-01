var express = require('express');
var router = express.Router();
var fs = require('fs');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });
var s3 = new AWS.S3();
var rekognition = new AWS.Rekognition();



const filejson = JSON.parse(fs.readFileSync('./secret/newfilenames.json'))
const urllink = 'https://s3-ap-northeast-1.amazonaws.com/ebainternshiprekognitionimage/img/';


function getRandomFilename() {
  let filenames = filejson.Images;
  return (filenames[Math.floor(Math.random() * filenames.length)])
}


async function awsDetectLabelNames(filename, maxLabel, minConfidence) {
  const params = {
    Image: {
      S3Object: {
        Bucket: 'ebainternshiprekognitionimage',
        Name: filename,
      }
    },
    MaxLabels: maxLabel,
    MinConfidence: minConfidence,
  }

  const detectLabelsPromise = rekognition.detectLabels(params).promise();
  let data = await detectLabelsPromise

  let labelresults = data.Labels.map((obj) => {
    return(obj.Name.toLowerCase());
  });

  return labelresults
}

router.get('/', (req, res) => {
  //console.log(filenames);

  let file = getRandomFilename();

  console.log(file);

  fullurllink = urllink + file;

<<<<<<< HEAD
//});
=======
  res.render('write', {imageurl: fullurllink, imageName: 'img/' + file});  
});
>>>>>>> 400845971241e79831a3e652bc389834b16eddbc



router.post('/', async(req, res) => {
  console.log(req.body);

  //subject to change
  const {imageName, answer1, answer2, answer3} = req.body;

  let labelresults = await awsDetectLabelNames(imageName, 100, 50).catch((error) => console.log(error));

  if (labelresults.includes(answer1.toLowerCase()) && labelresults.includes(answer2.toLowerCase()) && labelresults.includes(answer3.toLowerCase())) {
    res.render('writeResult');
  } else {
    let file = getRandomFilename();
    fullurllink = urllink + file;

    res.render('write', {
      imageurl: fullurllink,
      imageName: 'img/' + file,
      err: "Your description doesn't match what we find in the image, please try again"
    });
  }
  
});


module.exports = router;
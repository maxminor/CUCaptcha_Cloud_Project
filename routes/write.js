var express = require('express');
var router = express.Router();
var fs = require('fs');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });
var s3 = new AWS.S3();
var rekognition = new AWS.Rekognition();

var vision = require('@google-cloud/vision');
const visionconfig = {
  projectId: 'cloudproject2017-201908',
  keyFilename : './secret/googlecloudproject2018.json'
}
const visionclient = new vision.ImageAnnotatorClient(visionconfig);

const filejson = JSON.parse(fs.readFileSync('./secret/newfilenames.json'))
const urllink = 'https://s3-ap-northeast-1.amazonaws.com/ebainternshiprekognitionimage/img/';


function getRandomFilename() {
  let filenames = filejson.Images;
  return (filenames[Math.floor(Math.random() * filenames.length)]);
}


async function googleDetectLabelNames(fileurl, minConfidence) {
  let results = await visionclient.labelDetection(fileurl);

  let labels = results[0].labelAnnotations;

  let filteredlabels = labels.filter(obj => obj.topicality >= minConfidence);

  let labelname = filteredlabels.map((obj) => {
    return(obj.description.toLowerCase());
  });

  return labelname;
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

  res.render('write', {imageurl: fullurllink, imageName: 'img/' + file});  
});



router.post('/', async(req, res) => {
  console.log(req.body);

  //subject to change
  const {imageUrl, imageName, answer1, answer2, answer3} = req.body;
 

  let awslabelresults = await awsDetectLabelNames(imageName, 100, 50).catch((error) => console.log(error));
  let googlelabelresults = await googleDetectLabelNames(imageUrl, 0.5).catch((error) => console.log(error));

  //union between 2 lists
  let labelresults = [...new Set([...awslabelresults,...googlelabelresults])];
  
  let answers = new Set([answer1,answer2,answer3]);

  let correctcount = 0;
  
  console.log(labelresults);

  for(let i=0;i<labelresults.length;i++){
    if(answers.has(labelresults[i])) correctcount++;
    if(correctcount >= 2) break;
  }

  if (correctcount >=2) {
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
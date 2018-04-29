var fs = require('fs');

var readjson = JSON.parse(fs.readFileSync('./secret/filenames.json','utf8'));


var filelist = readjson.Images;

var newlist = filelist.map((obj) => {
    return(obj.Name);
});


var jsonstring = JSON.stringify({"Images" : newlist});
fs.writeFileSync('./secret/newfilenames.json', jsonstring,'utf-8');
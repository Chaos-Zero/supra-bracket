const path = require("path");
var request = require("request"),
  http = require("http"),
  https = require("https");

async function GetYtThumb(urls) {
  var formattedUrls = [];
  urls.forEach((url) => {
    var n = url.lastIndexOf("/");
    var ytVideoId = url.substring(n + 1);

    if (ytVideoId.includes("world")) {
      var n = url.lastIndexOf("=");
      ytVideoId = ytVideoId.substring(n + 1);
    }

    //let thumb = "https://i1.ytimg.com/vi/" + ytVideoId + "/maxresdefault.jpg";
    let thumb = "https://i1.ytimg.com/vi/" + ytVideoId + "/maxres2.jpg";
    
    formattedUrls.push(thumb)
  });
  //Example of usage:
  console.log(formattedUrls);
  return formattedUrls;
}


async function downloadImages(urls, singleImage = false) {
  return new Promise(async (resolve) => {
    youtubeImages = await GetYtThumb(urls);
    //  "https://youtu.be/49mVLN8OJSo",
    //  "https://youtu.be/uRbDCEJ23WI",
    //  "https://youtu.be/-AOW64B2bnY",
    //]);

    let inputPath = "/app/public/commands/gif/input/";
    console.log(inputPath);

    if (!singleImage) {
      readdirAsync(inputPath, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          unlink(path.join(inputPath, file), (err) => {
            if (err) throw err;
          });
        }
      });
    }

    var index = 0;
    if (singleImage !== false) {
      index = singleImage;
    }
    youtubeImages.forEach(function (image) {
      //console.log("HERE: " + image);
      downloadImage(image, inputPath + index + ".jpg");
      index += 1;
    });

    resolve();
  });
}

async function downloadImage(uri, filename, callback) {
  var client = http;
  if (uri.toString().indexOf("https") === 0) {
    client = https;
  }

  client
    .request(uri, function (response) {
      var data = new Stream();

      response.on("data", function (chunk) {
        data.push(chunk);
      });

      response.on("end", function () {
        writeFileSync(filename, data.read());
      });
    })
    .end();
  console.log("File downloaded");
}
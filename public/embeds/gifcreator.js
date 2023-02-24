const GIFEncoder = require("gif-encoder-2");
const { createCanvas, Image } = require("canvas");
const {
  writeFileSync,
  readFileSync,
  createWriteStream,
  readdir,
  unlink,
} = require("fs");
const { promisify } = require("util");


eval(readFileSync("./public/embeds/imagebuilder.js") + "");

var Stream = require("stream").Transform;
const path = require("path");
var request = require("request"),
  http = require("http"),
  https = require("https");



const readdirAsync = promisify(readdir);
const imagesFolder = path.join(__dirname, "./gif/input");
const dstPath = path.join(__dirname, "./gif/output");

async function createGif(algorithm, interaction) {
  // Delete Previous Gif
  readdirAsync(dstPath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      unlink(path.join(dstPath, file), (err) => {
        if (err) throw err;
      });
    }
  });

  // Discord caches images so we have to change the name each day
  // Just going to use the date
  const d = new Date();
  let imagename = d.toISOString().slice(0, 10);

  return new Promise(async (resolve1) => {
    // read image directory
    const files = await readdirAsync(imagesFolder);

    // find the width and height of the image
    const [width, height] = await new Promise((resolve2) => {
      const image = new Image();
      image.onload = () => resolve2([image.width, image.height]);
      image.src = path.join(imagesFolder, files[0]);
    });
    // base GIF filepath on which algorithm is being used
    const dstPath = path.join(__dirname, "./gif/output/", "test2" + `.gif`);

    //const dstPath = path.join(__dirname, "./gif/output/", imagename + `.gif`);
    // create a write stream for GIF data
    const writeStream = createWriteStream(dstPath);
    // when stream closes GIF is created so resolve promise
    writeStream.on("close", () => {
      resolve1();
    });

    const encoder = new GIFEncoder(width, height, algorithm, true);
    // pipe encoder's read stream to our write stream
    encoder.createReadStream().pipe(writeStream);
    encoder.start();
    encoder.setDelay(2000);
    encoder.setRepeat(20);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // draw an image for each file and add frame to encoder
    for (const file of files) {
      await new Promise((resolve3) => {
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0);
          encoder.addFrame(ctx);
          resolve3();
        };
        image.src = path.join(imagesFolder, file);
      });
    }
    encoder.finish();
    console.log("gif created");
  });
}

async function downloadImages(urls) {
  var youtubeImages = await GetYtThumb(urls);
  //  "https://youtu.be/49mVLN8OJSo",
  //  "https://youtu.be/uRbDCEJ23WI",
  //  "https://youtu.be/-AOW64B2bnY",
  //]);
  
  var index = 0;
  youtubeImages.forEach(function (image) {
    //console.log("HERE: " + image);
    downloadImage(image, "./public/commands/gif/input/" + index + ".jpg");
    index += 1;
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

//createGif('neuquant')

//var encoder = new GIFEncoder();
//encoder.setRepeat(0);
//encoder.setDelay(100);
//encoder.start();
//encoder.addFrame(document.getElementById('img1'));
//encoder.addFrame(document.getElementById('img2'));
//encoder.addFrame(document.getElementById('img3'));
//encoder.finish();
//var binary_gif = encoder.stream().getData();
//var data_url = 'data:image/gif;base64,'+encode64(binary_gif);

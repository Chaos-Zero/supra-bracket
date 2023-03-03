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

const fs = require("fs");

eval(fs.readFileSync("./public/database/read.js") + "");
eval(fs.readFileSync("./public/database/write.js") + "");
eval(fs.readFileSync("./public/database/setup.js") + "");

eval(fs.readFileSync("./public/embeds/dailymessages.js") + "");
eval(fs.readFileSync("./public/utils/messageutils.js") + "");
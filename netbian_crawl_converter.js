const jQuery = require("./lib/jquery-3.2.1");
const { add2jQuery } = require("./lib/jQuery_e_ajax");
add2jQuery(jQuery);
const Wait_all_finish = require("./lib/wait_all_finish");
const http = require("http");
const fs = require("fs");
const path = require("path");

// const pictures = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "./picture.json"), { encoding: "utf8" })
// );
// pictures["全部"] = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "./picture_all.json"), {
//     encoding: "utf8"
//   })
// )["全部"];

// let keys = Object.keys(pictures);

// for (let k of keys) {
//   if ("全部" === k) continue;
//   pictures[k].forEach(function(e0) {
//     for (let i = 0; i < pictures["全部"].length; ++i) {
//       if (pictures["全部"][i][1] === e0[1]) pictures["全部"].splice(i, 1);
//     }
//   });
// }

const pictures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./picture_converted.json"), {
    encoding: "utf8"
  })
);
let keys = Object.keys(pictures);

function async_loop(array, proccess, callback) {
  let len = array.length;
  let index = 0;
  !callback && (callback = function() {});

  function _loop() {
    if (index >= len) return callback();
    proccess(index, function() {
      ++index;
      _loop();
    });
  }
  _loop();
}

async_loop(
  keys,
  function(index, done) {
    let i = 0;
    function _loop() {
      if (i >= pictures[keys[index]].length) return done();

      while ("/" !== pictures[keys[index]][i][1][0]) {
        ++i;
        if (i >= pictures[keys[index]].length) return setTimeout(_loop, 0);
      }

      let url = "http://www.netbian.com" + pictures[keys[index]][i][1];

      // const file = fs.createWriteStream('file.jpg');
      // const request = http.get('http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg', function(response) {
      //   response.pipe(file);
      // });

      var oReq = new XMLHttpRequest();
      oReq.open("GET", url);
      oReq.responseType = "arraybuffer";
      oReq.timeout = 5000; // time in milliseconds
      oReq.addEventListener("timeout", _loop);
      oReq.addEventListener("error", _loop);
      oReq.addEventListener("load", function(oEvent) {
        if (200 !== oReq.status) {
          debugger;
          return _loop();
        }
        let response = oReq.response;
        let dataView = new DataView(response);
        let decoder = new TextDecoder("gbk");
        let decodedString = decoder.decode(dataView);
        let img_url = decodedString.match(
          /<div class="pic"><p><a[^<]+<img src="([^"]+)"/
        );
        if (!img_url) {
          console.log(url, "Not fount url!");
          pictures[keys[index]].splice(i, 1);
          return setTimeout(_loop, 100);
        }
        img_url = img_url[1];
        pictures[keys[index]][i][1] = img_url;
        ++i;
        setTimeout(_loop, 100);
      });
      oReq.send(null);
    }
    _loop();
  },
  function() {
    fs.writeFileSync(
      path.join(__dirname, "./picture_converted.json"),
      JSON.stringify(pictures)
    );
    console.log("All finished!");
  }
);

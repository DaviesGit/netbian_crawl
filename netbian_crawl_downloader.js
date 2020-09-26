const jQuery = require("./lib/jquery-3.2.1");
const { add2jQuery } = require("./lib/jQuery_e_ajax");
add2jQuery(jQuery);
const Wait_all_finish = require("./lib/wait_all_finish");
const http = require("http");
const fs = require("fs");
const path = require("path");

const pictures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./picture_converted.json"), {
    encoding: "utf8"
  })
);

let keys = Object.keys(pictures);

keys.forEach(function(k) {
  let dir = path.join(__dirname, "download", k);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

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

let index = 0;

function get_next_info() {
  let current_index = 0;
  outer: for (let k of keys) {
    let key, info;
    let filename;
    key = k;
    do {
      if (pictures[k].length <= index - current_index) {
        current_index += pictures[k].length;
        continue outer;
      }
      info = pictures[k][index++ - current_index];
      filename = path.join(
        __dirname,
        "download",
        key,
        info[0] + path.extname(info[1])
      );
    } while (
      fs.existsSync(filename) &&
      fs.statSync(filename).size >= 50 * 1024
    );
    return {
      key: key,
      info: info
    };
  }
  return null;
}

function _loop(key, info) {
  if (!key) {
    let next = get_next_info();
    if (!next) return console.log("all finished!");
    key = next.key;
    info = next.info;
  }
  let url = info[1];
  let filename = path.join(
    __dirname,
    "download",
    key,
    info[0] + path.extname(url)
  );

  const file = fs.createWriteStream(filename);
  const request = http
    .get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"
        },
        family: 6
        // timeout:3*1000,
      },
      function(response) {
        response
          .on("end", function() {
            if (response.aborted) return;
            if (200 !== response.statusCode) return;
            word.value = info[0];
            setTimeout(function() {
              file.end();
              _loop();
            }, 0);
          })
          .on("error", function(err) {
            console.log("Got error: " + err.message);
            setTimeout(function() {
              file.end();
              _loop(key, info);
            }, 0);
          });
        if (200 === response.statusCode) response.pipe(file);
        else if (404 === response.statusCode)
          return setTimeout(function() {
            file.end();
            _loop();
          }, 0);
        else {
          console.log(info, "Failed!");
          request.abort();
        }
      }
    )
    .on("error", function(e) {
      if ("ECONNRESET" === e.code) return;
      setTimeout(function() {
        file.end();
        _loop(key, info);
      }, 0);
    })
    .on("close", function(e) {})
    .on("abort", function(e) {
      setTimeout(function() {
        file.end();
        _loop(key, info);
      }, 0);
    });
  request.setTimeout(5 * 1000, function() {
    request.abort();
  });
}

_loop();
_loop();
_loop();
_loop();
_loop();

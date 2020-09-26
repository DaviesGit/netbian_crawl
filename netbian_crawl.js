const jQuery = require("./lib/jquery-3.2.1");
const { add2jQuery } = require("./lib/jQuery_e_ajax");
add2jQuery(jQuery);
const Wait_all_finish = require("./lib/wait_all_finish");


// const urls = {
//   风景: "http://www.netbian.com/fengjing/index_225.htm",
//   唯美: "http://www.netbian.com/weimei/index_73.htm",
//   可爱: "http://www.netbian.com/keai/index_60.htm",
//   花卉: "http://www.netbian.com/huahui/index_54.htm",
//   动物: "http://www.netbian.com/dongwu/index_54.htm",
//   非主流: "http://www.netbian.com/feizhuliu/index_26.htm",
// };

const urls = {
	全部: "http://www.netbian.com/index_1290.htm",
};

let keys = Object.keys(urls);

const pictures = {};
keys.forEach(function(k) {
  pictures[k] = [];
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

async_loop(
  keys,
  function(index, done) {
    let url = urls[keys[index]];
    let base_url = url.match(/http:\/\/www.netbian.com(\/\w+)?\//)[0];
    let end = +url.match(/index_(\d+)/)[1];
    let i = 1;
    function _loop() {
	if(i>end)
	return done();
      var oReq = new XMLHttpRequest();
      oReq.open(
        "GET",
        1 === i ? base_url : base_url + "index_" + i + ".htm"
	  );
	  oReq.responseType = "arraybuffer";
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
		let imgs=decodedString.match(/<a href="(\/desk\/\d+.htm)" title="([^"]*)"/g);
		if(!imgs) debugger;
		console.log(imgs.length);
		imgs.forEach(function(img){
			img=img.match(/<a href="(\/desk\/\d+.htm)" title="([^"]*)"/);
			pictures[keys[index]].push([img[2],img[1]]);
		});
		++i;
		setTimeout(_loop,100);
      });
      oReq.send(null);
    }
    _loop();
  },
  function() {
    console.log("All finished!");
  }
);

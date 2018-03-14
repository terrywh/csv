"use strict";

const http = require("http"),
	url = require("url");

// 访问有道词典，返回一段简单的单次解释
exports.youdao = async function(word) {
	return new Promise(function(resolve, reject) {
		let opt = url.parse("http://fanyi.youdao.com/openapi.do?keyfrom=neverland&key=969918857&type=data&doctype=json&version=1.1&q=" + encodeURIComponent(word)),
			data = "";
		opt.headers = {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36",
			"Host": "fanyi.youdao.com",
			"Connection": "keep-alive",
		};
		let req = http.request(opt);
		req.setTimeout(5000);
		req.on("response", function(res) {
			res.setEncoding("utf8");
			res.on("data", function(chunk) {
				data += chunk;
			}).on("end", function() {
				try{
					data = JSON.parse(data);
				}catch(err) {
					// data = null;
					reject(err);
					return;
				}
				resolve(data["translation"][0]);
			});
		}).on("timeout", function() {
			req.abort();
		}).on("error", function(err) {
			reject(err);
		});
		req.end();
	});
}
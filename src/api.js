"use strict";
const fs = require("fs"),
	http = require("http"),
	url = require("url");
// 加载所有 API
exports.load = async function(dir) {
	let files = fs.readdirSync(dir);
	for(let file of files) {
		if(file.substr(0, 4) == "api." && file.length > 7) {
			let key = file.substr(4, file.length - 7);
			exports[key] = require(dir + "/" + file);
			if(exports[key].init) {
				await exports[key].init();
			}
		}
	}
}
exports.stop = function() {
	exports.stopped = true;
};
exports.end = async function() {
	for(let key in exports) {
		if(exports[key].end) {
			await exports[key].end();
		}
	}
};
// 基础接口调用
exports.http = function(uri, query, data, timeout, headers) {
	let opts = url.parse(uri);
	opts.headers = Object.assign({}, {"Connection": "Keep-Alive", "Content-Type": "application/x-www-form-urlencoded" }, headers);
	if(typeof data === "object") {
		data = JSON.stringify(data);
		opts.headers["Content-Type"] = "application/json";
	}else if(data && typeof data !== "string") {
		data = data.toString();
	}
	opts.method = data ? "POST" : "GET";
	if(query) {
		opts.path = opts.path + (opts.path.indexOf("?") > -1 ? "&" : "?") + formatQuery(query);
	}
	return new Promise((resolve, reject) => {
		let req = http.request(opts);
		req.setTimeout( timeout || 5000 );
		req.on("response", function(res) {
			let data = "";
			res.setEncoding("utf8")
			res.on("data", function(chunk) {
				data += chunk;
			}).on("end", function() {
				try{
					data = JSON.parse(data)
				}catch(err) {
					reject(err);
					return;
				}
				(!!data.errno || !!data.error) ? reject( new Error(data.errmsg || data.error) ) : resolve(data.data === undefined ? data : data.data);
			});
		})
		.on("timeout", function() {
			req.abort();
		})
		.on("error", reject)
		.end( data );
	});
}

function formatQuery(data, pkey) {
	let formated = ""
	for(let key in data) {
		if(typeof(data[key]) === "object") {
			formated += formatData(data[key], pkey ? pkey + "[" + key + "]" : key)
		}else{
			formated += (pkey ? pkey + "[" + key + "]" : key) + "=" + encodeURIComponent(data[key]) + "&"
		}
	}
	return formated;
}

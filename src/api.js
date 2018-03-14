"use strict";
const fs = require("fs"),
	http = require("http"),
	url = require("url");
// 加载所有 API
exports.load = function(dir) {
	let files = fs.readdirSync(dir);
	files.forEach(function(file) {
		if(file.substr(0, 4) == "api." && file.length > 7) {
			exports[file.substr(4, file.length - 7)] = require(dir + "/" + file);
		}
	});
}
// 基础接口调用
exports.http = function(uri, query, data, timeout) {
	let opts = url.parse(uri);
	opts.headers = {"Connection": "Keep-Alive", "Content-Type": "application/x-www-form-urlencoded" };
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

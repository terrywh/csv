#!/usr/bin/env node
"use strict";

global.api = {};
let argv = require("minimist")(process.argv.slice(2));

// 加载所有 API
function loadApi(dir) {
	let files = require("fs").readdirSync(dir);
	files.forEach(function(file) {
		if(file.substr(0, 4) == "api.") {
			api[file.substr(4, file.length - 7)] = require(dir + "/" + file);
		}
	});
}
loadApi(__dirname); // 系统提供的 API 
loadApi(process.cwd()); // 加载用户用户当前目录中的 API

try{
	let r = require("vm").runInThisContext(argv._);

	if(r instanceof Promise) {
		r.then(console.log, console.error);
	}else{
		console.log(r);
	}
}catch(err) {
	console.error(err.stack);
}
#!/usr/bin/env node
"use strict";

global.api = require("api.js");
// 加载所有 API
api.load(__dirname); // 系统提供的 API 
api.load(process.cwd()); // 加载用户用户当前目录中的 API

let argv = require("minimist")(process.argv.slice(2));
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
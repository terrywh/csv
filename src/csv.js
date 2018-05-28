#!/usr/bin/env node
"use strict";

const source = require("./source.js"),
	output = require("./output.js"),
	parser = require("./parser.js");

async function run() {
	global.api = require("./api.js");
	// 加载所有 API
	await api.load(__dirname); // 系统提供的 API 
	await api.load(process.cwd()); // 加载用户用户当前目录中的 API
	
	while(true) {
		let row = await source.next(), out, con = true;
		if(row === null) {
			break;
		}
		out = new Map();
		try{
			con = await parser.parse(api, row, out);
		}catch(err) {
			output.failure(err);
			continue;
		}
		output.success(out);
		if(con === false) break; // 主动结束
	}
	await output.finish();
	await api.end();
}

run();

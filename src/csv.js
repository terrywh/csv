#!/usr/bin/env node
"use strict";

const fs = require("fs"),
	path = require("path"),
	csv = require("csv-parse");


// 1. 确认是否存在和使用 HEADER 
let input = {
		argv: require("minimist")(process.argv.slice(2)),
		source: null,
		parser: null,
	},
	// parser = require(argv._),
	summary = {
		total:   0,
		success: 0,
		failure: 0,
	},
	output = {
		target: (input.argv.o || input.argv.output) || process.stdout,
		write: function(data) {
			output.target.cork();
			let i = 0;
			for(let item of data) {
				if(++i > 1) {
					output.target.write(",")
				}
				if(typeof(item) === "undefined") { 
					output.target.write('""');
				}else if(typeof(item) == "string") {
					output.target.write('"' + item + '"')
				}else if(typeof(item) == "number") {
					output.target.write(item.toString());
				}else{
					output.target.write('"' + item.toString() + '"');
				}
			}
			output.target.write("\n");
			output.target.uncork();
		},
		success: function(m) {
			++ summary.total;
			if(m instanceof Map) {
				++ summary.success;
			}else{
				++ summary.failure;
				return;
			}
			if(summary.total == 1) {
				output.write(m.keys());
			}
			output.write(m.values());
		},
		failure: function(err) {
			++ summary.total;
			++ summary.failure;
		},
		finish: function() {
			process.stderr.cork();
			process.stderr.write("success: ");
			process.stderr.write(summary.success.toString());
			process.stderr.write(" failure: ");
			process.stderr.write(summary.failure.toString());
			process.stderr.write(" total: ");
			process.stderr.write(summary.total.toString());
			process.stderr.write("\n");
			process.stderr.uncork();
		}
	}, api = {}, parser;

// 加载所有 API
function loadApi(dir) {
	let files = fs.readdirSync(dir);
	files.forEach(function(file) {
		if(file.substr(0, 4) == "api.") {
			api[file.substr(4, file.length - 7)] = require(dir + "/" + file);
		}
	});
}
loadApi(__dirname); // 系统提供的 API 
loadApi(process.cwd()); // 加载用户用户当前目录中的 API
// 确认源文件处理程序可用
(function inputFile() {
	let stat0 = null, stat1 = null, opts;
	try{
		stat0 = fs.statSync(input.argv._[0]);
	}catch(err){
		stat0 = null;
	}
	try{
		stat1 = fs.statSync(input.argv._[1]);
	}catch(err){
		stat1 = null;
	}
	if(!stat0 || !stat0.isFile() || !stat1 || !stat1.isFile()) {
		process.stderr.write("error: failed to open input/parser file\n");
		process.exit();
		return;
	}
	input.source = input.argv._[0].substr(-3) == '.js' ? input.argv._[1] : input.argv._[0];
	opts = {
		delimiter: (input.argv.d || input.argv.delimiter) || ",",
		quote: (input.argv.q || input.argv.quote) || '"',
		escape: (input.argv.q || input.argv.quote) || '"',
		rowDelimiter: (input.argv.r || input.argv["row-delimiter"]) || undefined,
		skip_empty_lines: true,
	};
	switch(opts.delimiter) {
		case "\\t": opts.delimiter = "\t"; break;
		case "\\0": opts.delimiter = "\0"; break;
	}
	input.source = fs.createReadStream(input.source).pipe(csv(opts));
	input.parser = input.argv._[0].substr(-3) == '.js' ? input.argv._[0] : input.argv._[1];
	if(path.isAbsolute(input.parser)) {
		input.parser = require(input.parser);
	}else{
		input.parser = require(path.resolve(process.cwd(), input.parser));
	}
	if(typeof input.parser !== "function") {
		process.stderr.write("error: parser is not valid\n");
		process.exit();
		return;
	}
})();
(function() {
	let executing = null;
	input.source.on("data", function(data) {
		input.source.pause();
		if(input.argv.header) {
			input.argv.header = null;
			input.header = data;
			input.source.resume();
			return;
		}
		if(input.header) {
			let rdata = {};
			for(let i=0;i<input.header.length;++i) {
				rdata[input.header[i]] = data[i];
				rdata[i] = data[i];
			}
			data = rdata;
		}
		try{ // 调用出现错误
			let p = new Map();
			executing = input.parser(api, data, p);
			if(executing instanceof Promise) { // 异步函数
				executing = executing.then(function() {
					output.success(p);
					input.source.resume();
				}).catch(function(err) {
					console.error(err.stack)
					output.failure();
					input.source.resume();
				});
			}else{ // 同步函数认为成功
				output.success(p);
				input.source.resume();
			}
		}catch(err){
			output.failure(err);
			input.source.resume();
		}
	}).on("end", function() {
		if(executing instanceof Promise) {
			executing.then(function() {
				output.finish();
			});
		}
	}).on("error", function(err) {
		process.stderr.write(err.message);
		process.stderr.write("\n");
		debugger;
	});
})();
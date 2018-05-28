"use strict";

let fs = require("fs"),
	argv = require("minimist")(process.argv.slice(2)),
	option = {
		delimiter: (argv.d || argv.delimiter) || ",",
		quote: (argv.q || argv.quote) || '"',
		escape: (argv.q || argv.quote) || '"',
		rowDelimiter: (argv.r || argv["row-delimiter"]) || undefined,
		skip_empty_lines: true,
	};
let source = null;
for(let src of argv._) {
	if(src.substr(-4) == ".csv") {
		try{
			source = fs.createReadStream(src);
		}catch(err) {
			console.error("无法打开数据源文件:", err);
			return;
		}
		break;
	}
}
if(source === null) {
	source = process.stdin;
}

switch(option.delimiter) {
	case "\\t": option.delimiter = "\t"; break;
	case "\\0": option.delimiter = "\0"; break;
}
let parser = require("csv-parse")(option), queue = [], next = null, finished = false;
// 为了实现 promise 形式的异步, 这里使用 next 标志 + queue 队列模拟出等待的过程
parser.on("data", function(row) {
	if(argv.header && !Array.isArray(argv.header)) {
		argv.header = row;
	}else{
		parser.pause();
		if(Array.isArray(argv.header)) {
			for(let i=0;i<row.length;++i) {
				row[argv.header[i]] = row[i];
			}
		}
		if(next) {
			let self = next;
			next = null;
			self(row);
		}else{
			queue.push(row);
		}
	}
}).on("end", function() {
	finished = true;
	if(next) next(null);
}).on("error", function(err) {
	console.error("csv parse failed: ", err);
});
source.pipe(parser);
exports.next = function() {
	return new Promise(function(resolve, reject) {
		if(queue.length > 0) {
			resolve(queue.shift());
			return;
		}
		if(finished) {
			resolve(null);
			return;
		}
		next = resolve;
		parser.resume();
	});
};
exports.end = function() {
	parser.pause();
	source.unpipe(parser);
	parser.end();
};

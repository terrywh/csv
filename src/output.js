"use strict";

let fs = require("fs"),
	argv = require("minimist")(process.argv.slice(2)),
	target = (argv.o || argv.output) || process.stdout;
if(typeof target === "string") {
	try{
		target = fs.createWriteStream(target);
	}catch(err) {
		console.error("无法打开目标输出文件:", err);
		return;
	}
}
function write(data) {
	target.cork();
	let i = 0;
	for(let item of data) {
		if(++i > 1) {
			target.write(",")
		}
		if(typeof(item) === "undefined") { 
			target.write('""');
		}else if(typeof(item) == "string") {
			target.write('"' + item + '"')
		}else if(typeof(item) == "number") {
			target.write(item.toString());
		}else{
			target.write('"' + item.toString() + '"');
		}
	}
	target.write("\n");
	target.uncork();
};
let success = 0, failure = 0, total = 0;
exports.success = function(row, ) {
	++ total;
	++ success;
	if(total == 1) {
		write(row.keys());
	}
	write(row.values());
};
exports.failure = function(err) {
	++ total;
	++ failure;
	process.stderr.cork();
	process.stderr.write("error: ");
	process.stderr.write(err.toString());
	process.stderr.write("\n");
	process.stderr.uncork();
};
exports.finish = function() {
	process.stderr.cork();
	process.stderr.write("success: ");
	process.stderr.write(success.toString());
	process.stderr.write(" failure: ");
	process.stderr.write(failure.toString());
	process.stderr.write(" total: ");
	process.stderr.write(total.toString());
	process.stderr.write("\n");
	process.stderr.uncork();
};

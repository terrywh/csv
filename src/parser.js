"use strict";

let argv = require("minimist")(process.argv.slice(2)),
	path = require("path"),
	parser = null;
	
for(let file of argv._) {
	if(file.substr(-3) == ".js") {
		parser = path.isAbsolute(file) ? require(file) :
			require(process.cwd() + "/" + file);
		break;
	}
}

if(parser === null) {
	console.error("无法打开数据处理程序文件 (*.js) 请检查命令行参数是否正确");
}


exports.parse = function(api, src, out) {
	return parser(api, src, out);
};

"use strict";

// 睡眠一段时间
exports.sleep = function(ms) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, ms);
	});
};
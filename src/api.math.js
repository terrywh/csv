"use strict";

// 返回一个随机数
exports.random = function(min, max) {
	min = min || 0;
	max = max || 65536;
	return parseInt(Math.random() * (max - min) + min);
};
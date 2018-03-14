"use strict";

// 访问有道词典，返回一段简单的单次解释
exports.youdao = async function(word) {
	let data = await api.http("http://fanyi.youdao.com/openapi.do?keyfrom=neverland&key=969918857&type=data&doctype=json&version=1.1", {q: word});
	return data["translation"][0];
}
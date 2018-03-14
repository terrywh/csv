"use strict";

let number = 0;
module.exports = async function(api, src, row) {
	row.set("WORD", src.WORD);
	row.set("RAND", api.math.random());
	row.set("MEANING", await api.dict.youdao(src.WORD));
	await api.time.sleep(1000);
};
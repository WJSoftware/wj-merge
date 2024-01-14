import wjMerge from "wj-merge";
import enUs from './en-us.json' assert { type: 'json' };
import esCr from './es-cr.json' assert { type: 'json' };

/** @type import("wj-merge").MergeResult<typeof enUs, false> */
const translation = await wjMerge()
    .addObject(enUs).name('US English')
    .addObject(esCr).name('Costa Rica Spanish')
    .build(true);

console.log('Translation: %o', translation);
console.log('End.');

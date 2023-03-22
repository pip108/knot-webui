const { writeFileSync } = require("fs");
const { join } = require('path');
const { exit } = require("process");

const knotv_version = process.env.knotv_version;
if (!knotv_version) {
    console.log('process.env.knotv_version not defined');
    exit();
}

const filename = 'knotv_version.json';
const path = join(__dirname, 'src', filename);
const data = { knotv_version: knotv_version };
try {
    console.log(`Trying to write ${path}`);
    writeFileSync(path, JSON.stringify(data));
} catch (e) {
    console.log('failed writing  version info', e.toString());
}
console.log(`Wrote ${path}, contents`, data);
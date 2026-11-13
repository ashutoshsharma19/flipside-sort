// Inlines logic.js + levels.json into a single self-contained dist/index.html
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/index.src.html', 'utf8');
const logic = fs.readFileSync(__dirname + '/logic.js', 'utf8');
const levels = JSON.parse(fs.readFileSync(__dirname + '/levels.json', 'utf8')).map(({ solution, ...l }) => l);
fs.mkdirSync(__dirname + '/dist', { recursive: true });
const out = src.replace('/*LOGIC*/', () => logic).replace('/*LEVELS*/', () => JSON.stringify(levels));
fs.writeFileSync(__dirname + '/dist/index.html', out);
console.log('dist/index.html', out.length, 'bytes');

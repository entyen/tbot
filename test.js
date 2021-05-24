const fs = require('fs')

const tea = fs.readFileSync('config.json', 'utf-8')
const soa = JSON.parse(tea)

console.log(soa.OWNER)


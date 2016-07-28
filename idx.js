'use strict'
const idxIconMap = require('./idx-icon-map.json')
const fs = require('fs')
const iconScssPath = './scss/_icons.scss'
const variablesScssPath = './scss/_variables.scss'
const idxScssPath = './idx/scss/idx.scss'
const spawn = require('child_process').spawn

fs.readFile(iconScssPath, (err, data) => {
    if (err) { throw err; }
    // Convert _variable with unicode function.
    let variableCotnent = fs.readFileSync(variablesScssPath).toString()
    variableCotnent = variableCotnent.replace(/(.+)"\\(f\w{3})";/g, '$1unicode("$2");')
    // Load all fa icons into a map
    let faIconList = data.toString('utf-8').split("\n")
    let cacheKeys = []
    let faIconMap = faIconList
        .filter((line) => line.match(/^\.#{\$fa-.+/))
        .reduce((prev, line) => {
            line = line
                .replace('.#{$fa-css-prefix}', 'fa')
                .replace(':before', '')
            if (line.match(/.+,$/)) {
                cacheKeys.push(line.replace(',',''))
            } else {
                let splitPosition = line.indexOf(' ')
                let key = line.slice(0, splitPosition + 1).trim()
                let content = line.slice(splitPosition, line.length).trim()
                prev[key] = content
                cacheKeys.forEach((cacheKey) => prev[cacheKey] = content)
                cacheKeys = []
            }
            return prev
        }, {})
    // Generate idx.scss content.
    let idxIconList = Object.keys(idxIconMap)
        .map((key) => {
            let faKey = idxIconMap[key]
            return `${key}:before ${faIconMap[faKey]}`
        })
    const scssContent = ['@import "idx-unicode";',  variableCotnent, '@import "idx-icons";'].concat(idxIconList).join('\n')
    fs.writeFile(idxScssPath,  scssContent)
    const sass = spawn('scss', ['idx/scss/idx.scss', 'idx/css/idx-icons.css', '--style=compressed', '--sourcemap=none'])
    // Generate idx.css
    sass.on('close', (code) => {
        if (code !=0 ) {
            console.log(code)
        }
    })
})

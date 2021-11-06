#!/usr/bin/env node

const toml = require('@flourd/toml')
const arg = require('arg')
const path = require('path')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { inspect } = require('util')

const dump = (d) => inspect(d, { colors: true, depth: Infinity })

const args = arg({
  '--input': (file) => {
    let filepath = path.resolve(process.cwd(), file) || path.resolve(__dirname, file)
    if (existsSync(filepath)) return filepath
    else return file
  },
  '--output': (file) => {
    return (String(file).length > 0) ? path.join(process.cwd(), file) : false
  },
  '--json': Boolean,
  '--version': Boolean,
  '--help': Boolean,

  '-h': '--help',
  '-?': '--help',
  '-v': '--version',
  '--usage': '--help',
  '-i': '--input',
  '-o': '--output',
  '-j': '--json'
})

let data, input, output

const isArray = (a) => Array.isArray(a) ? a : [a]
const parse = (value, type = toml) => (type || JSON).parse(readFileSync(value, 'utf-8'))
const toJson = (data) => JSON.stringify(data, null, 2)
const fromJson = (data) => JSON.parse(data)

const read = (value, output = args['--output'], json = args['--json']) => {
  if (!data) data = parse(value, (~value.indexOf('.json') || json) ? JSON : toml)
  if (!output || output.length === 0) {

    console.log((~value.indexOf('.json') || json === false) ? toml.stringify(data) : JSON.stringify(data, null, 2))
  }
}

const write = (value, input = args['--input'], json = args['--json']) => {
  if (!data) data = parse(input)
  output = (~value.indexOf('.json') || json === false)  ? JSON.stringify(data, null, 2) : toml.stringify(data)
  writeFileSync(value, output, 'utf-8')
  if (json) console.log(`TOML (${data.length}B) -> JSON (${output.length}B): ${value}`)
  else console.log(`TOML (${data.length}B) -> TOML (${output.length}B) ${value}`)
}

const showUsage = () => {
  const divider = ('·' + '-·'.repeat(35));  
  console.log(`

  USAGE
 ${divider}
   $ toml [-i|--input] <filename> [options]

  OPTIONS
 ${divider}
   -i, --input		The filename to parse (.toml, relative)
   -o, --output		The target filename to write parsed/modified data to.
   -j, --json		Output as JSON to --output (or stdout if missing)
   -v, --version	Displays current version
   -h, -?, --help	Displays this page

  EXAMPLES
 ${divider}
   # parses to JSON from  wrangler.toml, writes to wrangler.json
   $ toml -i wrangler.toml -o wrangler.json -j
   
   # parses to JSON, prints to stdout (terminal, TTY)
   $ toml wrangler.toml --json

   # parses JSON, writes TOML
   $ toml --input=example.json --output=example.toml
   
   # pretty print JSON by piping to jq
   $ toml example.toml -j | jq .


`);
}

//console.debug('args', args)

Object.keys(args).forEach((key) => {
  let value = args[key]
  switch (key) {
    case '_':
      if (args['--help'] || value.includes('help') || (value.length === 0 && !args['--input'])) {
        return showUsage();
      }
      if (!args['--input']) {
        value = [...isArray(value)]
        const [inFile, outFile] = value
        //console.debug('value', value)
        if (inFile && outFile) {
          write(outFile, inFile, args['--json'])
        } else {
          read(inFile, false, args['--json'])
        }
      }
      break;
    case '--input':
      read(value)
      break;
    case '--output':
      write(value)
      break;
  }
})

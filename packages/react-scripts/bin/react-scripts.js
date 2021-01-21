#!/usr/bin/env node
const spawn = require('cross-spawn')
const args = process.argv.slice(2)
const script = args[0]
spawn.sync(
  process.execPath,
  [require.resolve('../scripts/' + script)],
  { stdio: 'inherit' }
)

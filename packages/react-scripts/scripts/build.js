process.env.NODE_ENV = 'production'
const chalk = require('chalk')
const fs = require('fs-extra')
const webpack = require('webpack')
const configFactory = require('../config/webpack.config')
const paths = require('../config/paths')
const config = configFactory('production')

fs.emptyDirSync(paths.appBuild)
copyPublicFolder()
build()

function build() {
  const compiler = webpack(config)
  compiler.run((err, stats) => {
    console.log(err)
    console.log(chalk.green('Compiled successfully.\n'))
  })
}

function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuild, {
    filter: file => file !== paths.appHtml,
  })
}
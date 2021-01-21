process.env.NODE_ENV = 'development'
const configFactory = require('../config/webpack.config')
const createDevServerConfig = require('../config/webpackDevServer.config')
const WebpackDevServer = require('webpack-dev-server')
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'
const config = configFactory('development')
const webpack = require('webpack')
const chalk = require('chalk')
const compiler = createCompiler({
  config,
  webpack
})
const serverConfig = createDevServerConfig()
const devServer = new WebpackDevServer(compiler, serverConfig)
devServer.listen(DEFAULT_PORT, HOST, err => {
  if (err) {
    return console.log(err)
  }
  console.log(chalk.cyan('Starting the development server...\n'))
})

function createCompiler({
  config,
  webpack
}) {
  let compiler = webpack(config)
  return compiler
}
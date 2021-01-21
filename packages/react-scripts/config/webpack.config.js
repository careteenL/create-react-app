const paths = require('./paths')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development'
  const isEnvProduction = webpackEnv === 'production'
  return {
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    output: {
      path: paths.appBuild
    },
    module: {
      rules: [{
        test: /\.(js|jsx|ts|tsx)$/,
        include: paths.appSrc,
        loader: require.resolve('babel-loader'),
        options: {
          presets: [
            [
              require.resolve('babel-preset-react-app')
            ]
          ]
        }
      }, ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.appHtml
      })
    ]
  }
}
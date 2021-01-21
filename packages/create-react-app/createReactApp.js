const chalk = require('chalk')
const { Command } = require('commander')
const packageJson = require('./package.json')

let appName;
const init = async () => {
  new Command(packageJson.name)
    .version(packageJson.version)
    .arguments('<project-directory>')
    .usage(`${chalk.green('<project-directory>')} [options]`)
    .action(projectName => {
      appName = projectName
    })
    .parse(process.argv)
  console.log(appName, process.argv)
}

module.exports = {
  init,
}
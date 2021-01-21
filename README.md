# Create React App 源码揭秘

![cover](https://careteenl.github.io/images/%40careteen/create-react-app/cover.jpg)

## 目录

- [背景](#背景)
- [monorepo管理](#monorepo管理)
  - [monorepo优势](#monorepo优势)
  - [monorepo劣势](#monorepo劣势)
- [Lerna](#Lerna)
  - [全局安装Lerna](#全局安装Lerna)
  - [初始化项目](#初始化项目)
  - [创建Package](#创建Package)
  - [开启Workspace](#开启Workspace)
  - [LernaScript](#LernaScript)
- [CreateReactApp架构](#CreateReactApp架构)
- [packages/create-react-app](#packages/create-react-app)
  - [准备工作](#准备工作)
  - [创建package.json](#创建package.json)
  - [安装依赖项](#安装依赖项)
  - [拷贝模板](#拷贝模板)
  - [查看效果](#查看效果)
- [packages/cra-template](#packages/cra-template)
- [packages/cra-template--typescript](#packages/cra-template--typescript)
- [packages/react-scripts](#packages/react-scripts)
  - [react-scripts build](#react-scripts-build)
  - [react-scripts start](#react-scripts-start)
  - [react-scripts小结](#react-scripts小结)
- [packages/react-dev-utils](#packages/react-dev-utils)

## 背景

[Create React App](https://github.com/facebook/create-react-app)是一个官方支持的创建`React`单页应用程序的脚手架。它提供了一个零配置的现代化配置设置。

平时工作中一部分项目使用的`React`，使用之余也需要了解其脚手架实现原理。

> 之前做的模板项目脚手架[@careteen/cli](https://github.com/careteenL/cli)，实现方式比较原始。后续准备通过`lerna`进行重构。
## monorepo管理

`Monorepo`是管理项目代码的一个方式，指在一个项目仓库(`repo`)中管理多个模块/包(`package`)。不同于常见的每个模块都需要建一个`repo`。

[babel](https://github.com/babel/babel/tree/main/packages)的`packages`目录下存放了多个包。

![babel-packages](https://careteenl.github.io/images/%40careteen/create-react-app/babel-packages.jpg)

### monorepo优势

`Monorepo`最主要的好处是**统一的工作流**和**代码共享**。

比如我在看[babel-cli](https://github.com/babel/babel/blob/main/packages/babel-cli/src/babel-external-helpers.js#L4)的源码时，其中引用了其他库，如果不使用`Monorepo`管理方式，而是对`@babel/core`新建一个仓库，则需要打开另外一个仓库。如果直接在当前仓库中查看，甚至修改进行本地调试，那阅读别人代码会更加得心应手。

```js
import { buildExternalHelpers } from "@babel/core";
```

目前大多数开源库都使用`Monorepo`进行管理，如[react](https://github.com/facebook/react)、[vue-next](https://github.com/vuejs/vue-next)、[create-react-app](https://github.com/facebook/create-react-app)。

### monorepo劣势

- 体积庞大。`babel`仓库下存放了所有相关代码，`clone`到本地也需要耗费不少时间。
- 不适合用于公司项目。各个业务线仓库代码基本都是独立的，如果堆放到一起，理解和维护成本将会相当大。

## Lerna

`Lerna`是`babel`团队对`Monorepo`的最佳实践。是一个管理多个`npm`模块的工具，有优化维护多个包的工作流，解决多个包互相依赖，且发布需要手动维护多个包的问题。


> 前往[lerna](https://github.com/lerna/lerna)查看官方文档，下面做一个简易入门。
### 全局安装Lerna
```shell
$ npm i -g lerna
```

### 初始化项目

```shell
$ mkdir lerna-example && cd $_
$ lerna init
```
生成项目结构
```
|-- lerna.json
|-- package.json
`-- packages # 暂时为空文件夹
```

`packages.json`文件中指定`packages`工作目录为`packages/*`下所有目录
```json
{
  "packages": [
    "packages/*"
  ],
  "version": "0.0.0"
}
```

### 创建Package

```shell
# 一路回车即可
$ lerna create create-react-app
$ lerna create react-scripts
$ lerna create cra-template
```
会在`packages/`目录下生成三个子项目

![lerna-create-result](https://careteenl.github.io/images/%40careteen/create-react-app/lerna-create-result.jpg)

### 开启Workspace

默认是`npm`，每个子`package`都有自己的`node_modules`。

新增如下配置，开启`workspace`。目的是让顶层统一管理`node_modules`，子`package`不管理。

```json
// package.json
{
  "private": true,
  "workspaces": [
    "packages/*"
  ],
}
```

```json
// lerna.json
{
  "useWorkspaces": true,
  "npmClient": "yarn"
}
```

### Lerna Script

> 前往[Lerna](https://github.com/lerna/lerna/tree/main/commands)查看各个`command`的详细使用

- lerna add
- lerna bootstrap
- lerna list
- lerna link
- lerna publish

#### lerna add

```shell
# 语法
$ lerna add <package>[@version] [--dev] [--exact] [--peer]
```

```shell
# 示例
# 为所有子`package`都安装`chalk`
$ lerna add chalk
# 为`create-react-app`安装`commander`
$ lerna add commander --scope=create-react-app
# 如果安装失败，请检查拼写是否错误或者查看子包是否有命名空间
$ lerna list
# 由于我的包做了命名空间，所以需要加上前缀
$ lerna add commander --scope=@careteen/create-react-app
```

如果想要在根目录为所有子包添加统一依赖，并只在根目录下`package.josn`，可以借助`yarn`

```shell
yarn add chalk --ignore-workspace-root-check
```

还能在根目录为某个子`package`安装依赖

```shell
# 子包有命名空间需要加上
yarn workspace create-react-app add commander
```

#### lerna bootstrap

默认是`npm i`，指定使用`yarn`后，就等价于`yarn install`

#### lerna list

列出所有的包
```shell
$ lerna list
```
打印结果
```
info cli using local version of lerna
lerna notice cli v3.22.1
@careteen/cra-template
@careteen/create-react-app
@careteen/react-scripts
lerna success found 3 packages
```

#### lerna link

建立软链，等价于`npm link`

#### lerna publish

```shell
$ lerna publish              # 发布自上次发布以来已经更改的包
$ lerna publish from-git     # 显式发布在当前提交中标记的包
$ lerna publish from-package # 显式地发布注册表中没有最新版本的包
```

##### 第一次发布报错

- **原因**

第一次`leran publish`发布时会报错`lerna ERR! E402 You must sign up for private packages`，原因可查看[lerna #1821](https://github.com/lerna/lerna/issues/1821#issuecomment-448473941)。

- **解决方案**

> 以下操作需要保证将本地修改都`git push`，并且将`npm registry`设置为 https://registry.npmjs.org/ 且已经登录后。

1. 由于`npm`限制，需要先在`package.json`中做如下设置
```json
"publishConfig": {
  "access": "public"
},
```

2. 然后前往各个子包先通过`npm publish`发布一次

```shell
$ cd packages/create-react-app && npm publish --access=public
```

3. 修改代码后下一次发布再使用`lerna publish`，可得到如下日志

```shell
$ lerna publish
  Patch (0.0.1) # 选择此项并回车
  Minor (0.1.0) 
  Major (1.0.0) 
  Prepatch (0.0.1-alpha.0) 
  Preminor (0.1.0-alpha.0) 
  Premajor (1.0.0-alpha.0) 
  Custom Prerelease 
  Custom Version

? Select a new version (currently 0.0.0) Patch (0.0.1)

Changes:
 - @careteen/cra-template: 0.0.1 => 0.0.1
 - @careteen/create-react-app: 0.0.1 => 0.0.1
 - @careteen/react-scripts: 0.0.1 => 0.0.1  
? Are you sure you want to publish these packages? (ynH) # 输入y并回车

Successfully published: # 发布成功
 - @careteen/cra-template@0.0.2
 - @careteen/create-react-app@0.0.2
 - @careteen/react-scripts@0.0.2
lerna success published 3 packages
```

如果此过程又失败并报错`lerna ERR! fatal: tag 'v0.0.1' already exists`，对应issues可查看[lerna #1894](https://github.com/lerna/lerna/issues/1894)。需要先将本地和远程`tag`删除，再发布。
```shell
# 删除本地tag
git tag -d v0.0.1
# 删除远程tag
git push origin :refs/tags/v0.0.1
# 重新发布
lerna publish
```

## CreateReactApp架构

TODO: 优化架构图

![structure](https://careteenl.github.io/images/%40careteen/create-react-app/structure.png)

## packages/create-react-app

### 准备工作

在项目根目录`package.json`文件新增如下配置
```json
"scripts": {
  "create": "node ./packages/create-react-app/index.js"
}
```

然后在`packages/create-react-app/package.json`新增如下配置
```json
"main": "./index.js",
"bin": {
  "careteen-cra": "./index.js"
},
```

新增`packages/create-react-app/index.js`文件
```js
#!/user/bin/env node
const { init } = require('./createReactApp')
init()
```

新增`packages/create-react-app/createReactApp.js`文件
```js
const chalk = require('chalk')
const { Command } = require('commander')
const packageJson = require('./package.json')

const init = async () => {
  let appName;
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
```

在项目根目录运行
```shell
# 查看包版本
npm run create -- --version
# 打印出`myProject`
npm run create -- myProject
```
会打印`myProject`，`[
  '/Users/apple/.nvm/versions/node/v14.8.0/bin/node',
  '/Users/apple/Desktop/create-react-app/packages/create-react-app/index.js',
  'myProject'
]`

### 创建package.json

先添加依赖
```shell
# cross-spawn 跨平台开启子进程
# fs-extra fs增强版
yarn add cross-spawn fs-extra --ignore-workspace-root-check
```

在当前工作环境创建`myProject`目录，然后创建`package.json`文件写入部分配置
```js
const fse = require('fs-extra')
const init = async () => {
  // ...
  await createApp(appName)
}
const createApp = async (appName) => {
  const root = path.resolve(appName)
  fse.ensureDirSync(appName)
  console.log(`Creating a new React app in ${chalk.green(root)}.`)
  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
  }
  fse.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
  const originalDirectory = process.cwd()
  
  console.log('originalDirectory: ', originalDirectory)
  console.log('root: ', root)
}
```

### 安装依赖项

然后改变工作目录为新创建的`myProject`目录，确保后续为此目录安装依赖`react, react-dom, react-scripts, cra-template`

```js
const createApp = async (appName) => {
  // ...
  process.chdir(root)
  await run(root, appName, originalDirectory)
}
const run = async (root, appName, originalDirectory) => {
  const scriptName = 'react-scripts'
  const templateName = 'cra-template'
  const allDependencies = ['react', 'react-dom', scriptName, templateName]
  console.log(
    `Installing ${chalk.cyan('react')}, ${chalk.cyan(
      'react-dom'
    )}, and ${chalk.cyan(scriptName)}${
      ` with ${chalk.cyan(templateName)}`
    }...`
  )
}
```

此时我们还没有编写`react-scripts, cra-template`这两个包，先使用现有的。
> 后面实现后可改为`@careteen/react-scripts, @careteen/cra-template`
```shell
lerna add react-scripts cra-template --scope=@careteen/create-react-app
```

借助`cross-spawn`开启子进程安装依赖
```js
const run = async (root, appName, originalDirectory) => {
  // ...
  await install(root, allDependencies)
}
const install = async (root, allDependencies) => {
  return new Promise((resolve) => {
    const command = 'yarnpkg'
    const args = ['add', '--exact', ...allDependencies, '--cwd', root]
    const child = spawn(command, args, {
      stdio: 'inherit',
    })
    child.on('close', resolve)
  })
}
```

### 拷贝模板

核心部分在于运行`react-scripts/scripts/init.js`做模板拷贝工作。
```js
const run = async (root, appName, originalDirectory) => {
  // ...
  await install(root, allDependencies)
  const data = [root, appName, true, originalDirectory, templateName]
  const source = `
  var init = require('react-scripts/scripts/init.js');
  init.apply(null, JSON.parse(process.argv[1]));
  `
  await executeNodeScript(
    {
      cwd: process.cwd(),
    },
    data,
    source,
  )
  console.log('Done.')
  process.exit(0)
}
const executeNodeScript = async ({ cwd }, data, source) => {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['-e', source, '--', JSON.stringify(data)],
      {
        cwd,
        stdio: 'inherit',
      }
    )
    child.on('close', resolve)
  })
}
```
> 其中`spawn(process.execPath, args, { cwd })`类似于我们直接在`terminal`中直接使用`node -e 'console.log(1 + 1)'`，可以直接运行js代码。

### 查看效果

运行下面脚本
```shell
npm run create -- myProject
```
可以在当前项目根目录看到`myProject`的目录结构。
![copy-cra-result](https://careteenl.github.io/images/%40careteen/create-react-app/copy-cra-result.jpg)

此时已经实现了`create-react-app``package`的核心功能。下面将进一步剖析`cra-tempalte, react-scripts`。

## packages/cra-tempalte

`cra-tempalte`可以从[cra-tempalte](https://github.com/facebook/create-react-app/blob/master/packages/cra-template/README.md)拷贝，启动一个简易`React`单页应用。

> 对`React`原理感兴趣的可前往[由浅入深React的Fiber架构](https://github.com/careteenL/react/tree/master/packages/fiber)查看。

## packages/cra-tempalte--typescript

同上，不是本文讨论重点。

## packages/react-scripts

安装依赖

```shell
# `lerna`给子包装多个依赖时报警告`lerna WARN No packages found where webpack can be added.`
lerna add webpack webpack-dev-server babel-loader babel-preset-react-app html-webpack-plugin open --scope=@careteen/react-scripts
# 故使用`yarn`安装
yarn workspace @careteen/react-scripts add webpack webpack-dev-server babel-loader babel-preset-react-app html-webpack-plugin open
```

为`package.json`配置
```json
"bin": {
  "careteen-react-scripts": "./bin/react-scripts.js"
},
"scripts": {
  "start": "node ./bin/react-scripts.js start",
  "build": "node ./bin/react-scripts.js build"
},
```

创建`bin/react-scripts.js`文件
```js
#!/usr/bin/env node
const spawn = require('cross-spawn')
const args = process.argv.slice(2)
const script = args[0]
spawn.sync(
  process.execPath,
  [require.resolve('../scripts/' + script)],
  { stdio: 'inherit' }
)
```

### react-scripts build

> 对`webpack`原理感兴趣的可前往[@careteen/webpack](https://github.com/careteenL/webpack)查看简易实现。

创建`scripts/build.js`文件，主要负责两件事

- 拷贝模板项目的`public`目录下的所有静态资源到`build`目录下
- 配置为`production`环境，使用`webpack(config).run()`编译打包

```js
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
```

配置`config/webpack.config.js`文件
```js
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
```

配置`config/paths.js`文件
```js
const path = require('path')
const appDirectory = process.cwd()
const resolveApp = relativePath => path.resolve(appDirectory, relativePath)
module.exports = {
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveApp('src/index.js'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public')
}
```

`npm run build`后可查看`build`目录下会生成编译打包后的所有文件

### react-scripts start

创建`scripts/start.js`文件，借助`webpack`功能启服务
```js
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
```
创建`config\webpackDevServer.config.js`文件提供本地服务设置

> 对`webpack热更新`原理感兴趣的可前往[@careteen/webpack-hmr](https://github.com/careteenL/webpack-hmr)查看简易实现。
```js
module.exports = function () {
  return {
    hot: true
  }
}
```

`npm run start`后可在浏览器 http://localhost:8080/ 打开查看效果

### react-scripts小结

上面两节实现没有源码考虑的那么完善。后面将针对源码中使用到的一些较为巧妙的第三方库和`webpack-plugin`做讲解。

## packages/react-dev-utils

此子`package`下存放了许多`webpack-plugin`辅助于`react-scripts/config/webpack.config.js`文件。



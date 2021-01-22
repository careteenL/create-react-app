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
  - [LernaScript](#Lerna-Script)
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
  - [PnpWebpackPlugin](#PnpWebpackPlugin)
  - [ModuleScopePlugin](#ModuleScopePlugin)
  - [InterpolateHtmlPlugin](#InterpolateHtmlPlugin)
  - [WatchMissingNodeModulesPlugin](#WatchMissingNodeModulesPlugin)
- [总结](#总结)

## 背景

> 图片失效可前往[juejin](https://juejin.cn/post/6920473687908941831)查看。

[Create React App](https://github.com/facebook/create-react-app)是一个官方支持的创建`React`单页应用程序的脚手架。它提供了一个零配置的现代化配置设置。

平时工作中一部分项目使用的`React`，使用之余也需要了解其脚手架实现原理。

> 之前做的模板项目脚手架[@careteen/cli](https://github.com/careteenL/cli)，实现方式比较原始。后续准备通过`lerna`进行重构。

下面先做一些`前备知识`了解。

## monorepo管理

> 如果对`monorepo和lerna`已经比较了解，可以直接移步[CreateReactApp架构](#CreateReactApp架构)

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

> 如果对`monorepo和lerna`已经比较了解，可以直接移步[CreateReactApp架构](#CreateReactApp架构)

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

此子`package`下存放了许多`webpack-plugin`辅助于[react-scripts/config/webpack.config.js](https://github.com/facebook/create-react-app/blob/v4.0.1/packages/react-scripts/config/webpack.config.js)文件。在文件中搜索`plugins`字段查看。

此文先列举一些我觉得好用的`plugins`

- [PnpWebpackPlugin](https://github.com/arcanis/pnp-webpack-plugin)。提供一种更加高效的模块查找机制，试图取代`node_modules`。
- [ModuleScopePlugin](https://github.com/facebook/create-react-app/blob/v4.0.1/packages/react-dev-utils/ModuleScopePlugin.js)。阻止用户从src/(或node_modules/)外部导入文件。
- [InterpolateHtmlPlugin](https://github.com/facebook/create-react-app/blob/v4.0.1/packages/react-dev-utils/InterpolateHtmlPlugin.js)。使得`<link rel="icon" href="%PUBLIC_URL%/favicon.ico">`中可以使用变量`%PUBLIC_URL%`。
- [WatchMissingNodeModulesPlugin](https://github.com/facebook/create-react-app/blob/v4.0.1/packages/react-dev-utils/WatchMissingNodeModulesPlugin.js)。使得安装了新的依赖不再需要重新启动项目也能正常运行。
```js
return {
  // ...
  resolve: {
    plugins: [
      // 增加了对即插即用(Plug'n'Play)安装的支持，提高了安装速度，并增加了对遗忘依赖项等的保护。
      PnpWebpackPlugin,
      // 阻止用户从src/(或node_modules/)外部导入文件。
      // 这经常会引起混乱，因为我们只使用babel处理src/中的文件。
      // 为了解决这个问题，我们阻止你从src/导入文件——如果你愿意，
      // 请将这些文件链接到node_modules/中，然后让模块解析开始。
      // 确保源文件已经编译，因为它们不会以任何方式被处理。
      new ModuleScopePlugin(paths.appSrc, [
        paths.appPackageJson,
        reactRefreshOverlayEntry,
      ]),
    ],
  },
  plugins: [
    // ...
    // 使一些环境变量在index.html中可用。
    // public URL在index中以%PUBLIC_URL%的形式存在。html,例如:
    // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
    // 除非你指定"homepage"否则它将是一个空字符串
    // 在包中。在这种情况下，它将是该URL的路径名。
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
    // 如果你需要一个缺失的模块，然后用' npm install '来安装它，你仍然需要重启开发服务器，webpack才能发现它。这个插件使发现自动，所以你不必重新启动。
    // 参见https://github.com/facebook/create-react-app/issues/186
    isEnvDevelopment &&
        new WatchMissingNodeModulesPlugin(paths.appNodeModules),
  ]

}
```

### PnpWebpackPlugin

> 增加了对即插即用(Plug'n'Play)安装的支持，提高了安装速度，并增加了对遗忘依赖项等的保护。试图取代`node_modules`。

先来了解下使用`node_modules`模式的机制

1. 将依赖包的版本区间解析为某个具体的版本号
1. 下载对应版本依赖的`tar` 报到本地离线镜像
1. 将依赖从离线镜像解压到本地缓存
1. 将依赖从缓存拷贝到当前目录的`node_modules`目录

**PnP工作原理是作为上述第四步骤的替代方案**

#### PnP使用

> 示例存放在[plugins-example/PnpWebpackPlugin](https://github.com/careteenL/create-react-app/plugins-example/PnpWebpackPlugin)

`create-react-app`已经集成了对`PnP`的支持。只需在创建项目时添加`--use-pnp`参数。
```shell
create-react-app myProject --use-pnp
```

在已有项目中开启可使用`yarn`提供的`--pnp`
```shell
yarn --pnp
yarn add uuid
```

与此同时会自动在`package.json`中配置开启`pnp`。而且不会生成`node_modules`目录，取而代替生成`.pnp.js`文件。
```json
{
  "installConfig": {
    "pnp": true
  }
}
```

由于在开启了 `PnP` 的项目中不再有 node_modules 目录，所有的依赖引用都必须由 `.pnp.js` 中的 `resolver` 处理
因此不论是执行 `script` 还是用 `node` 直接执行一个 `JS` 文件，都必须经由 `Yarn` 处理
```json
{
  // 还需配置使用脚本
  "scripts": {
    "build": "node uuid.js"
  }
}
```

运行脚本查看效果
```shell
yarn run build
# 或者使用node
yarn node uuid.js
```
![pnp](https://careteenl.github.io/images/%40careteen/create-react-app//pnp.jpg)

### ModuleScopePlugin

> 阻止用户从src/(或node_modules/)外部导入文件。
> 这经常会引起混乱，因为我们只使用babel处理src/中的文件。
> 为了解决这个问题，我们阻止你从src/导入文件——如果你愿意，
> 请将这些文件链接到node_modules/中，然后让模块解析开始。
> 确保源文件已经编译，因为它们不会以任何方式被处理。

通过`create-react-app`生成的项目内部引用不了除`src`外的目录，不然会报错`which falls outside of the project src/ directory. Relative imports outside of src/ are not supported.`

> 通常解决方案是借助[react-app-rewired, customize-cra](https://github.com/careteenL/react/blob/master/FAQ.md)解决。

那接下来看看是如何实现这个功能。

> 示例存放在[plugins-example/ModuleScopePlugin](https://github.com/careteenL/create-react-app/plugins-example/ModuleScopePlugin)

实现步骤主要是

- 着手于[resolver.hooks.file](https://v4.webpack.docschina.org/api/resolvers/)解析器读取文件`request`时。
- 解析的文件路径如果包含`node_modules`则放行。
- 解析的文件路径如果包含使用此插件的传参`appSrc`则放行。
- 解析的文件路径和`src`做`path.relative`，结果如果是以`../`开头，则认为在`src`路径之外，会抛错。
```js
const chalk = require('chalk');
const path = require('path');
const os = require('os');

class ModuleScopePlugin {
  constructor(appSrc, allowedFiles = []) {
    this.appSrcs = Array.isArray(appSrc) ? appSrc : [appSrc];
    this.allowedFiles = new Set(allowedFiles);
  }

  apply(resolver) {
    const { appSrcs } = this;
    resolver.hooks.file.tapAsync(
      'ModuleScopePlugin',
      (request, contextResolver, callback) => {
        // Unknown issuer, probably webpack internals
        if (!request.context.issuer) {
          return callback();
        }
        if (
          // If this resolves to a node_module, we don't care what happens next
          request.descriptionFileRoot.indexOf('/node_modules/') !== -1 ||
          request.descriptionFileRoot.indexOf('\\node_modules\\') !== -1 ||
          // Make sure this request was manual
          !request.__innerRequest_request
        ) {
          return callback();
        }
        // Resolve the issuer from our appSrc and make sure it's one of our files
        // Maybe an indexOf === 0 would be better?
        if (
          appSrcs.every(appSrc => {
            const relative = path.relative(appSrc, request.context.issuer);
            // If it's not in one of our app src or a subdirectory, not our request!
            return relative.startsWith('../') || relative.startsWith('..\\');
          })
        ) {
          return callback();
        }
        const requestFullPath = path.resolve(
          path.dirname(request.context.issuer),
          request.__innerRequest_request
        );
        if (this.allowedFiles.has(requestFullPath)) {
          return callback();
        }
        // Find path from src to the requested file
        // Error if in a parent directory of all given appSrcs
        if (
          appSrcs.every(appSrc => {
            const requestRelative = path.relative(appSrc, requestFullPath);
            return (
              requestRelative.startsWith('../') ||
              requestRelative.startsWith('..\\')
            );
          })
        ) {
          const scopeError = new Error(
            `You attempted to import ${chalk.cyan(
              request.__innerRequest_request
            )} which falls outside of the project ${chalk.cyan(
              'src/'
            )} directory. ` +
              `Relative imports outside of ${chalk.cyan(
                'src/'
              )} are not supported.` +
              os.EOL +
              `You can either move it inside ${chalk.cyan(
                'src/'
              )}, or add a symlink to it from project's ${chalk.cyan(
                'node_modules/'
              )}.`
          );
          Object.defineProperty(scopeError, '__module_scope_plugin', {
            value: true,
            writable: false,
            enumerable: false,
          });
          callback(scopeError, request);
        } else {
          callback();
        }
      }
    );
  }
}
```

### InterpolateHtmlPlugin

> 使一些环境变量在index.html中可用。
> public URL在index中以%PUBLIC_URL%的形式存在。html,例如:
> <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
> 除非你指定"homepage"否则它将是一个空字符串
> 在包中。在这种情况下，它将是该URL的路径名。

> 示例存放在[plugins-example/InterpolateHtmlPlugin](https://github.com/careteenL/create-react-app/plugins-example/InterpolateHtmlPlugin)

实现思路主要是对[html-webpack-plugin/afterTemplateExecution](https://github.com/jantimon/html-webpack-plugin/blob/v4.5.1/lib/hooks.js#L45)模板执行后生成的`html`文件进行正则替换。

```js
const escapeStringRegexp = require('escape-string-regexp');

class InterpolateHtmlPlugin {
  constructor(htmlWebpackPlugin, replacements) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.replacements = replacements;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('InterpolateHtmlPlugin', compilation => {
      this.htmlWebpackPlugin
        .getHooks(compilation)
        .afterTemplateExecution.tap('InterpolateHtmlPlugin', data => {
          // Run HTML through a series of user-specified string replacements.
          Object.keys(this.replacements).forEach(key => {
            const value = this.replacements[key];
            data.html = data.html.replace(
              new RegExp('%' + escapeStringRegexp(key) + '%', 'g'),
              value
            );
          });
        });
    });
  }
}
```

### WatchMissingNodeModulesPlugin

> 如果你需要一个缺失的模块，然后用' npm install '来安装它，你仍然需要重启开发服务器，webpack才能发现它。这个插件使发现自动，所以你不必重新启动。
> 参见https://github.com/facebook/create-react-app/issues/186

> 示例存放在[plugins-example/WatchMissingNodeModulesPlugin](https://github.com/careteenL/create-react-app/plugins-example/WatchMissingNodeModulesPlugin)

实现思路是在**生成资源到 output 目录之前**[emit](https://v4.webpack.docschina.org/api/compiler-hooks/#emit)钩子中借助`compilation`的`missingDependencies`和`contextDependencies.add`两个字段对丢失的依赖重新安装。

```js
class WatchMissingNodeModulesPlugin {
  constructor(nodeModulesPath) {
    this.nodeModulesPath = nodeModulesPath;
  }

  apply(compiler) {
    compiler.hooks.emit.tap('WatchMissingNodeModulesPlugin', compilation => {
      var missingDeps = Array.from(compilation.missingDependencies);
      var nodeModulesPath = this.nodeModulesPath;

      // If any missing files are expected to appear in node_modules...
      if (missingDeps.some(file => file.includes(nodeModulesPath))) {
        // ...tell webpack to watch node_modules recursively until they appear.
        compilation.contextDependencies.add(nodeModulesPath);
      }
    });
  }
}
```

## 总结

**使用`多个仓库`管理的优点**

- 各模块管理自由度较高，可自行选择构建工具，依赖管理，单元测试等配套设施
- 各模块仓库体积一般不会太大

使用`多个仓库`管理的缺点

- 仓库分散不好找，当很多时，更加困难，分支管理混乱
- 版本更新繁琐，如果公共模块版本变化，需要对所有模块进行依赖的更新
- `CHANGELOG`梳理异常折腾，无法很好的自动关联各个模块的变动联系，基本靠口口相传


**使用`monorepo`管理的缺点**

- 统一构建工具，对构建工具提出了更高要求，要能构建各种相关模块
- 仓库体积会变大

使用`monorepo`管理的优点

- 一个仓库维护多个模块，不用到处找仓库
- 方便版本管理和依赖管理，模块之间的引用、调试都非常方便，配合相应工具，可以一个命令搞定
- 方便统一生成`CHANGELOG`，配合提交规范，可以在发布时自动生成`CHANGELOG`，借助[Leran-changelog](https://github.com/lerna/lerna-changelog)

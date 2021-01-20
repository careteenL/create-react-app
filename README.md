# Create React App 源码揭秘

## 目录

- monorepo管理
- create-react-app
- cra-template
- cra-template--typescript
- react-scripts
- react-dev-utils

## monorepo管理

`Monorepo`是管理项目代码的一个方式，指在一个项目仓库(`repo`)中管理多个模块/包(`package`)。不同于常见的每个模块都需要建一个`repo`。

[babel](https://github.com/babel/babel/tree/main/packages)的`packages`目录下存放了多个包。

![babel-packages](./assets/babel-packages.jpg)

### monorepo管理优势

`Monorepo`最主要的好处是**统一的工作流**和**代码共享**。

比如我在看[babel-cli](https://github.com/babel/babel/blob/main/packages/babel-cli/src/babel-external-helpers.js#L4)的源码时，其中引用了其他库，如果不使用`Monorepo`管理方式，而是对`@babel/core`新建一个仓库，则需要打开另外一个仓库。如果直接在当前仓库中查看，甚至修改进行本地调试，那阅读别人代码会更加得心应手。

```js
import { buildExternalHelpers } from "@babel/core";
```

目前大多数开源库都使用`Monorepo`进行管理，如[react](https://github.com/facebook/react)、[vue-next](https://github.com/vuejs/vue-next)、[create-react-app](https://github.com/facebook/create-react-app)。

### monorepo管理劣势

- 体积庞大。`babel`仓库下存放了所有相关代码，`clone`到本地也需要耗费不少时间。
- 不适合用于公司项目。各个业务线仓库代码基本都是独立的，如果堆放到一起，理解和维护成本将会相当大。

## Lerna

`Lerna`是`babel`团队对`Monorepo`的最佳实践。是一个管理多个`npm`模块的工具，有优化维护多个包的工作流，解决多个包互相依赖，且发布需要手动维护多个包的问题。

## Lerna使用

> 前往[lerna](https://github.com/lerna/lerna)查看官方文档，下面做一个简易入门。
### 全局安装lerna
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

### 创建子项目

```shell
# 一路回车即可
$ lerna create create-react-app
$ lerna create react-scripts
$ lerna create cra-template
```
会在`packages/`目录下生成三个子项目

![lerna-create-result](./assets/lerna-create-result.jpg)

### 开启workspace

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

### lerna script

> 前往[lerna add](https://github.com/lerna/lerna/tree/main/commands/add#readme)查看详细使用

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
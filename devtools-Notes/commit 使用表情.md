# 在commit中使用emoji表情

执行`git commit`使用`emoji`打标签，使得此次的主要更改工作得以凸显，易于区分和查找。
但是emoji表情在提交代码时不能乱用，避免造成误解！！！

## gitmoji

commit emoji规范

| emoji | emoji代码                    | 说明                   |
| ----- | ---------------------------- | ---------------------- |
| 🎉     | `:tada:`                     | 初次提交               |
| 🎨     | `:art:`                      | 改进代码结构/代码格式  |
| 🔥     | `:fire:`                     | 移除代码或文件         |
| 🐛     | `:bug:`                      | 修复bug                |
| 🚑     | `:ambulance:`                | 关键补丁               |
| ✨     | `:sparkles:`                 | 引入新的功能           |
| 🔧     | `:wrench:`                   | 修改配置文件           |
| 📝     | `:pencil:`                   | 写文档                 |
| 🚀     | `:rocket:`                   | 部署功能               |
| 💄     | `:lipstick:`                 | 更新 UI 和样式文件     |
| 📌     | `:pushpin`                   | 固定依赖版本           |
| ♻️     | `:recycle`                   | 重命名                 |
| 🔨     | `:hammer:`                   | 重构                   |
| ⚡     | `:zap:`                      | 提升性能               |
| 💩     | `:poop:`                     | 编写需要改进的错误代码 |
| 📦     | `:package:`                  | 升级依赖文件或包       |
| 👽     | `:alien`                     | API变化导致代码的更新  |
| 🍱     | `:bento`                     | 添加、更新assets       |
| 👌     | `:ok_hand:`                  | code review后更改代码  |
| ➕     | `:heavy_plus_sign:`          | 增加一个依赖           |
| ➖     | `:heavy_minus_sign:`         | 少一个依赖             |
| ⬇️     | `:arrow_down:`               | 降级依赖               |
| ⬆️     | `:arrow_up:`                 | 升级依赖               |
| 🔖     | `:bookmark:`                 | 发行/版本标签          |
| 🙈     | `:see_no_evil:`              | 添加/更新.gitignore    |
| 🚧     | `:construction:`             | 工作进行中             |
| ✅     | `:white_check_mark:`         | 增加测试               |
| 🌐     | `:globe_with_meridians:`     | 国际化与本地化         |
| 🔒     | `:lock:`                     | 修复安全问题           |
| 🍎     | `:apple:`                    | 修复 macOS 下的问题    |
| 🐧     | `:penguin:`                  | 修复 Linux 下的问题    |
| 🏁     | `:checkered_flag:`           | 修复 Windows 下的问题  |
| 🚨     | `:rotating_light:`           | 移除 linter 警告       |
| 💚     | `:green_heart:`              | 移除 linter 警告       |
| 🚨     | `:rotating_light:`           | 添加 CI 构建系统       |
| 👷     | `:construction_worker:`      | 添加 CI 构建系统       |
| 📈     | `:chart_with_upwards_trend:` | 添加分析或跟踪代码     |
| 🐳     | `:whale:`                    | Docker 相关工作        |
| ✏️     | `:pencil2`                   | fix typos              |
| 🔊     | `:loud_sound:`               | 添加logs               |

### commit格式

```
    git commit -m ':emoji1: :emoji2: message'
```

- 示例

  ```
   git commit -m ':memo: 文档说明'
  ```

- 效果
  [![git emoji](https://user-images.githubusercontent.com/27126241/63001232-b8c04380-bea5-11e9-8113-dbbef8f2433f.png)](https://user-images.githubusercontent.com/27126241/63001232-b8c04380-bea5-11e9-8113-dbbef8f2433f.png)

## IDE中使用自动提示

- VSCode: 安装`Gitmoji Commit`插件，使用方法见该插件说明
- WebStorm: 安装`Gitmoji`插件，git commit时键入关键词

## 参考

[Gitmoji](https://gitmoji.carloscuesta.me/)
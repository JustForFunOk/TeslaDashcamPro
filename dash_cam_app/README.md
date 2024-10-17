#  Dash Cam App

## Tips

* electron依赖安装花费时间较长，所以安装在了全局环境避免都个项目都重新安装到项目路径，所以package.json中没有依赖electron. 不过为了在vscode中debug应用，还是在dev依赖中添加了electron
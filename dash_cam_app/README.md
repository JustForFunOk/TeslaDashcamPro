#  Dash Cam App

## TODO

* 进度条相关, 进度条长度是对了，需要添加syncProgressWithVideo实现用户拖动进度条来跳转视频

* 添加一个绝对时间戳

* 视频列表界面集成

* 目前存在在连续播放时，上下两个视频交界处会有闪屏到问题。 SentryDashCam App上也有这个现象



## Deps

* electron依赖安装花费时间较长，所以安装在了全局环境避免都个项目都重新安装到项目路径，所以package.json中没有依赖electron. 不过为了在vscode中debug应用，还是在dev依赖中添加了electron

* three依赖时为了方便用到新的代码时从node_modules中拷贝出来并修改源代码




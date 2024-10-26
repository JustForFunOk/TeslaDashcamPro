#  Dash Cam App

## TODO

* 显示长度超过一屏 右边会有滚动条 影响美观

* 切换section时 之前展开的不会自动折叠

* 目前存在在连续播放时，上下两个视频交界处会有闪屏到问题。 SentryDashCam App上也有这个现象

* 播放视频日期显示的时候 1和其他数字不同 1比较窄会导致整个看起来在左右移动

* 显示宽高比的问题，不同车型不同，双击标题框放大，全屏放大，手机设备上竖横屏适配, 接口在不同平台的适配

## 样式

参考App中的配色RGB 

* 背景 23,23,23  #171717

* 未选中组件 138,138,138  #8A8A8A

* 选中的高亮组件 243,243,243  #F3F3F3

* 返回按钮，箭头是255,255,255，背景是上述背景色


## 图标

### svg

* [垃圾桶](https://fontawesome.com/v5/icons/trash-alt?f=classic&s=solid)

### unicode table

* [箭头unicode table](https://symbl.cc/en/collections/arrow-symbols/)

* 返回箭头使用 &#8249; 这个更好看 但是不能上下居中，目前使用的是&#5176;

* 左转向箭头 U+1F844

* 右转向箭头 U+1F846



## Deps

* electron依赖安装花费时间较长，所以安装在了全局环境避免都个项目都重新安装到项目路径，所以package.json中没有依赖electron. 不过为了在vscode中debug应用，还是在dev依赖中添加了electron

* three依赖时为了方便用到新的代码时从node_modules中拷贝出来并修改源代码




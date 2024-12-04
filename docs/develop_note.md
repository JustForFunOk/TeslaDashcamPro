#  Dash Cam App

## 常用命令

* 新环境中安装依赖 npm install

* 本地运行 npm start

* 打包 npm run make

* [打包应用](https://www.electronjs.org/zh/docs/latest/tutorial/%E6%89%93%E5%8C%85%E6%95%99%E7%A8%8B)

## Bug

* 播放2024-09-04_19-59-43短视频只播放了1s就结束了 2024-09-04_19-47-35也是不满1min的好像都有问题

## TODO

* 针对每个视频片断添加删除，打开所在文件夹功能

* 进度条回拖时，重置各图标的状态

* 视频列表处显示每个片段是否有CAN数据

* 雾灯的状态CH_CAN上没有，先删掉图标，等后续有其他CAN数据进来再加（或者感觉没什么必要就不加）

* ~~播放结束时 自动变为暂停状态，再次点击播放按钮从头播放~~

* ~~缩放至显示器窗口时保持视频比例，优化selectedVideo~~

* ~~需要优化在can data中查找时间戳数据的代码~~

* ~~采集双闪信号时左转右转信号状态，双闪里面只有触发原因没有精确的亮灭控制(已解决，触发双闪时，左右信号会同时被触发，所以只需要处理左右转信号灯就行了)~~

* ~~优化信号灯闪烁逻辑，不根据信号高低显示，触发之后根据播放的时钟闪烁，亮灭持续时间待确定，但是这样处理代码逻辑更复杂，待确定(已换方案，触发时常亮不闪烁，简化显示)~~

* ~~看了数据 10s钟左转向灯闪烁了14次，平均0.7s闪烁一次 为了方便处理就按0.8s，亮0.4s，灭0.4s(同上，触发时常量不闪烁)~~

* 车速显示大一点 单位显示小一点

* 从CAN信号中获取速度单位

* 如果存在报警 则在最前面显示报警图标否则不显示

* ~~加载到最后一段视频时 更新总时长度~~

* 哨兵和保存视频 在进度条的上面显示触发时间点

* 哨兵视频片段 根据json文件切换到对应的视角

    * "camera":"6" 右后

    * "camera":"5" 左后

    * "camera":"？？" 前

    * "camera":"？？" 后

* 根据json文件识别文件类别类型（适用于选择单个子文件夹）

    * 文件夹中包含event.json且视频总数量少于4x12=48个 即为哨兵或手动点击保存

    * "reason":"sentry_aware_object_detection",  reason中包含sentry字样为sentry，其他均为saved

* 根据event.json显示位置，触发原因

* ~~添加播放控件 前进5s 后退5s 经过尝试 使用倍速代替前进，前进会发生跳跃丢失中间过程画面~~

* ~~添加播放控件 倍速 x1 x2 x3 x5  最后倍速度为1x 2x 4x 8x~~

* 20230617 1622 时长显示不对 结果验证是因为mac本地没有安装ffmpeg 安装之后成功 但是使用ffprobe获取时长不靠谱 太慢了

* 行车时前视黄色 不好看 添加转换

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

* [svg库](https://www.svgrepo.com/)

* [png转svg](https://convertio.co/zh/)

* [可视化编辑svg文件](https://boxy-svg.com/)

* [编辑svg，优化svg文件](https://www.svgviewer.dev/)

* [垃圾桶](https://fontawesome.com/v5/icons/trash-alt?f=classic&s=solid)

* [左转箭头](https://www.svgrepo.com/svg/50827/left-arrow)

* [近光灯](https://www.svgrepo.com/svg/49801/low-beam)

* [远光灯](https://www.svgrepo.com/svg/58616/high-beam)

* [回退5s](https://www.svgrepo.com/svg/496824/backward-5-seconds)

* [快进5s]()

### unicode table

* [箭头unicode table](https://symbl.cc/en/collections/arrow-symbols/)

* 返回箭头使用 &#8249; 这个更好看 但是不能上下居中，目前使用的是&#5176;

* 左转向箭头 U+1F844

* 右转向箭头 U+1F846



## Deps

* electron依赖安装花费时间较长，所以安装在了全局环境避免都个项目都重新安装到项目路径，所以package.json中没有依赖electron. 不过为了在vscode中debug应用，还是在dev依赖中添加了electron

* three依赖时为了方便用到新的代码时从node_modules中拷贝出来并修改源代码


## CAN data format
``` json
[
    {
        "ts": "241111121314.1",  // 精确到0.1s
        "v": "0 km/h",  // 数值+单位
    },
]

```


## 输出格式
``` text

// js中实现函数实现如下功能：给出指定的文件夹路径，通过文件夹名称，文件名称的解析，返回文件夹内的文件的信息到列表中

// 文件夹的目录结构介绍如下
// 文件名格式为Y-M-D_h-m-s-front.mp4, Y-M-D_h-m-s-back.mp4, Y-M-D_h-m-s-left_repeater.mp4, Y-M-D_h-m-s-right_repeater.mp4
// Y-M-D_h-m-s代表时间
// front, back, left_repeater, right_repeater分别对应4个位置
// 可能会有SavedClips文件夹或SentryClips文件夹，这两个文件夹下全都是子文件夹，子文件夹的名称格式为Y-M-D_h-m-s，然后这些子文件夹里存放的都是mp4视频文件

// 通过文件名，文件夹名将读取结果处理后放到字典中返回
// 其中返回结果的格式如下：
// SavedClips字典储存SavedClips文件夹下的，若无则为空
// SentryClips字典储存SentryClips文件夹下的，若无则为空
// 其中folder_ts为SavedClips和SentryClips下子文件夹名称，按照时间从新到旧返回，新的时间在前面
// file_ts为时间，通过文件名Y-M-D_h-m-s解析
// F,B,L,R分别对应文件名中为front,back,left_repeater,right_repeater的文件，这4个文件不一定都存在
// 而AllClips则是所选文件夹下包括所有子文件夹甚至SavedClips和SentryClips文件夹中所有符合Y-M-D_h-m-s-xxx.mp4文件，
// 按照时间戳将这些mp4文件排序并根据时间间隔分组，
// 如果相邻两个时间戳之间的差小于3分钟，则这两个视频归于1组，否则则归于2组，其中hour_minute_start-hour_minute_end表示分组之后
// 该组视频的起始时间和终止时间，hour_minute_start从组最开始的视频的小时分钟中解析，hour_minute_end从组内最末尾的视频的小时分钟中解析，
// 组在AllClips中按照时间从新到旧排列。
// 所有的file_ts在file_ts以及hour_minute_start-hour_minute_end中都按照从旧到新排序以便连续播放

// const RetType =
// {
//     "SavedClips":{
//         "folder_ts":{
//             "file_ts": {
//                 "F": "",
//                 "B": "",
//                 "L": "",
//                 "R": "",
//             },

//             "file_ts": {
//                 "F": "",
//                 "B": "",
//                 "L": "",
//                 "R": "",
//             },
//         }
//     },
//     "SentryClips":{
//         "folder_ts":{
//             "file_ts": {
//                 "F": "",
//                 "B": "",
//                 "L": "",
//                 "R": "",
//             },

//             "file_ts": {
//                 "F": "",
//                 "B": "",
//                 "L": "",
//                 "R": "",
//             },
//         }
//     },
//     "AllClips":{
//         "day_from_video_file":{
//             "hour_minute_start-hour_minute_end":{
//                 "file_ts":{
//                     "F": "",
//                     "B": "",
//                     "L": "",
//                     "R": "",
//                 },
//                 "file_ts":{
//                     "F": "",
//                     "B": "",
//                     "L": "",
//                     "R": "",
//                 }
//             }
//         }
//     }
// };

// js中实现函数实现如下功能：给出指定的文件夹路径，通过文件夹名称，文件名称的解析，返回文件夹内的文件的信息到列表中

// 文件夹的目录结构介绍如下
// TeslaCam
//   |- RecentClips
//   |      |-xxxx.mp4
//   |      |-xxxx.mp4
//   |      |-xxxx.mp4
//   |- SavedClips
//   |      |-Y-M-D_h-m-s
//   |      |       |-xxxx.mp4
//   |      |       |-xxxx.mp4
//   |      |       |-event.json
//   |      |       |-thumb.png
//   |      |-Y-M-D_h-m-s
//   |      |       |-xxxx.mp4
//   |      |       |-xxxx.mp4
//   |      |       |-event.json
//   |      |       |-thumb.png
//   |- SentryClips
//   |      |-Y-M-D_h-m-s
//   |      |       |-xxxx.mp4
//   |      |       |-xxxx.mp4
//   |      |       |-event.json
//   |      |       |-thumb.png
//   |      |-Y-M-D_h-m-s
//   |      |       |-xxxx.mp4
//   |      |       |-xxxx.mp4
//   |      |       |-event.json
//   |      |       |-thumb.png

// 其中xxxx.mp4文件名格式为Y-M-D_h-m-s-front.mp4, Y-M-D_h-m-s-back.mp4, Y-M-D_h-m-s-left_repeater.mp4, Y-M-D_h-m-s-right_repeater.mp4
// Y-M-D_h-m-s代表时间
// front, back, left_repeater, right_repeater分别对应4个位置
// 可能会有SavedClips文件夹或SentryClips文件夹，这两个文件夹下全都是子文件夹，子文件夹的名称格式为Y-M-D_h-m-s，
// 然后这些子文件夹里存放的都是mp4视频文件，每个文件夹中还会有一个event.json文件以及thumb.png文件


// 通过文件名，文件夹名将读取结果处理后放到字典中返回
// 其中返回结果的格式如下：

// SavedClips字典储存SavedClips文件夹下的，若无则为空
// SentryClips字典储存SentryClips文件夹下的，若无则为空
// SavedClips和SentryClips下的"Y-M-D_from_folder"和"h-m_from_folder"均从子文件夹名称Y-M-D_h-m-s中提取，这两者都按照倒序排列，即比较新的时间在前面
// "clips"下面存放的是视频，"event"里面存放的是event.json文件路径，"thumb"里面存放的是thumb.png文件路径
// "Y-M-D_h-m-s_from_file"是从视频文件名中提取出的时间，这个是按照正序排列的，即时间比较旧的在前面
// "Y-M-D_h-m-s_from_file"下的F,B,L,R分别对应文件名中为front,back,left_repeater,right_repeater的文件，这4个文件不一定都存在

// 而AllClips则是RecentClips,SavedClips和SentryClips三个文件夹中所有文件名符合格式Y-M-D_h-m-s-xxx.mp4文件，
// 按照Y-M-D_h-m-s时间戳将这些mp4文件排序并根据时间间隔分组，
// 如果相邻两个时间戳之间的差小于3分钟，则这两个视频归于1组，否则则归于2组，
// 其中"Y-M-D_from_file"表示其下的组的视频开始时间都是Y-M-D
// "h-m_from_file_start_to_end"表示表示分组之后该组视频的起始时间和终止时间，如从08_00-09_00，就表示该组视频中最旧的视频是08时00分，最新的视频是09时00分
// 所有的"Y-M-D_h-m-s_from_file"都是正序排列的以便连续播放，即时间比较旧的靠前
// 而"Y-M-D_from_file"和"h-m_from_file_start_to_end"都是倒序排列的，比较新的时间在字典前面

// const RetType =
// {
//     "SavedClips": {
//         "Y-M-D_from_folder": {
//             "h-m_from_folder": {
//                 "clips": {
//                     "Y-M-D_h-m-s_from_file": {
//                         "F": "",
//                         "B": "",
//                         "L": "",
//                         "R": "",
//                     },
//                     "Y-M-D_h-m-s_from_file": {
//                         "F": "",
//                         "B": "",
//                         "L": "",
//                         "R": "",
//                     },
//                 },
//                 "event": "event.json file path",
//                 "thumb": "thumb.png file path",
//             },
//         }
//     },
//     "SentryClips": {
//         "Y-M-D_from_folder": {
//             "h-m_from_folder": {
//                 "clips": {
//                     "Y-M-D_h-m-s_from_file": {
//                         "F": "",
//                         "B": "",
//                         "L": "",
//                         "R": "",
//                     },
//                     "Y-M-D_h-m-s_from_file": {
//                         "F": "",
//                         "B": "",
//                         "L": "",
//                         "R": "",
//                     },
//                 },
//                 "event": "event.json file path",
//                 "thumb": "thumb.png file path",
//             },
//         }
//     },
//     "AllClips": {
//         "Y-M-D_from_file": {
//             "h-m_from_file_start_to_end": {
//                 "Y-M-D_h-m-s_from_file": {
//                     "F": "",
//                     "B": "",
//                     "L": "",
//                     "R": "",
//                 },
//                 "Y-M-D_h-m-s_from_file": {
//                     "F": "",
//                     "B": "",
//                     "L": "",
//                     "R": "",
//                 },
//             },
//             "h-m_from_file_start_to_end": {
//                 "Y-M-D_h-m-s_from_file": {
//                     "F": "",
//                     "B": "",
//                     "L": "",
//                     "R": "",
//                 },
//                 "Y-M-D_h-m-s_from_file": {
//                     "F": "",
//                     "B": "",
//                     "L": "",
//                     "R": "",
//                 },
//             },
//         }
//     }
// };
```

## 项目概述

本项目是基于 Electron 实现的特斯拉行车记录仪播放器。用于读取特斯拉行车记录仪视频文件，组织并播放多路摄像头视频，支持显示车辆状态信息（CAN数据）。

## 核心功能

### 1. 文件管理
- 读取 TeslaCam 文件夹结构（RecentClips, SavedClips, SentryClips）
- 支持选择单个文件夹或整个 TeslaCam 目录
- 自动解析视频文件名中的时间戳和摄像头位置
- 按时间顺序组织视频片段

### 2. 视频播放
- 同时播放最多6路摄像头视频（前、后、左、右、左前、右前）
- 点击切换主视角（放大显示）
- 支持播放控制：播放/暂停、前进/后退5秒、倍速播放（1x, 2x, 4x, 8x）
- 键盘快捷键支持（空格播放/暂停，左右箭头控制进度）
- 进度条跳转和事件标记显示

### 3. 车辆状态显示
- 解析视频中的 SEI（补充增强信息）元数据
- 实时显示车辆状态：车速、档位、转向角度、刹车/油门状态、转向灯、自动驾驶状态
- 支持特斯拉特有的 CAN 数据展示

### 4. 文件操作
- 打开视频所在文件夹
- 删除单个视频或整个事件文件夹
- 自动保存浏览状态（滚动位置、展开状态）

## 系统架构

### 后端 (Main Process - src/main/)
- **main.js**: 主进程入口，负责窗口管理、文件系统操作、IPC通信
  - 文件夹选择对话框
  - TeslaCam 文件夹结构解析
  - 视频文件组织和分类
  - SEI 元数据解析（使用 protobuf 解析 dashcam.proto）
  - 文件删除操作
  - 窗口大小自适应调整

- **preload.js**: 预加载脚本，暴露安全的 Electron API 给渲染进程
  - `electronAPI`: 文件夹选择、窗口调整、文件操作、SEI解析等
  - `logger`: 日志工具

- **vendor/dashcam-mp4.js**: Tesla 官方提供的 MP4 解析器，用于提取 SEI 数据

### 前端 (Renderer Process - src/renderer/pages/)
- **video_clips_list/index.html**: 视频列表页面
  - 按日期时间线展示视频片段
  - 支持 Sentry、Saved、Recent 三种模式切换
  - 缩略图显示和时长信息
  - 文件操作按钮（打开文件夹、删除）

- **video_player/index.html & script.js**: 视频播放器页面
  - 多路视频同步播放控制
  - 车辆状态信息面板
  - 播放控制工具栏
  - 进度条和事件标记
  - 键盘快捷键处理

### 数据流
1. 用户选择文件夹 → 主进程解析文件夹结构 → 返回给渲染进程
2. 渲染进程展示视频列表 → 用户选择视频 → 跳转到播放器页面
3. 播放器加载视频 → 解析 SEI 数据 → 同步播放多路视频并显示车辆状态
4. 用户操作（播放控制、文件操作）通过 IPC 与主进程通信

## 文件结构约定

### TeslaCam 文件夹结构
```
TeslaCam/
├── RecentClips/          # 最近录制的视频片段
│   ├── 2024-08-10_14-52-34-front.mp4
│   ├── 2024-08-10_14-52-34-back.mp4
│   ├── 2024-08-10_14-52-34-left_repeater.mp4
│   └── 2024-08-10_14-52-34-right_repeater.mp4
├── SavedClips/           # 手动保存的事件
│   └── 2024-08-10_14-52/
│       ├── 2024-08-10_14-52-34-front.mp4
│       ├── 2024-08-10_14-52-34-back.mp4
│       ├── event.json    # 事件信息
│       └── thumb.png     # 缩略图
└── SentryClips/          # 哨兵模式事件
    └── 2024-08-10_14-52/
        ├── 2024-08-10_14-52-34-front.mp4
        ├── event.json
        └── thumb.png
```

### 视频文件名格式
`YYYY-MM-DD_HH-MM-SS-{position}.mp4`
- **position**: front（前）, back（后）, left_repeater（左）, right_repeater（右）, left_pillar（左前）, right_pillar（右前）

## 工程目录结构
```
src/
├── main/                 # 主进程代码
│   ├── main.js          # 主进程入口
│   ├── preload.js       # 预加载脚本
│   └── vendor/          # 第三方库
│       ├── dashcam-mp4.js      # Tesla MP4解析器
│       └── dashcam.proto       # SEI数据协议定义
└── renderer/pages/      # 渲染进程页面
    ├── video_clips_list/       # 视频列表页面
    │   └── index.html
    └── video_player/           # 视频播放器页面
        ├── index.html
        ├── script.js
        └── styles.css
```

## 技术栈
- **框架**: Electron 32.2.0
- **构建工具**: Electron Forge
- **数据解析**: protobufjs 7.5.4 (用于 SEI 元数据解析)
- **日志**: electron-log
- **UI**: 原生 HTML/CSS/JavaScript

## 开发命令
- `npm run start` - 启动开发服务器
- `npm run make` - 构建应用程序包
- `npm run package` - 打包应用程序

## 构建配置
- **平台支持**: macOS, Windows, Linux
- **图标**: 自定义特斯拉行车记录仪图标
- **安全配置**: 启用 Electron Fuses 安全选项
- **打包**: 使用 ASAR 打包应用资源

## 注意事项
1. SEI 数据解析依赖 Tesla 官方的 dashcam.proto 协议定义
2. 视频播放需要支持多路视频同步，注意性能优化
3. 文件操作需要谨慎处理，避免误删重要数据
4. 跨平台兼容性需要考虑不同系统的文件路径处理

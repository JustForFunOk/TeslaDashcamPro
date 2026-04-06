## 项目概述

本项目是基于electron实现的特斯拉行车记录仪播放器。其会读取用户选择的文件夹下文件组织起来展示和播放。

## 播放文件夹
- TeslaCam目录下包含RecentClips，SavedClips，SentryClips三个文件夹
- SavedClips，SentryClips这两个文件夹是文件夹
- RecentClips这个文件下是多个视频文件
- 每个视频文件的文件名的格式为2024-08-10_14-52-34-back.mp4这样，其中最后的单词代表相机的位置

## 工程目录
src/
    main/ 后端负责读取文件夹并根据文件夹名和文件名来组织播放
    renderer/pages 前端
        video_clips_list/ 组织成多个播放视频列表
        video_player/ 单段视频播放

## 常用命令
- npm run start 启动
- npm run make 构建

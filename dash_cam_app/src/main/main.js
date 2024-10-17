const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 定义允许的视频文件扩展名
const allowedExtensions = ['.mp4'];


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


// 帮助函数：解析文件名，返回时间戳和视频位置
function parseFileName(fileName) {
    const regex = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-(front|back|left_repeater|right_repeater)\.mp4$/;
    const match = fileName.match(regex);
    if (match) {
        const file_ts = `${match[1]}-${match[2]}-${match[3]}_${match[4]}-${match[5]}-${match[6]}`;
        const position = match[7];
        return { file_ts, position };
    }
    return null;
}

// 帮助函数：将文件信息加入到对应的位置
function addFileToDict(dict, file_ts, position, filePath) {
    if (!dict[file_ts]) {
        dict[file_ts] = { "F": "", "B": "", "L": "", "R": "" };
    }
    if (position === 'front') dict[file_ts].F = filePath;
    if (position === 'back') dict[file_ts].B = filePath;
    if (position === 'left_repeater') dict[file_ts].L = filePath;
    if (position === 'right_repeater') dict[file_ts].R = filePath;
}

// 帮助函数：按照时间戳分组
function groupByTime(clips, maxIntervalMinutes = 3) {
    const result = {};
    let currentGroup = [];
    let lastTimestamp = null;

    for (const clip of clips) {
        const currentTimestamp = new Date(clip.file_ts.replace('_', 'T')).getTime();
        if (lastTimestamp && (currentTimestamp - lastTimestamp) / 60000 > maxIntervalMinutes) {
            // 结束前一个组
            addGroupToResult(result, currentGroup);
            currentGroup = [];
        }
        currentGroup.push(clip);
        lastTimestamp = currentTimestamp;
    }
    if (currentGroup.length > 0) {
        addGroupToResult(result, currentGroup);
    }
    return result;
}

function addGroupToResult(result, group) {
    const start = group[0].file_ts.split('_')[1];
    const end = group[group.length - 1].file_ts.split('_')[1];
    const groupKey = `${start}-${end}`;
    result[groupKey] = {};
    for (const clip of group) {
        result[groupKey][clip.file_ts] = clip.files;
    }
}

// 主函数：遍历文件夹并返回处理后的结果
function scanDirectory(dir) {
    const result = {
        SavedClips: {},
        SentryClips: {},
        AllClips: {}
    };

    const allClips = [];

    // 递归读取目录
    function readDirRecursively(currentPath, parentFolder = '') {
        const files = fs.readdirSync(currentPath);

        files.forEach(file => {
            const fullPath = path.join(currentPath, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // 如果是SavedClips或SentryClips目录，递归处理子文件夹
                if (file === 'SavedClips' || file === 'SentryClips') {
                    const clipType = file;
                    result[clipType] = {};
                    const subfolders = fs.readdirSync(fullPath);
                    subfolders.forEach(subfolder => {
                        const subfolderPath = path.join(fullPath, subfolder);
                        if (fs.statSync(subfolderPath).isDirectory()) {
                            result[clipType][subfolder] = {};
                            readDirRecursively(subfolderPath, subfolder);
                        }
                    });
                } else {
                    readDirRecursively(fullPath);
                }
            } else if (stats.isFile()) {
                const parsed = parseFileName(file);
                if (parsed) {
                    const { file_ts, position } = parsed;
                    // 将文件加入相应的SavedClips/SentryClips字典
                    if (parentFolder) {
                        addFileToDict(result.SavedClips[parentFolder] || {}, file_ts, position, fullPath);
                        addFileToDict(result.SentryClips[parentFolder] || {}, file_ts, position, fullPath);
                    }
                    // 加入AllClips临时数组
                    allClips.push({ file_ts, files: { [position]: fullPath } });
                }
            }
        });
    }

    readDirRecursively(dir);

    // 处理AllClips，按照时间分组
    const groupedClips = groupByTime(allClips);
    result.AllClips = groupedClips;

    return result;
}


let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),  // 预加载文件
        }
    });

    mainWindow.loadFile('src/renderer/pages/video_clips_list/index.html');
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']  // 只允许选择文件夹
    });

    if (result.canceled) {
        return [];
    } else {
        const folderPath = result.filePaths[0];
        const videoFiles = scanDirectory(folderPath);  // 递归获取所有视频文件
        console.log(JSON.stringify(videoFiles, null, 2));
        return videoFiles;
    }
});

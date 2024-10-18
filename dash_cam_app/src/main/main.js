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


function parseTeslaCamFolder(folderPath) {
    const result = {
        SavedClips: [],
        SentryClips: [],
        AllClips: []
    };

    tmp_all_clips = [];

    const saved_clips_path = path.join(folderPath, 'SavedClips');
    if (fs.existsSync(saved_clips_path)) {
        processSubClips(saved_clips_path, result.SavedClips, tmp_all_clips);
    }

    const sentry_clips_path = path.join(folderPath, 'SentryClips');
    if (fs.existsSync(sentry_clips_path)) {
        processSubClips(sentry_clips_path, result.SentryClips, tmp_all_clips);
    }

    const recent_clips_path = path.join(folderPath, 'RecentClips');
    processAllClips(recent_clips_path, result.AllClips, tmp_all_clips);


    // 读取主目录
    // const mainDirs = ['SavedClips', 'SentryClips', 'RecentClips'];
    // mainDirs.forEach(dir => {
    //     const dirPath = path.join(folderPath, dir);
    //     if (fs.existsSync(dirPath)) {
    //         if (dir === 'RecentClips') {
    //             // processRecentClips(dirPath, result);
    //         } else {
    //             processSubClips(dirPath, dir, result);
    //         }
    //     }
    // });

    // 处理AllClips来自RecentClips, SavedClips和SentryClips
    // 

    return result;
}

function addVideoToDict(dict, position, fullPath) {
    if (position === 'front') dict.F = fullPath;
    if (position === 'back') dict.B = fullPath;
    if (position === 'left_repeater') dict.L = fullPath;
    if (position === 'right_repeater') dict.R = fullPath;
}

// dirPath输入的文件路径，为SavedClips或SentryClips文件夹路径
// result将结果填入对应的数据结构中
// all_clips用于后续处理所有的视频片段做准备
function processSubClips(dirPath, result, all_clips) {
    const subDirs = fs.readdirSync(dirPath).filter(subDir => fs.statSync(path.join(dirPath, subDir)).isDirectory());
    subDirs.sort();  // 正序，倒序放到渲染端操作
    subDirs.forEach(subDir => {
        let dataStructure = {
            timestamp: subDir,  // 文件夹中的时间戳
            clips: [],  // 视频列表
            jsonPath: "",  // event.json路径
            thumbPath: "",  // thumb.png路径
            duration: 0  // 
        };

        let tmp_clips = [];

        const subDirPath = path.join(dirPath, subDir);
        const files = fs.readdirSync(subDirPath);
        files.forEach(file => {
            if (file.endsWith('.mp4')) {
                tmp_clips.push(file);
            } else if (file === 'event.json') {
                dataStructure.jsonPath = path.join(subDirPath, file);
            } else if (file === 'thumb.png') {
                dataStructure.thumbPath = path.join(subDirPath, file);
            }
        }       
        );

        // 处理文件夹中的视频文件
        tmp_clips.sort();  // 正序，一组中的视频文件是正序的用于播放
        previous_ts = "";
        tmp_clips.forEach(clip_name => {
            const parsed = parseFileName(clip_name);

            // 只处理符合文件名规则的视频文件
            if (parsed) {
                const { file_ts, position } = parsed;

                if(file_ts != previous_ts){
                    // 新的时间戳，添加一组进结果中，因为不能保证一定有4路视频，所以通过文件名中的时间戳分组
                    dataStructure.clips.push(
                        {
                            filename_ts: file_ts,
                            videos: {
                                F: "",
                                B: "",
                                L: "",
                                R: ""
                            }
                        }
                    );  
                    previous_ts = file_ts;
                }
                
                const video_file_path = path.join(subDirPath, clip_name);
                
                addVideoToDict(dataStructure.clips.at(dataStructure.clips.length-1).videos, position, video_file_path);

                // 加入到all_clips中避免后续处理全部视频时重复遍历
                all_clips.push({
                    file_name: clip_name,
                    full_path: video_file_path
                });
            }       
        }
        );

        result.push(dataStructure);
    }
    );
}

// dirPath输入的文件路径，为SavedClips或SentryClips文件夹路径
// result将结果填入对应的数据结构中
// all_clips为前面Saved和Sentry中已经获取的视频
function processAllClips(recent_clips_folder, result, all_clips) {
    // 获取RecentClips文件夹下的视频文件
    if (fs.existsSync(recent_clips_folder)) {
        const files = fs.readdirSync(recent_clips_folder);

        files.forEach(clip_name =>{
            const parsed = parseFileName(clip_name);
            if(parsed){
                // tmp_all_clips全是符合命名规则的mp4文件
                all_clips.push({
                    file_name: clip_name,
                    full_path: path.join(recent_clips_folder, clip_name)
                });
            }
        }
        );
    }

    // 通过文件名来排序
    all_clips.sort((a, b)=>{a.file_name.localeCompare(b.file_name)});

    let lastTimestamp = null;
    let previous_ts = "";
    // 将4路视频组在一起，小组，同时按照时间间隔分大组
    const maxIntervalMinutes = 3;

    all_clips.forEach(clip =>{
        const parsed = parseFileName(clip.file_name);

        if(parsed){
            const { file_ts, position } = parsed;
            const currentTimestamp = new Date(file_ts.replace('_', 'T')).getTime();

            if (lastTimestamp===null || (currentTimestamp - lastTimestamp) / 60000 > maxIntervalMinutes) {
                // 创建一个新组
                result.push(
                    {
                        start_ts: "",
                        clips: [],
                        duration: 0
                    }
                );
            }

            if(file_ts != previous_ts) {
                // 创建小组
                result.at(result.length-1).clips.push(
                    {
                        filename_ts: file_ts,
                        videos: {
                            F: "",
                            B: "",
                            L: "",
                            R: ""
                        }
                    }
                );
                previous_ts = file_ts;
            }

            let small_group = result.at(result.length-1).clips;

            addVideoToDict(small_group.at(small_group.length-1).videos, position, clip.full_path);

            lastTimestamp = currentTimestamp;
        }
    }
    );

}


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
        // const videoFiles = scanDirectory(folderPath);  // 递归获取所有视频文件
        const videoFiles = parseTeslaCamFolder(folderPath);
        console.log(JSON.stringify(videoFiles, null, 2));
        return videoFiles;
    }
});

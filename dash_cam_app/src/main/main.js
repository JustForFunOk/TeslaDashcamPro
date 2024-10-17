const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 定义允许的视频文件扩展名
const allowedExtensions = ['.mp4'];


// 文件名格式为Y-M-D-h-m-s-front.mp4, Y-M-D-h-m-s-back.mp4, Y-M-D-h-m-s-left_repeater.mp4, Y-M-D-h-m-s-right_repeater.mp4
// Y-M-D-h-m-s代表时间
// front, back, left_repeater, right_repeater分别对应4个位置

// 通过文件名，将文件读取到结果中
// 其中返回结果的格式如下：
// ts为时间，通过文件名Y-M-D-h-m-s解析
// F,B,L,R分别对应文件名中为front,back,left_repeater,right_repeater的文件，这4个文件不一定都存在

// const RetType =
// {
//     "ts": {
//         "F": "",
//         "B": "",
//         "L": "",
//         "R": "",
//     },

//     "ts": {
//         "F": "",
//         "B": "",
//         "L": "",
//         "R": "",
//     },
// };


// 解析文件名，获取时间戳和对应的位置
function parseFileName(fileName) {
    const regex = /^(\d{4})-(\d{1,2})-(\d{1,2})_(\d{1,2})-(\d{1,2})-(\d{1,2})-(front|back|left_repeater|right_repeater)\.mp4$/;
    const match = fileName.match(regex);

    if (match) {
        const [_, year, month, day, hour, minute, second, position] = match;
        const ts = `${year}-${month}-${day} ${hour}:${minute}:${second}`; // 格式化时间

        return { ts, position }; // 返回时间戳和位置
    }

    return null; // 如果不匹配，返回null
}

// 递归遍历文件夹，获取所有视频文件并整理结果
function getAllVideoFiles(dir, includeSubfolders = true) {
    let videoFiles = {};  // 用于存储最终结果

    const files = fs.readdirSync(dir);  // 读取目录内容

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // 如果是文件夹，递归调用
            if (includeSubfolders) {
                const nestedFiles = getAllVideoFiles(filePath);
                videoFiles = { ...videoFiles, ...nestedFiles }; // 合并嵌套文件结果
            }
        } else {
            const ext = path.extname(file).toLowerCase();  // 获取文件扩展名
            if (allowedExtensions.includes(ext)) {
                // 如果是视频文件，解析文件名并组织结果
                const parsed = parseFileName(file);
                if (parsed) {
                    const { ts, position } = parsed;

                    // 确保时间戳作为键存在于结果中
                    if (!videoFiles[ts]) {
                        videoFiles[ts] = {
                            F: "",
                            B: "",
                            L: "",
                            R: ""
                        };
                    }

                    // 根据位置更新结果
                    switch (position) {
                        case 'front':
                            videoFiles[ts].F = filePath;
                            break;
                        case 'back':
                            videoFiles[ts].B = filePath;
                            break;
                        case 'left_repeater':
                            videoFiles[ts].L = filePath;
                            break;
                        case 'right_repeater':
                            videoFiles[ts].R = filePath;
                            break;
                    }
                }
            }
        }
    });

    // // 将结果按时间戳排序
    // const sortedVideoFiles = Object.entries(videoFiles)
    // .sort(([tsA], [tsB]) => new Date(tsA) - new Date(tsB))  // 根据时间戳排序
    // .reduce((acc, [ts, value]) => {
    //     acc[ts] = value;  // 转换回对象
    //     return acc;
    // }, {});

    // return sortedVideoFiles;  // 返回排序后的结果

    return videoFiles;  // 返回包含时间戳和对应路径的结果
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
        const videoFiles = getAllVideoFiles(folderPath);  // 递归获取所有视频文件
        return videoFiles;
    }
});

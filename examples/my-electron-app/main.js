const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 定义允许的视频文件扩展名
const allowedExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv'];

// 递归遍历文件夹，获取所有视频文件
function getAllVideoFiles(dir) {
    let videoFiles = {};

    const files = fs.readdirSync(dir);  // 读取目录内容

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // 如果是文件夹，递归调用
            const nestedFiles = getAllVideoFiles(filePath);
            videoFiles = { ...videoFiles, ...nestedFiles };
        } else {
            const ext = path.extname(file).toLowerCase();  // 获取文件扩展名
            if (allowedExtensions.includes(ext)) {
                // 如果是视频文件，添加到字典中
                videoFiles[file] = filePath;
            }
        }
    });

    return videoFiles;
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

    mainWindow.loadFile('index.html');
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
        return videoFiles;  // 返回文件名为key，路径为value的字典
    }
});

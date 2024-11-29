const { app, BrowserWindow, Menu, dialog, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// 将saved 和 sentry 文件夹下的也加入到recent中，目的是组成连贯的视频。
// 但是会导致recent中视频段变得很多，先关掉这个功能
const addSavedAndSentryToRecent = false;

async function parseTeslaCamFolder(folderPath) {
    const result = {
        // 使用字符串以便放到URL中传递给视频播放页面
        "SavedClips": [],
        "SentryClips": [],
        "AllClips": []
    };

    tmp_all_clips = [];

    const saved_clips_path = path.join(folderPath, 'SavedClips');
    if (fs.existsSync(saved_clips_path)) {
        await processSubClips(saved_clips_path, result["SavedClips"], tmp_all_clips);
    }

    const sentry_clips_path = path.join(folderPath, 'SentryClips');
    if (fs.existsSync(sentry_clips_path)) {
        await processSubClips(sentry_clips_path, result["SentryClips"], tmp_all_clips);
    }

    const recent_clips_path = path.join(folderPath, 'RecentClips');
    if (fs.existsSync(recent_clips_path)) {
        processSingleFolderClips(recent_clips_path, tmp_all_clips);
    }

    // 处理单文件夹下的视频文件 用于选择单一文件夹的场景
    processSingleFolderClips(folderPath, tmp_all_clips);


    // 处理AllClips来自RecentClips, SavedClips和SentryClips或当前文件夹下的视频文件
    await processAllClips(tmp_all_clips, result["AllClips"]);

    return result;
}

function addVideoToDict(dict, position, fullPath) {
    if (position === 'front') dict.F = fullPath;
    if (position === 'back') dict.B = fullPath;
    if (position === 'left_repeater') dict.L = fullPath;
    if (position === 'right_repeater') dict.R = fullPath;
}

async function processSingleFolderClips(dirPath, all_clips) {
    // 获取RecentClips文件夹下的视频文件
    const files = fs.readdirSync(dirPath);

    files.forEach(clip_name => {
        const parsed = parseFileName(clip_name);
        if (parsed) {
            // tmp_all_clips全是符合命名规则的mp4文件
            all_clips.push({
                file_name: clip_name,
                full_path: path.join(dirPath, clip_name)
            });
        }
    }
    );
}

// dirPath输入的文件路径，为SavedClips或SentryClips文件夹路径
// result将结果填入对应的数据结构中
// all_clips用于后续处理所有的视频片段做准备
async function processSubClips(dirPath, result, all_clips) {
    const subDirs = fs.readdirSync(dirPath).filter(subDir => fs.statSync(path.join(dirPath, subDir)).isDirectory());
    subDirs.sort();  // 正序，倒序放到渲染端操作

    for (const subDir of subDirs) {
        let dataStructure = {
            timestamp: subDir,  // 文件夹中的时间戳
            clips: [],  // 视频列表
            jsonPath: "",  // event.json路径
            thumbPath: "",  // thumb.png路径
            duration: 0  // 暂时还未使用
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

                if (file_ts != previous_ts) {
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

                addVideoToDict(dataStructure.clips.at(dataStructure.clips.length - 1).videos, position, video_file_path);

                if (addSavedAndSentryToRecent) {
                    // 加入到all_clips中避免后续处理全部视频时重复遍历
                    all_clips.push({
                        file_name: clip_name,
                        full_path: video_file_path
                    });
                }

            }
        }
        );

        // 计算duration
        dataStructure.duration = await getClipsDuration(dataStructure.clips);

        result.push(dataStructure);
    }

}

// result将结果填入对应的数据结构中
// all_clips为前面Saved和Sentry中已经获取的视频
async function processAllClips(all_clips, result) {
    // 通过文件名来排序
    all_clips.sort((a, b) => { return a.file_name.localeCompare(b.file_name); });

    let lastTimestamp = null;
    let previous_ts = "";
    // 将4路视频组在一起，小组，同时按照时间间隔分大组
    const maxIntervalMinutes = 3;

    all_clips.forEach(clip => {
        const parsed = parseFileName(clip.file_name);

        if (parsed) {
            const { file_ts, position } = parsed;
            const currentTimestamp = formatTimestamp(file_ts);

            if (lastTimestamp === null || (currentTimestamp - lastTimestamp) / 60000 > maxIntervalMinutes) {
                // 创建一个新组
                result.push(
                    {
                        timestamp: file_ts,  // 第一段视频的时间戳
                        clips: [],  // 视频列表
                        jsonPath: "",  // event.json路径
                        thumbPath: "",  // thumb.png路径
                        duration: 0  // 暂时还未使用
                    }
                );
            }

            if (file_ts != previous_ts) {
                // 创建小组
                result.at(result.length - 1).clips.push(
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

            let small_group = result.at(result.length - 1).clips;

            addVideoToDict(small_group.at(small_group.length - 1).videos, position, clip.full_path);

            lastTimestamp = currentTimestamp;
        }
    }
    );

    // 最后计算每个group的时长
    // 计算duration
    for (let clip_group of result) {
        clip_group.duration = await getClipsDuration(clip_group.clips);
    }
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


// YYYY-MM-DD_HH-MM-SS
function formatTimestamp(timestamp_str) {
    const [datePart, timePart] = timestamp_str.split('_');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds); // 月份从0开始
};

async function getClipsDuration(sorted_clips) {
    // 假设视频是连续的，除最后一个视频其他视频使用文件中的时间戳计算时长
    let duration_s = 0;

    const clips_num = sorted_clips.length;

    if (clips_num === 0) {
        return duration_s;
    }

    if (clips_num > 1) {
        // 最后一个视频的时间戳
        const last_ts = sorted_clips.at(clips_num - 1).filename_ts;
        const lastTimestamp = formatTimestamp(last_ts);

        // 第一个视频的时间戳
        const first_ts = sorted_clips.at(0).filename_ts;
        const firstTimestamp = formatTimestamp(first_ts);

        // 相减
        duration_s = (lastTimestamp - firstTimestamp) / 1000;
        // console.log("clip minus: %f", duration_s);
    }

    // 调用接口太费时了，所以假设最后一个视频长度是60s 等到实际播放的时候再更新duration
    // 加上最后一个视频的时间戳 通过ffmpeg获取视频时长
    // const last_video_duration = await getClipDuration(sorted_clips.at(clips_num - 1).videos);
    const last_video_duration = 60;

    // console.log("clip last_video_duration: %f", last_video_duration);

    duration_s += Math.ceil(last_video_duration);  // 保留到s

    // console.log("clip duration: %f", duration_s);

    return duration_s;
}

// 获取指定文件夹或子文件夹下所有名为 decoded_can 文件夹下的所有json文件
function findJsonFilesInDecodedCan(dirPath) {
    const result = [];

    // 递归查找文件夹
    function exploreFolder(currentPath) {
        const files = fs.readdirSync(currentPath);
        for (let file of files) {
            const fullPath = path.join(currentPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 如果是目录，检查其是否为 decoded_can
                if (file === 'decoded_can') {
                    // 查找该文件夹下所有的 JSON 文件
                    const decodedCanFiles = fs.readdirSync(fullPath);
                    for (let decodedFile of decodedCanFiles) {
                        if (decodedFile.endsWith('.json')) {
                            // 提取时间戳（假设文件名格式为 "YYYY-MM-DD_HH-MM-SS.json"）
                            const timestamp = decodedFile.split('.')[0]; // 获取文件名部分，去除扩展名
                            result.push({
                                timestamp: timestamp,
                                filePath: path.join(fullPath, decodedFile)
                            });
                        }
                    }
                } else {
                    // 继续递归子文件夹
                    exploreFolder(fullPath);
                }
            }
        }
    }

    // 开始遍历
    exploreFolder(dirPath);

    // 对结果按照时间戳进行排序
    result.sort((a, b) => { return a.timestamp.localeCompare(b.timestamp); });

    return result;
}

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        // resizable: false, // 禁止窗口缩放
        // maximizable: false,    // 禁止最大化
        // fullscreenable: false, // 禁止全屏
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),  // 预加载文件
        }
    });

    // 隐藏菜单栏  隐藏之后前端调试页面就无法用了 先不隐藏
    // Menu.setApplicationMenu(null);

    // mainWindow.setAspectRatio(4 / 3, { width: 0, height: 140 });

    mainWindow.on('maximize', () => {
        mainWindow.unmaximize();
    });

    mainWindow.loadFile('src/renderer/pages/video_clips_list/index.html');
});

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']  // 只允许选择文件夹
    });

    if (result.canceled) {
        return [false, []];
    } else {
        const folderPath = result.filePaths[0];
        // const videoFiles = scanDirectory(folderPath);  // 递归获取所有视频文件
        const videoFiles = await parseTeslaCamFolder(folderPath);
        // console.log(JSON.stringify(videoFiles, null, 2));

        // 尝试加载所有CAN数据路径
        const decodedCanFiles = findJsonFilesInDecodedCan(folderPath);

        return [true, videoFiles, decodedCanFiles];
    }
});

ipcMain.handle('resize-window', (event, videoWidth, videoHeight, extraWidth, extraHeight) => {
    // 获取主显示器的分辨率
    // const { width: displayWidth, height: displayHeight } = screen.getPrimaryDisplay().workAreaSize;

    // 获取显示器能显示的宽高
    // 获取窗口的当前位置
    const { x: winX, y: winY } = mainWindow.getBounds();
    // 获取窗口所在的显示器
    const display = screen.getDisplayNearestPoint({ x: winX, y: winY });
    // workAreaSize会去除显示器窗口上已有的系统导航栏等
    const { width: maxDisplayWidth, height: maxDisplayHeight } = display.workAreaSize;

    // 不占满整个空间，只使用80%的区域显示
    const displayWidth = Math.floor(0.9 * maxDisplayWidth);
    const displayHeight = Math.floor(0.9 * maxDisplayHeight);

    // 获取需要的宽高
    const desiredWidth = videoWidth + extraWidth;
    const desireHeight = videoHeight + extraHeight;

    let finalWindowWidth = desiredWidth;
    let finalWindowHeight = desireHeight;

    // 需要缩小显示
    if (desiredWidth > displayWidth || desireHeight > displayHeight) {

        if (desireHeight / displayHeight > desiredWidth / displayWidth) {
            // 将高度缩放到最大能显示的尺寸，此时宽度肯定不会超出显示范围
            finalWindowHeight = displayHeight;
            finalWindowWidth = Math.floor(videoWidth / videoHeight * (finalWindowHeight - extraHeight));
        } else {
            finalWindowWidth = displayWidth;
            finalWindowHeight = Math.floor((finalWindowWidth - extraWidth) * videoHeight / videoWidth);
        }
    }

    mainWindow.setContentSize(finalWindowWidth, finalWindowHeight);
})

const players = [
    document.getElementById('video-f'),  // F
    document.getElementById('video-b'),  // B
    document.getElementById('video-l'),  // L
    document.getElementById('video-r')   // R
];

const play_pause_icon = document.getElementById('play-pause-icon');
const progressBar = document.getElementById('progress-bar');
const timeDisplay = document.getElementById('timestamp');
const vehicleSpeed = document.getElementById('speed');
const gearPosition = document.getElementById('gear');
const acceleratorPedal = document.getElementById('accelerator-pedal');
const accelPercentage = document.getElementById('accel-percentage-text');
const turnLeftIndicator = document.getElementById('left-turn-light');
const turnRightIndicator = document.getElementById('right-turn-light');
const currentTime = document.getElementById('current-time');
const totalDuration = document.getElementById('total-duration');
const xSpeedText = document.getElementById('x-speed-text');
const xSpeedButton = document.getElementById('x-speed-btn');

// 当前播放的clips group中的视频索引
let currentIndex = 0;

// 所有视频段的总长度，如10分多钟就是11个视频
let totalClipsNumber = 0;

// 这个变量不会有data race的情况，标准的浏览器环境中的 JavaScript 是单线程的
let loaded_videos_channel_cnt = 0;  // 已经准备好播放的路数
let ended_videos_channel_cnt = 0;  // 当前视频源已播放完毕的路数

let valid_video_channels = [];
let valid_videos_channel_cnt = 0; // 有数据的路数 最多是4路

// 4路都加载完毕自动播放
let is_playing = true;

// 默认选择前视最大化显示
let selectedPlayer = players[0];

// 整个视频段的时长，用来设置进度条的长度
let clipsDuration = 0;

// 每段视频开始的时间戳 用于视频切换
let clipsGroupStartTimestamp = [];

let hasResizeWindow = false;

let currentPlaybackRate = 1;
const maxPlaybackRate = 8;

// CAN时间与视频时间的差值，若CAN时间比视频时间提前这个值为正，否则为负
const deltaT = 0.0;

let twoMinutesJsonCanData = [];

// 返回按钮点击事件，跳转回主页面
const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.back();  // 这个可以跳转回之前的位置
});


// YYYY-MM-DD_HH-MM-SS
function filenameDateToJsDate(timestamp_str) {
    const [datePart, timePart] = timestamp_str.split('_');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds); // 月份从0开始
};

function jsDateToFilenameDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份是从0开始的，需要加1，并补充零位
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}


function getWeekdayName(date) {
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return weekdays[date.getDay()];
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const weekDay = getWeekdayName(date);
    return `${weekDay}  ${year}-${month}-${day}  ${hours}:${minutes}:${seconds}`;
}

// 将视频时间转换为can信号时间
// date 当前播放的时间
// decimalPart 当前播放的0.1s部分
// deltaT can信号中的时间与视频时间的时间差，单位s，浮点数，精确到小数点后1位，如1.5
function getCurrentCanDate(date, decimalPart, deltaT) {
    const canTsMs = date.getTime() + decimalPart * 100 + deltaT * 1000;
    const videoDate = new Date(canTsMs);

    const year = videoDate.getFullYear();
    const month = String(videoDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始
    const day = String(videoDate.getDate()).padStart(2, '0');
    const hours = String(videoDate.getHours()).padStart(2, '0');
    const minutes = String(videoDate.getMinutes()).padStart(2, '0');
    const seconds = String(videoDate.getSeconds()).padStart(2, '0');
    const decimal = Math.floor(videoDate.getMilliseconds() / 100);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${decimal}`;
}


// 将输入的时长（以秒为单位）转换为小时:分钟:秒 的格式
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // 格式化为两位数
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    // 根据小时数判断格式
    if (hours > 0) {
        const formattedHours = String(hours).padStart(2, '0');
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
        return `${formattedMinutes}:${formattedSeconds}`;
    }
}

// targetDateStr 格式：2024-10-03T16:41:20.2
function binarySearchLoadedCanData(canJsonList, targetDateStr) {
    let left = 0;
    let right = canJsonList.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        const comparison = canJsonList[mid].ts.localeCompare(targetDateStr);

        if (comparison === 0) {
            return mid;  // 找到目标字符串，返回索引
        } else if (comparison < 0) {
            left = mid + 1;  // 目标字符串应该在右侧
        } else {
            right = mid - 1; // 目标字符串应该在左侧
        }
    }

    if (right < 0) {
        right = 0;
    }

    if (right > canJsonList.length - 1) {
        right = canJsonList.length - 1;
    }

    // 如果没有找到目标字符串，返回右指针位置的前一个位置
    return right;
}

players[0].addEventListener('timeupdate', () => {
    // TODO: 限制下述代码的执行频率
    // 通过目前播放的视频 计算出进度条的进度
    // 第一个视频片段的起始时间
    const first_ts = savedVideoFiles[type].at(index).clips.at(0).filename_ts;
    const firstTimestamp = filenameDateToJsDate(first_ts);

    // 目前视频片段的起始时间
    const current_clip_ts = savedVideoFiles[type].at(index).clips.at(currentIndex).filename_ts;
    const currentClipStartTimestamp = filenameDateToJsDate(current_clip_ts);

    // 目前视频片段的播放时间
    const playTimeInClip = players[0].currentTime;

    // 计算出当前播放进度在整个视频片段中的时长，设置进度条
    progressBar.value = playTimeInClip + (currentClipStartTimestamp - firstTimestamp) / 1000;

    // 当前播放到的时间戳
    const currentFrameTimestamp = currentClipStartTimestamp;
    currentFrameTimestamp.setSeconds(currentFrameTimestamp.getSeconds() + Math.round(playTimeInClip));

    // 计算0.1s的部分
    const decimalPart = Math.floor((playTimeInClip % 1) * 10);

    // 当前时间戳转换为用于显示的格式
    const currentDate = formatDate(currentFrameTimestamp);

    // 更新时间戳
    currentTime.innerHTML = formatDuration(progressBar.value);
    timeDisplay.innerHTML = currentDate;

    // ISO 8601 格式的日期，当地时间 2024-10-03T16:35:09.7
    const canDate = getCurrentCanDate(currentFrameTimestamp, decimalPart, deltaT);

    // 转换为can数据的时间戳，二分查找对应can数据
    const dataIndex = binarySearchLoadedCanData(twoMinutesJsonCanData, canDate);

    const canData = twoMinutesJsonCanData[dataIndex];

    if (canData) {
        if (typeof canData.v === "number" && canData.v >= 0) {
            vehicleSpeed.innerHTML = canData.v + ' km/h';
        }

        switch (canData.gear) {
            case "DI_GEAR_D":
                gearPosition.innerHTML = "D";
                break;
            case "DI_GEAR_P":
                gearPosition.innerHTML = "P";
                break;
            case "DI_GEAR_R":
                gearPosition.innerHTML = "R";
                break;
            case "DI_GEAR_N":
                gearPosition.innerHTML = "N";
                break;
            default:
                break;
        }

        if(canData.accel_pos > 0.0) {
            acceleratorPedal.style.filter = "invert(50%) sepia(100%) saturate(1000%) hue-rotate(90deg)";
            accelPercentage.innerHTML = Math.round(canData.accel_pos) + "%";
        } else {
            acceleratorPedal.style.filter = "";
            accelPercentage.innerHTML = "";
        }

        if (canData.turn_left == "TURN_SIGNAL_ACTIVE_HIGH" || canData.turn_left == "TURN_SIGNAL_ACTIVE_LOW") {
            // addGreenFilter();
            turnLeftIndicator.style.filter = "invert(50%) sepia(100%) saturate(1000%) hue-rotate(90deg)";
        } else {
            // removeGreenFilter();
            turnLeftIndicator.style.filter = "";
        }

        if (canData.turn_right == "TURN_SIGNAL_ACTIVE_HIGH" || canData.turn_right == "TURN_SIGNAL_ACTIVE_LOW") {
            // addGreenFilter();
            turnRightIndicator.style.filter = "invert(50%) sepia(100%) saturate(1000%) hue-rotate(90deg)";
        } else {
            // removeGreenFilter();
            turnRightIndicator.style.filter = "";
        }

        // canData.hazard_light这个显示这里无需判断，触发双闪的时候，turn_left和turn_right会同时触发，可以达到双闪的显示效果
        // if (canData.hazard_light == "TURN_SIGNAL_ACTIVE_HIGH")

    }
});

// 播放暂停按钮
function togglePlayPause() {
    if (is_playing) {
        pauseAllVideos();
        // 暂停则恢复播放1倍速播放
        setPlaybackRate(1);
    } else {
        if (currentIndex < totalClipsNumber) {
            playAllVideos();
        } else {
            // 播放完毕 再次点击播放按钮 从头开始播放
            currentIndex = 0;
            setVideosSrc(currentIndex);
            is_playing = true;
        }
    }
}

// 回退5s
async function backward5Seconds() {
    const newValue = Number(progressBar.value) - 5;
    progressBar.value = newValue;
    await changeProgressBarValue();
}

// 倍速播放
function forwardXSpeed() {
    setPlaybackRate(currentPlaybackRate * 2);
    playAllVideos();
}

function setPlaybackRate(rate) {
    currentPlaybackRate = rate;
    if (currentPlaybackRate > maxPlaybackRate) {
        currentPlaybackRate = 1;
    }
    players.forEach(player => {
        player.playbackRate = currentPlaybackRate;
    });
    xSpeedText.innerHTML = currentPlaybackRate + "x";

    if (currentPlaybackRate == 1) {
        xSpeedButton.classList.remove('selected');
    } else {
        xSpeedButton.classList.add('selected');
    }
}



// 创建一个函数来根据 ts 查找 v 值
function getValueByTs(newTs) {
    const result = jsonData.find(item => item.ts === newTs);

    if (result) {
        // console.log(`The value of v for ts ${newTs} is: ${result.v}`);
        return result.v;
    } else {
        // console.log(`No entry found for ts: ${newTs}`);
        return -1;
    }
}

// 加载数据
// 获取URL中的查询参数
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type');
const index = urlParams.get('index');

// 通过sessionStorage实现快页面的数据共享
const savedVideoFiles = JSON.parse(sessionStorage.getItem('videoFiles'));
const decodedCanFiles = JSON.parse(sessionStorage.getItem('decodedCanFiles'));

if (savedVideoFiles) {
    if (type in savedVideoFiles && savedVideoFiles[type].length > index) {
        // 设置进度条长度
        // 这里的duration是假设最后一段视频长度为1min，需要等到播放到最后一段时更新总时长
        progressBar.max = savedVideoFiles[type].at(index).duration;
        totalDuration.innerHTML = formatDuration(progressBar.max);

        totalClipsNumber = savedVideoFiles[type].at(index).clips.length;

        // 获取每段视频的起始时间
        savedVideoFiles[type].at(index).clips.forEach(clip => {
            clipsGroupStartTimestamp.push(filenameDateToJsDate(clip.filename_ts));
        });

        setVideosSrc(currentIndex);
    }
}

// targetDateStr 格式：YYYY-MM-DD_HH-MM-SS
function binarySearchCanJsonFile(canJsonList, targetDateStr) {
    let left = 0;
    let right = canJsonList.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        const comparison = canJsonList[mid].timestamp.localeCompare(targetDateStr);

        if (comparison === 0) {
            return mid;  // 找到目标字符串，返回索引
        } else if (comparison < 0) {
            left = mid + 1;  // 目标字符串应该在右侧
        } else {
            right = mid - 1; // 目标字符串应该在左侧
        }
    }

    if (right < 0) {
        right = 0;
    }

    if (right > canJsonList.length - 1) {
        right = canJsonList.length - 1;
    }

    // 如果没有找到目标字符串，返回右指针位置的前一个位置
    return right;
}

// 根据视频的时间戳来查找并加载对应的json文件
// 查找前一个，当前，下一个共3个can json文件
// 由于视频时间和CAN信号时间存在差异，所以前一个文件也加载以避免在极端情况下对应不上正确的can
async function loadTwoMinutesCanData(video_ts) {
    twoMinutesJsonCanData.length = 0;

    // 加上时间偏置，获取真实的对应到can到时间
    const targetCanDate = filenameDateToJsDate(video_ts);
    targetCanDate.setSeconds(targetCanDate.getSeconds() + Math.floor(deltaT));
    const targetCanDateStr = jsDateToFilenameDate(targetCanDate);

    // 根据时间戳找到要加载的两个json文件
    fileIndex = binarySearchCanJsonFile(decodedCanFiles, targetCanDateStr);

    if (fileIndex >= 0 && fileIndex < decodedCanFiles.length) {
        // 检查是否是临近时间的数据 1.5min内
        const jsonDate = filenameDateToJsDate(decodedCanFiles[fileIndex].timestamp);
        const deltaMs = targetCanDate - jsonDate;
        try {
            const file1 = decodedCanFiles[fileIndex].filePath;
            const response = await fetch(file1);
            const data = await response.json();
            twoMinutesJsonCanData = data;
            console.log('JSON data loaded successfully: %s', file1);
        } catch (error) {
            console.error('Error loading JSON:', error);
        }
    }

    if (fileIndex + 1 >= 0 && fileIndex + 1 < decodedCanFiles.length) {
        // 检查是否是临近时间的数据 1.5min内
        const jsonDate = filenameDateToJsDate(decodedCanFiles[fileIndex + 1].timestamp);
        const deltaMs = targetCanDate - jsonDate;
        if (Math.abs(deltaMs) < 1.5 * 60000) {
            try {
                const file2 = decodedCanFiles[fileIndex + 1].filePath;
                const response = await fetch(file2);
                const data = await response.json();
                twoMinutesJsonCanData.push(...data);
                console.log('JSON data loaded successfully: %s', file2);
            } catch (error) {
                console.error('Error loading JSON:', error);
            }
        }
    }
}


async function setVideosSrc(clipsIndex) {
    // 设置播放源
    if (clipsIndex < savedVideoFiles[type].at(index).clips.length) {
        const video_ts = savedVideoFiles[type].at(index).clips.at(clipsIndex).filename_ts;
        // 加载can文件，通过视频时间戳查找对应can文件并加载

        // video_ts格式如：2024-10-03_16-35-13
        await loadTwoMinutesCanData(video_ts);

        const videos = savedVideoFiles[type].at(index).clips.at(clipsIndex).videos;

        valid_videos_channel_cnt = 0;
        valid_video_channels = [];

        if (videos.F === '') {
            players[0].removeAttribute("src");
            players[0].poster = "no_video_min.svg";
            players[0].classList.add("not-allowed-click");
        } else {
            players[0].src = videos.F;
            players[0].removeAttribute("poster");
            players[0].classList.remove("not-allowed-click");
            valid_video_channels.push("F");
            valid_videos_channel_cnt++;
        }
        players[0].load();

        if (videos.B === '') {
            players[1].removeAttribute("src");
            players[1].poster = "no_video_min.svg";
            players[1].classList.add("not-allowed-click");
        } else {
            players[1].src = videos.B;
            players[1].removeAttribute("poster");
            players[1].classList.remove("not-allowed-click");
            valid_video_channels.push("B");
            valid_videos_channel_cnt++;
        }
        players[1].load();

        if (videos.L === '') {
            players[2].removeAttribute("src");
            players[2].poster = "no_video_min.svg";
            players[2].classList.add("not-allowed-click");
        } else {
            players[2].src = videos.L;
            players[2].removeAttribute("poster");
            players[2].classList.remove("not-allowed-click");
            valid_video_channels.push("L");
            valid_videos_channel_cnt++;
        }
        players[2].load();

        if (videos.R === '') {
            players[3].removeAttribute("src");
            players[3].poster = "no_video_min.svg";
            players[3].classList.add("not-allowed-click");
        } else {
            players[3].src = videos.R;
            players[3].removeAttribute("poster");
            players[3].classList.remove("not-allowed-click");
            valid_video_channels.push("R");
            valid_videos_channel_cnt++;
        }
        players[3].load();

        loaded_videos_channel_cnt = 0;  // 清零等待加载完毕
        ended_videos_channel_cnt = 0;
    }
    // 接下来会触发loadeddata事件
}


players.forEach(player => {
    // 4个视频都加载第一帧完毕后再同步播放
    player.addEventListener('loadeddata', () => {
        loaded_videos_channel_cnt++;

        if (loaded_videos_channel_cnt === valid_videos_channel_cnt) {
            // 初次加载时会根据视频分辨率缩放窗口
            if (!hasResizeWindow) {
                resizeWindow();
                hasResizeWindow = true;
            }

            // 默认最后一段视频长度是1min，但很多情况下并不是，等到播放到最后哦一段时更新总时长
            if (currentIndex == totalClipsNumber - 1) {
                progressBar.max = savedVideoFiles[type].at(index).duration - 60 + Math.round(selectedPlayer.duration);
                totalDuration.innerHTML = formatDuration(progressBar.max);
            }

            // 设置倍率需要等缓冲完，否则设置不生效
            players.forEach(player => {
                player.playbackRate = currentPlaybackRate;
            });

            // 如果用户暂停播放，拖动进度条视频跨越了视频，加载完成之后，不自动播放
            // 最开始的时候，加载完成之后，自动播放
            if (is_playing) {
                playAllVideos();
            }
        }
    });

    // 播放完视频自动播放下一个
    // 当当前视频播放结束时，加载并播放下一个视频
    player.addEventListener('ended', async () => {
        ended_videos_channel_cnt++;
        if (ended_videos_channel_cnt === valid_videos_channel_cnt) {
            // 4路视频都播放完毕
            currentIndex++;

            if (currentIndex < totalClipsNumber) {
                await setVideosSrc(currentIndex);
            } else {
                // 播放到进度条结束
                play_pause_icon.src = "play.svg";
                is_playing = false;
            }
        }
    });
});

function playAllVideos() {
    players.forEach(player => {
        if (player.hasAttribute("src")) {
            player.play();
        }
    });
    play_pause_icon.src = "pause_min.svg";
    is_playing = true;
}

function pauseAllVideos() {
    players.forEach(player => {
        if (player.hasAttribute("src")) {
            player.pause();

            // 当暂停时，将所有视频同步到被放大视频的当前时间，防止4路播放不同步
            player.currentTime = selectedPlayer.currentTime;
        }
    });

    play_pause_icon.src = "play.svg";
    is_playing = false;
}

function selectVideo(selectedVideo) {
    // 获取所有视频元素
    players.forEach(player => {
        if (player === selectedVideo) {
            // 放大选中的视频
            player.classList.remove('small');
            player.classList.add('large');

            // 清除定位属性，使放大视频居中
            selectedVideo.style.top = '0';
            selectedVideo.style.left = '0';
            selectedVideo.style.right = '';
            selectedVideo.style.bottom = '';

            selectedPlayer = selectedVideo;
        } else {
            // 缩小其他视频
            player.classList.remove('large');
            player.classList.add('small');

            // 清除定位属性，确保视频回到它的小角落
            player.style.top = '';
            player.style.left = '';
            player.style.right = '';
            player.style.bottom = '';
        }
    });
}


// 设置视频的播放时间
function setVideoTime(time) {
    players.forEach(player => {
        player.currentTime = time;
    });
}

function binarySearchDates(dates, targetDate) {
    let left = 0;
    let right = dates.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (dates[mid].getTime() === targetDate.getTime()) {
            return mid; // 找到目标，返回索引
        } else if (dates[mid] < targetDate) {
            left = mid + 1; // 在右侧继续查找
        } else {
            right = mid - 1; // 在左侧继续查找
        }
    }

    // 如果目标时间比最新的还要新，返回最大的索引
    if (left === dates.length) {
        return dates.length - 1; // 返回最后一个索引
    }

    return right; // 返回找到的最大索引
}

// 当用户拖动进度条时同步视频的播放时间
function syncProgressWithVideo() {
    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('input', changeProgressBarValue);
}

async function changeProgressBarValue() {
    // 第一个视频时间戳 + 进度条值 = 进度条绝对时间
    let currentFrameTimestamp = new Date(clipsGroupStartTimestamp[0]);
    currentFrameTimestamp.setSeconds(currentFrameTimestamp.getSeconds() + Math.round(progressBar.value));

    // 通过绝对时间查找所属的视频段
    let clips_index = binarySearchDates(clipsGroupStartTimestamp, currentFrameTimestamp);

    // 获取在视频段中的时间
    const clip_time = (currentFrameTimestamp - clipsGroupStartTimestamp[clips_index]) / 1000;

    // 切换视频源
    if (clips_index != currentIndex) {
        await setVideosSrc(clips_index);
        currentIndex = clips_index;
    }

    // 设置视频当前时间
    setVideoTime(clip_time); // 将所有视频同步到进度条的当前值
}

function resizeWindow() {
    // 获取分辨率
    const videoW = selectedPlayer.videoWidth;
    const videoH = selectedPlayer.videoHeight;
    const extraWidth = 0;  // 若左边显示3D渲染结果则需要设置这个值
    const extraHeight = 120;  // 这个根据实际情况手动调节，TODO可以自动 
    window.electronAPI.resizeWindow(videoW, videoH, extraWidth, extraHeight);
}

// 在页面加载后调用 selectVideo，选择 video-f
window.onload = function () {
    selectVideo(players[0]); // 主动选择 video-f
    syncProgressWithVideo(); // 启用拖动进度条同步功能
};

// 开始时更新进度条
// updateProgress();
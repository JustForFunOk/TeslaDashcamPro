// 获取DOM元素
const mainVideo = document.getElementById('main-video');
const thumbnailItems = {
    'F': document.querySelector('.thumbnail-item[data-view="F"]'),
    'B': document.querySelector('.thumbnail-item[data-view="B"]'),
    'L': document.querySelector('.thumbnail-item[data-view="L"]'),
    'R': document.querySelector('.thumbnail-item[data-view="R"]'),
    'LF': document.querySelector('.thumbnail-item[data-view="LF"]'),
    'RF': document.querySelector('.thumbnail-item[data-view="RF"]')
};
const thumbnailVideos = {
    'F': thumbnailItems['F'].querySelector('.thumbnail-video'),
    'B': thumbnailItems['B'].querySelector('.thumbnail-video'),
    'L': thumbnailItems['L'].querySelector('.thumbnail-video'),
    'R': thumbnailItems['R'].querySelector('.thumbnail-video'),
    'LF': thumbnailItems['LF'].querySelector('.thumbnail-video'),
    'RF': thumbnailItems['RF'].querySelector('.thumbnail-video')
};

const timeDisplay = document.getElementById('timestamp');

const canDataDisplay = document.getElementById('can-data');
const drivingMode = document.getElementById('driving-mode');
const steeringWheelIcon = document.getElementById('steering-wheel-icon');
const drivingModeText = document.getElementById('driving-mode-text');
const vehicleSpeed = document.getElementById('speed');
const gearPosition = document.getElementById('gear');
const brakePedal = document.getElementById('brake-pedal');
const acceleratorPedal = document.getElementById('accelerator-pedal');
const accelPercentage = document.getElementById('accel-percentage-text');
const turnLeftIndicator = document.getElementById('left-turn-light');
const turnRightIndicator = document.getElementById('right-turn-light');
const backButton = document.getElementById('back-button');
const backwardButton = document.getElementById('backward-btn');
const playPauseButton = document.getElementById('play-pause-btn');
const xSpeedButton = document.getElementById('x-speed-btn');
const playPauseIcon = document.getElementById('play-pause-icon');
const progressBar = document.getElementById('progress-bar');
const eventMarker = document.getElementById('event-marker');
const currentDuration = document.getElementById('current-time');
const totalDuration = document.getElementById('total-duration');
const xSpeedTextElement = document.getElementById('x-speed-text');
const xSpeedButtonElement = document.getElementById('x-speed-btn');


let pressStartTime = null;  // 记录按键开始按下的时间，用来区分长摁和短摁
let isRightArrowPressed = false;  // 记录右键状态用来避免重复触发长摁
let interval = null; // 用来清除 setInterval 的引用
let isSpeedSet = false;  // 记录是否通过按键触发了倍速播放
let seiData = null;


// 监听键盘按下事件
document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowRight') {
        if (!isRightArrowPressed) {
            isRightArrowPressed = true;
            pressStartTime = Date.now();

            // 检查按键是否持续 0.5 秒以上
            const checkLongPress = () => {
                if (isRightArrowPressed && (Date.now() - pressStartTime) >= 500) {
                    // 持续时间超过 0.5 秒，且尚未设置倍速播放
                    if (!isSpeedSet && currentPlaybackRate === 1 && is_playing === true) {
                        // 设置倍速播放
                        setPlaybackRate(3);
                        isSpeedSet = true;  // 设置倍速标志
                    }
                }
            };

            // 每 100 毫秒检查一次是否长按
            interval = setInterval(checkLongPress, 100);
        }
    } else if (event.code === 'Space') {
        togglePlayPause();
    } else if (event.code === 'ArrowLeft') {
        backward5Seconds();
    }
});

// 监听键盘松开事件
document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowRight') {
        clearInterval(interval); // 清除计时器
        if (Date.now() - pressStartTime < 500) {
            // 短按前进5s
            forward5Seconds();
        }

        // 恢复正常播放速度
        if (isSpeedSet) {
            setPlaybackRate(1);
            isSpeedSet = false;
        }

        isRightArrowPressed = false;
    }
});

// 加载数据
// 获取URL中的查询参数
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type');
const index = urlParams.get('index');

// 通过sessionStorage实现快页面的数据共享
const AllClipsList = JSON.parse(sessionStorage.getItem('videoFiles'));

const grayToGreenFilter = "invert(50%) sepia(100%) saturate(1000%) hue-rotate(90deg)";
const grayToRedFilter = "brightness(0) saturate(100%) invert(31%) sepia(79%) saturate(7442%) hue-rotate(353deg) brightness(96%) contrast(111%)";
const grayToBlueFilter = "brightness(100%) saturate(100%) invert(31%) sepia(79%) saturate(7442%) hue-rotate(210deg) brightness(96%) contrast(111%)";

// 当前播放的clips group中的视频索引
let currentIndex = 0;

// 所有视频段的总长度，如10分多钟就是11个视频
let totalClipsNumber = 0;

// 这个变量不会有data race的情况，标准的浏览器环境中的 JavaScript 是单线程的
let loadedVideosChannelCount = 0;  // 已经准备好播放的路数
let endedVideosChannelCount = 0;  // 当前视频源已播放完毕的路数
let stalledVideos = [];  // 视频因网络问题或其他原因无法继续加载的路数

let validVideoChannels = [];
let validVideosChannelCount = 0; // 有数据的路数 最多是4路 这里的有效代表存在视频文件

// 初始状态为暂停，等待用户点击播放
let is_playing = false;

// 默认选择前视最大化显示
let selectedView = 'F';

// 整个视频段的时长，用来设置进度条的长度
let clipsDuration = 0;

// 每段视频开始的时间戳 用于视频切换
let clipsGroupStartTimestamp = [];

let hasResizedWindow = false;

let currentPlaybackRate = 1;
const maxPlaybackRate = 8;

let eventJsonDataObject = {};

// 返回按钮点击事件，跳转回主页面
backButton.addEventListener('click', () => window.history.back());

backwardButton.addEventListener('click', () => {
    backwardButton.blur();
    backward5Seconds();
});

playPauseIcon.addEventListener('click', () => {
    playPauseIcon.blur();  // 移除focus属性，避免键盘和鼠标同时操作导致的冲突，其他按钮同样
    togglePlayPause();
});

xSpeedButton.addEventListener('click', () => {
    xSpeedButton.blur();
    forwardXSpeed();
});

// 为缩略图项添加点击事件监听器
Object.values(thumbnailItems).forEach(item => {
    item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        selectView(view);
    });
});

// 防止快速连续切换视角
let isSwitchingView = false;

// 当用户拖动进度条时同步视频的播放时间
progressBar.addEventListener('input', async () => {
    await changeProgressBarValue();

    // 解决用户手动拖动进度条到最后，不能触发player的ended事件，导致再次点击播放按钮会从最后一个视频的头部播放的bug
    if (progressBar.value == progressBar.max) {
        currentIndex = totalClipsNumber;

        playPauseIcon.src = "play.svg";
        is_playing = false;
        setPlaybackRate(1);

        currentDuration.innerHTML = formatDuration(progressBar.max);
    }
});

// 解决第一次resize之后progress bar长度不能正确更新的问题
window.addEventListener('resize', () => {
    setEventTriggerTimestampMarker();
});


mainVideo.addEventListener('timeupdate', () => {
    // 手动拖动进度条到最后时跳过执行，否则会越界
    if (currentIndex >= totalClipsNumber) {
        return;
    }

    // TODO: 限制下述代码的执行频率
    // 通过目前播放的视频 计算出进度条的进度
    // 第一个视频片段的起始时间
    const first_ts = AllClipsList[type].at(index).clips.at(0).filename_ts;
    const firstTimestamp = filenameDateToJsDate(first_ts);

    // 目前视频片段的起始时间
    const current_clip_ts = AllClipsList[type].at(index).clips.at(currentIndex).filename_ts;
    const currentClipStartTimestamp = filenameDateToJsDate(current_clip_ts);

    // 目前视频片段的播放时间
    const playTimeInClip = mainVideo.currentTime;

    // 计算出当前播放进度在整个视频片段中的时长，设置进度条
    progressBar.value = playTimeInClip + (currentClipStartTimestamp - firstTimestamp) / 1000;

    // 当前播放到的时间戳
    const currentFrameTimestamp = currentClipStartTimestamp;
    currentFrameTimestamp.setSeconds(currentFrameTimestamp.getSeconds() + Math.floor(playTimeInClip));

    // 计算0.1s的部分
    const decimalPart = Math.floor((playTimeInClip % 1) * 10);

    // 当前时间戳转换为用于显示的格式
    const currentDate = formatDate(currentFrameTimestamp);

    // 更新时间戳
    currentDuration.innerHTML = formatDuration(progressBar.value);
    timeDisplay.innerHTML = currentDate;

    // 这里更新驾驶信息
    // 通过playTimeInClip目前视频的播放时间
    // 通过帧率换算成索引
    // 通过索引获取metadata数据
    // 更新UI

    if (seiData && seiData.length > 0) {
        const seiIndex = Math.round(playTimeInClip * 36);

        if (seiIndex < seiData.length && seiData[seiIndex] != null) {
            canDataDisplay.classList.remove('hidden');

            window.logger.debug("update sei index: ", seiIndex);
            // window.logger.debug(seiData[seiIndex]);

            const frameSeiData = seiData[seiIndex];

            switch (frameSeiData.gearState) {
                case "GEAR_DRIVE":
                    gearPosition.innerHTML = "D";
                    break;
                case "GEAR_PARK":
                    gearPosition.innerHTML = "P";
                    break;
                case "GEAR_REVERSE":
                    gearPosition.innerHTML = "R";
                    break;
                case "GEAR_NEUTRAL":
                    gearPosition.innerHTML = "N";
                    break;
                default:
                    break;
            }

            vehicleSpeed.innerHTML = Math.round(frameSeiData.vehicleSpeedMps * 3.6) + ' km/h';

            if (frameSeiData.acceleratorPedalPosition > 0.0) {
                acceleratorPedal.style.filter = grayToGreenFilter;
                accelPercentage.innerHTML = Math.round(frameSeiData.acceleratorPedalPosition) + "%";
            } else {
                acceleratorPedal.style.filter = "";
                accelPercentage.innerHTML = "";
            }

            const steeringAngle = Math.round(frameSeiData.steeringWheelAngle) % 360;
            steeringWheelIcon.style.transform = `rotate(${steeringAngle}deg)`;

            if (frameSeiData.blinkerOnLeft) {
                turnLeftIndicator.style.filter = grayToGreenFilter;
            } else {
                turnLeftIndicator.style.filter = "";
            }

            if (frameSeiData.blinkerOnRight) {
                turnRightIndicator.style.filter = grayToGreenFilter;
            } else {
                turnRightIndicator.style.filter = "";
            }

            if (frameSeiData.brakeApplied) {
                brakePedal.style.filter = grayToRedFilter;
            } else {
                brakePedal.style.filter = "";
            }

            switch (frameSeiData.autopilotState) {
                case "SELF_DRIVING":
                    drivingMode.style.filter = grayToGreenFilter;
                    drivingModeText.innerHTML = "SELF_DRIVING";
                    break;
                case "AUTOSTEER":
                    drivingMode.style.filter = grayToGreenFilter;
                    drivingModeText.innerHTML = "AUTOSTEER";
                    break;
                case "TACC":
                    drivingMode.style.filter = grayToGreenFilter;
                    drivingModeText.innerHTML = "TACC";
                    break;
                default:
                    drivingMode.style.filter = "invert(50%)";
                    drivingModeText.innerHTML = "";
                    break;
            }

        } else {
            canDataDisplay.classList.add('hidden');
        }
    } else {
        canDataDisplay.classList.add('hidden');
    }
});

// 监听主视频事件
mainVideo.addEventListener('stalled', async () => {
    stalledVideos.push(mainVideo.src);

    mainVideo.removeAttribute("src");
    mainVideo.poster = "no_video_min.svg";
    mainVideo.load();

    if (stalledVideos.length === 1) {
        // 主视频加载失败
        alert("Video load failed! Please check file: \n\n" + mainVideo.src);
    }
});

// 主视频加载完成
mainVideo.addEventListener('loadeddata', async () => {
    loadedVideosChannelCount++;

    if (loadedVideosChannelCount === validVideosChannelCount) {
        // 初次加载时会根据视频分辨率缩放窗口
        if (!hasResizedWindow) {
            resizeWindow();
            hasResizedWindow = true;
        }

        // 设置倍率需要等缓冲完，否则设置不生效
        mainVideo.playbackRate = currentPlaybackRate;

        // 如果用户暂停播放，拖动进度条视频跨越了视频，加载完成之后，不自动播放
        // 最开始的时候，加载完成之后，自动播放
        if (is_playing) {
            playAllVideos();
        }
    }
});

// 播放完视频自动播放下一个
mainVideo.addEventListener('ended', async () => {
    endedVideosChannelCount++;
    if (endedVideosChannelCount === validVideosChannelCount) {
        // 清空上一个视频的sei
        seiData = [];

        // x路视频都播放完毕
        currentIndex++;

        if (currentIndex < totalClipsNumber) {
            await setVideosSrc(currentIndex);
        } else {
            // 播放到进度条结束
            playPauseIcon.src = "play.svg";
            is_playing = false;
            setPlaybackRate(1);
        }
    }
});

// 监听缩略图视频加载完成
Object.values(thumbnailVideos).forEach(video => {
    video.addEventListener('loadeddata', async () => {
        loadedVideosChannelCount++;

        if (loadedVideosChannelCount === validVideosChannelCount) {
            // 所有视频加载完成
            if (!hasResizedWindow) {
                resizeWindow();
                hasResizedWindow = true;
            }

            if (is_playing) {
                playAllVideos();
            }
        }
    });

    video.addEventListener('ended', async () => {
        endedVideosChannelCount++;
        if (endedVideosChannelCount === validVideosChannelCount) {
            // 所有视频播放完毕
            currentIndex++;

            if (currentIndex < totalClipsNumber) {
                await setVideosSrc(currentIndex);
            } else {
                playPauseIcon.src = "play.svg";
                is_playing = false;
                setPlaybackRate(1);
            }
        }
    });
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
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
    return `${weekDay}, ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

// 对于savedClips和sentryClips,根据读取的event.json文件，在进度条上设置触发的时间点标识
function setEventTriggerTimestampMarker() {
    if ('timestamp' in eventJsonDataObject) {
        // 日期格式如：2024-09-04T12:04:41 符合 ISO 8601 格式，JavaScript 原生支持该格式的解析
        eventTriggerTimestamp = new Date(eventJsonDataObject['timestamp']);

        // 触发时间距离开头时间的时长
        if (clipsGroupStartTimestamp.length > 0 && clipsDuration > 0) {
            const sliderWidth = progressBar.offsetWidth;

            const markerLeft = (eventTriggerTimestamp - clipsGroupStartTimestamp[0]) / 1000 / clipsDuration * sliderWidth;

            // 设置标识的水平位置
            eventMarker.style.left = `${markerLeft}px`;
            eventMarker.classList.remove('hidden');
        }
    } else {
        eventMarker.classList.add('hidden');
    }
}

function setVideoDuration() {
    progressBar.max = clipsDuration;
    totalDuration.innerHTML = formatDuration(clipsDuration);

    setEventTriggerTimestampMarker();
}


// 播放暂停按钮
async function togglePlayPause() {
    window.logger.debug("togglePlayPause called, is_playing:", is_playing);
    window.logger.debug("currentIndex:", currentIndex, "totalClipsNumber:", totalClipsNumber);
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
            await setVideosSrc(currentIndex);
            is_playing = true;
            playAllVideos();
        }
    }
}

// 回退5s
async function backward5Seconds() {
    const newValue = Number(progressBar.value) - 5;
    progressBar.value = newValue;
    await changeProgressBarValue();
}

async function forward5Seconds() {
    const newValue = Number(progressBar.value) + 5;
    progressBar.value = newValue;
    await changeProgressBarValue();
}

// 倍速播放
async function forwardXSpeed() {
    if (currentIndex >= totalClipsNumber) {
        // 播放完毕 再次点击倍速按钮 从头开始播放
        currentIndex = 0;
        await setVideosSrc(currentIndex);
        is_playing = true;
    }

    setPlaybackRate(currentPlaybackRate * 2);
    playAllVideos();
}

// 设置播放速率
function setPlaybackRate(rate) {
    currentPlaybackRate = rate;
    if (currentPlaybackRate > maxPlaybackRate) {
        currentPlaybackRate = 1;
    }

    // 设置主视频倍速
    mainVideo.playbackRate = currentPlaybackRate;

    // 设置所有缩略图视频倍速
    Object.values(thumbnailVideos).forEach(video => {
        video.playbackRate = currentPlaybackRate;
    });

    xSpeedTextElement.innerHTML = currentPlaybackRate + "x";

    if (currentPlaybackRate == 1) {
        xSpeedButtonElement.classList.remove('selected');
    } else {
        xSpeedButtonElement.classList.add('selected');
    }
}

async function loadEventJsonFile(filePath) {
    try {
        const response = await fetch(filePath);
        const data = await response.json();
        return data;
    } catch (error) {
        window.logger.error('Error loading JSON:', error);
        return {};
    }
}


async function setVideosSrc(clipsIndex) {
    // 设置播放源
    if (clipsIndex < AllClipsList[type].at(index).clips.length) {
        const videos = AllClipsList[type].at(index).clips.at(clipsIndex).videos;
        window.logger.debug("setVideosSrc called for clipsIndex:", clipsIndex);
        window.logger.debug("videos object:", videos);

        validVideosChannelCount = 0;
        validVideoChannels = [];

        // 处理每个视角的视频
        const views = ['F', 'B', 'L', 'R', 'LF', 'RF'];

        for (const view of views) {
            const videoUrl = videos[view];
            const thumbnailItem = thumbnailItems[view];
            const thumbnailVideo = thumbnailVideos[view];

            if (videoUrl === '') {
                // 没有视频源，隐藏该视角
                thumbnailItem.classList.add('hidden');
                thumbnailVideo.removeAttribute("src");
                thumbnailVideo.poster = "no_video_min.svg";
            } else {
                // 有视频源，显示该视角
                thumbnailItem.classList.remove('hidden');
                thumbnailVideo.src = videoUrl;
                thumbnailVideo.removeAttribute("poster");
                validVideoChannels.push(view);
                validVideosChannelCount++;

                // 如果是选中的视角，设置主视频源
                if (view === selectedView) {
                    window.logger.debug("Setting main video source for view", view, ":", videoUrl);
                    mainVideo.src = videoUrl;
                    mainVideo.removeAttribute("poster");

                    // 解析SEI数据（只解析主视角的视频）
                    window.logger.debug("解析:", videoUrl);
                    seiData = await window.electronAPI.parseVideoSei(videoUrl);
                    window.logger.debug("共计:", seiData.length, "帧SEI数据");
                }

                thumbnailVideo.load();
            }
        }

        // 加载主视频（只有在有源的情况下）
        if (mainVideo.hasAttribute("src")) {
            mainVideo.load();
        } else {
            window.logger.warn("No video source for selected view:", selectedView);
            mainVideo.poster = "no_video_min.svg";
        }

        loadedVideosChannelCount = 0;  // 清零等待加载完毕
        endedVideosChannelCount = 0;
        stalledVideos = [];
    }
    // 接下来会触发loadeddata事件
}


function playAllVideos() {
    window.logger.debug("playAllVideos called, mainVideo.hasAttribute('src'):", mainVideo.hasAttribute("src"));
    window.logger.debug("mainVideo.src:", mainVideo.src);
    if (mainVideo.hasAttribute("src")) {
        mainVideo.play().catch(error => {
            console.error('Main video play() failed:', error);
            window.logger.error('Main video play() failed:', error);
        });
    } else {
        window.logger.error("mainVideo has no src attribute, cannot play");
    }

    // 播放所有缩略图视频
    Object.values(thumbnailVideos).forEach(video => {
        if (video.hasAttribute("src")) {
            video.play().catch(error => {
                console.error('Thumbnail video play() failed:', error);
            });
        }
    });

    playPauseIcon.src = "pause_min.svg";
    is_playing = true;
}

function pauseAllVideos() {
    if (mainVideo.hasAttribute("src")) {
        mainVideo.pause();
    }

    // 暂停所有缩略图视频
    Object.values(thumbnailVideos).forEach(video => {
        if (video.hasAttribute("src")) {
            video.pause();
            // 同步时间到主视频
            video.currentTime = mainVideo.currentTime;
        }
    });

    playPauseIcon.src = "play.svg";
    is_playing = false;
}

async function selectView(view) {
    // 如果已经是选中的视角，不执行任何操作
    if (selectedView === view) {
        return;
    }

    // 更新选中状态
    Object.values(thumbnailItems).forEach(item => {
        item.classList.remove('selected');
    });
    thumbnailItems[view].classList.add('selected');

    // 保存选中的视角
    selectedView = view;

    // 如果当前有视频在播放，切换到新视角
    if (currentIndex < totalClipsNumber) {
        const videos = AllClipsList[type].at(index).clips.at(currentIndex).videos;
        const videoUrl = videos[view];

        if (videoUrl !== '') {
            // 保存当前播放状态和时间
            const wasPlaying = is_playing;
            const currentTime = mainVideo.currentTime;

            // 切换主视频源
            mainVideo.src = videoUrl;
            mainVideo.removeAttribute("poster");

            // 解析新视角的SEI数据
            window.logger.debug("切换视角，解析:", videoUrl);
            seiData = await window.electronAPI.parseVideoSei(videoUrl);
            window.logger.debug("共计:", seiData.length, "帧SEI数据");

            // 加载视频
            mainVideo.load();

            // 等待视频加载完成
            await new Promise((resolve) => {
                const onLoadedData = () => {
                    mainVideo.removeEventListener('loadeddata', onLoadedData);
                    resolve();
                };
                mainVideo.addEventListener('loadeddata', onLoadedData);
            });

            // 设置播放时间 - 必须在loadeddata之后设置
            mainVideo.currentTime = currentTime;

            // 如果之前正在播放，继续播放
            if (wasPlaying) {
                mainVideo.play().catch(error => {
                    console.error('Failed to resume playback after view switch:', error);
                });
            }
        } else {
            // 选中的视角没有视频
            window.logger.warn("Selected view has no video:", view);
            mainVideo.removeAttribute("src");
            mainVideo.poster = "no_video_min.svg";
        }
    } else {
        // 如果没有视频加载，只是更新选中状态，视频源会在setVideosSrc中设置
        window.logger.debug("selectView called during initialization, only updating UI selection");
    }
}


// 设置视频的播放时间
function setVideoTime(time) {
    mainVideo.currentTime = time;

    // 同步所有缩略图视频时间
    Object.values(thumbnailVideos).forEach(video => {
        video.currentTime = time;
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
    // 获取主视频分辨率
    const videoW = mainVideo.videoWidth;
    const videoH = mainVideo.videoHeight;
    const extraWidth = 0;  // 若左边显示3D渲染结果则需要设置这个值

    // 在新的布局中，只需要考虑多视角区域的高度
    const multiViewContainer = document.querySelector('.multi-view-container');
    const multiViewContainerHeight = multiViewContainer ? multiViewContainer.offsetHeight : 100; // 更新为100px

    // Overlay元素不占用额外高度，因为它们是绝对定位的
    const extraHeight = multiViewContainerHeight;

    window.electronAPI.resizeWindow(videoW, videoH, extraWidth, extraHeight);
}

function getVideoDuration(url) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata'; // 仅加载元数据
        video.muted = true;         // 静音以增加兼容性

        video.onloadedmetadata = () => {
            const duration = video.duration;
            resolve(duration);
        };

        video.onerror = () => {
            reject("视频加载失败，请检查 URL 或跨域设置");
        };

        video.src = url;
    });
}

async function updateClipsDuration() {
    try {
        // 获取最后一段视频的地址且找到第一个有效的视频地址
        const videos = AllClipsList[type].at(index).clips.at(totalClipsNumber - 1).videos;
        const keys = ['F', 'B', 'L', 'R', 'LF', 'RF'];
        const video = keys.map(key => videos[key]).find(val => val && val.trim() !== "");

        // 等待获取时长完成
        const lastClipDuration = await getVideoDuration(video);
        window.logger.debug("最后一个视频时长:", lastClipDuration, "秒");

        clipsDuration = AllClipsList[type].at(index).duration - 60 + Math.round(lastClipDuration);
        window.logger.debug("总视频时长:", clipsDuration, "秒");

        setVideoDuration();

    } catch (error) {
        window.logger.error("更新总视频时长发生错误:", error);
    }
}


(
    async () => {
        if (AllClipsList) {
            if (type in AllClipsList && AllClipsList[type].length > index) {
                totalClipsNumber = AllClipsList[type].at(index).clips.length;

                // 获取每段视频的起始时间
                AllClipsList[type].at(index).clips.forEach(clip => {
                    clipsGroupStartTimestamp.push(filenameDateToJsDate(clip.filename_ts));
                });

                // 针对Sentry和Saved加载json文件
                eventJsonFilePath = AllClipsList[type].at(index).jsonPath;
                if (eventJsonFilePath !== "") {
                    eventJsonDataObject = await loadEventJsonFile(eventJsonFilePath);
                }

                if (totalClipsNumber > 0) {
                    await updateClipsDuration();
                    currentIndex = 0;  // 默认从头播放
                    await setVideosSrc(currentIndex);

                    // 设置默认选中的视角（UI状态）
                    selectView('F');
                }
            }
        }
    }
)();

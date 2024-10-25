const players = [
    document.getElementById('video-f'),  // F
    document.getElementById('video-b'),  // B
    document.getElementById('video-l'),  // L
    document.getElementById('video-r')   // R
];

const play_pause_button = document.getElementById('play-pause-btn');
const progressBar = document.getElementById('progress-bar');
const timeDisplay = document.getElementById('timestamp');

// 当前播放的clips group中的视频索引
let currentIndex = 0;

// 这个变量不会有data race的情况，标准的浏览器环境中的 JavaScript 是单线程的
let loaded_videos_channel_cnt = 0;  // 已经准备好播放的路数
let ended_videos_channel_cnt = 0;  // 当前视频源已播放完毕的路数

// 4路都加载完毕自动播放
let is_playing = false;

play_pause_button.textContent = '播放';

let selectedPlayer = players[0];

let clipsDuration = 0;  // 整个视频段的时长，用来设置进度条的长度

let clipsGroupStartTimestamp = [];

// 返回按钮点击事件，跳转回主页面
const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.back();  // 这个可以跳转回之前的位置
});


// YYYY-MM-DD_HH-MM-SS
function formatTimestamp(timestamp_str) {
    const [datePart, timePart] = timestamp_str.split('_');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds); // 月份从0开始
};


players[0].addEventListener('timeupdate', () => {
    // 通过目前播放的视频 计算出进度条的进度
    const first_ts = savedVideoFiles[type].at(index).clips.at(0).filename_ts;
    const firstTimestamp = formatTimestamp(first_ts);

    const current_clip_ts = savedVideoFiles[type].at(index).clips.at(currentIndex).filename_ts;
    const currentClipStartTimestamp = formatTimestamp(current_clip_ts);

    progressBar.value = players[0].currentTime + (currentClipStartTimestamp - firstTimestamp) / 1000;

    const currentFrameTimestamp = currentClipStartTimestamp;
    currentFrameTimestamp.setSeconds(currentFrameTimestamp.getSeconds() + Math.round(players[0].currentTime));

    // 更新时间戳
    timeDisplay.value = currentFrameTimestamp.toString();
});

// 播放暂停按钮
function togglePlayPause() {
    if (is_playing) {
        pauseAllVideos();
        play_pause_button.textContent = '播放';
        is_playing = false;
    } else {
        playAllVideos();

        // 当暂停时，将所有视频同步到被放大视频的当前时间，防止4路播放不同步
        players.forEach(player => {
            player.currentTime = selectedPlayer.currentTime;
        });

        play_pause_button.textContent = '暂停';
        is_playing = true;
    }
}

// 加载数据
// 获取URL中的查询参数
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type');
const index = urlParams.get('index');

// 通过sessionStorage实现快页面的数据共享
const savedVideoFiles = JSON.parse(sessionStorage.getItem('videoFiles'));

if (savedVideoFiles) {
    if (type in savedVideoFiles && savedVideoFiles[type].length > index) {
        // 设置进度条长度
        progressBar.max = savedVideoFiles[type].at(index).duration;

        // 获取每段视频的起始时间
        savedVideoFiles[type].at(index).clips.forEach(clip => {
            clipsGroupStartTimestamp.push(formatTimestamp(clip.filename_ts));
        });

        setVideosSrc(currentIndex);
    }
}


function setVideosSrc(clipsIndex) {
    // 设置播放源
    if (clipsIndex < savedVideoFiles[type].at(index).clips.length) {
        const videos = savedVideoFiles[type].at(index).clips.at(clipsIndex).videos;
        players[0].src = videos.F;
        players[0].load();
        players[1].src = videos.B;
        players[1].load();
        players[2].src = videos.L;
        players[2].load();
        players[3].src = videos.R;
        players[3].load();

        loaded_videos_channel_cnt = 0;  // 清零等待加载完毕
        ended_videos_channel_cnt = 0;
    }
}


players.forEach(player => {
    // 4个视频都加载第一帧完毕后再同步播放
    player.addEventListener('loadeddata', () => {
        loaded_videos_channel_cnt++;
        if (loaded_videos_channel_cnt === players.length) {
            playAllVideos();
        }
    });

    // 播放完视频自动播放下一个
    // 当当前视频播放结束时，加载并播放下一个视频
    player.addEventListener('ended', () => {
        ended_videos_channel_cnt++;
        if (ended_videos_channel_cnt === players.length) {
            // 所有视频都播放完毕
            currentIndex++;
            setVideosSrc(currentIndex);
        }
    });
});

function playAllVideos() {
    players.forEach(player => {
        player.play();
    });
    play_pause_button.textContent = '暂停';
    is_playing = true;
}

function pauseAllVideos() {
    players.forEach(player => {
        player.pause();
    });
    play_pause_button.textContent = '播放';
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

// 更新进度条
// function updateProgress() {
//     // 通过 requestAnimationFrame 实现循环更新进度条
//     requestAnimationFrame(updateProgress);
// }

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
    progressBar.addEventListener('input', function () {
        // 第一个视频时间戳 + 进度条值 = 进度条绝对时间
        let currentFrameTimestamp = new Date(clipsGroupStartTimestamp[0]);
        currentFrameTimestamp.setSeconds(currentFrameTimestamp.getSeconds() + Math.round(progressBar.value));

        // 通过绝对时间查找所属的视频段
        let clips_index = binarySearchDates(clipsGroupStartTimestamp, currentFrameTimestamp);

        // 获取在视频段中的时间
        const clip_time = (currentFrameTimestamp - clipsGroupStartTimestamp[clips_index]) / 1000;

        // 切换视频源
        if (clips_index != currentIndex) {
            setVideosSrc(clips_index);
            currentIndex = clips_index;
        }

        // 设置视频当前时间
        setVideoTime(clip_time); // 将所有视频同步到进度条的当前值
    });
}


// 在页面加载后调用 selectVideo，选择 video-f
window.onload = function () {
    selectVideo(players[0]); // 主动选择 video-f
    syncProgressWithVideo(); // 启用拖动进度条同步功能
};

// 开始时更新进度条
// updateProgress();
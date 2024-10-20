const players = [
    document.getElementById('video-1'),  // F
    document.getElementById('video-2'),  // B
    document.getElementById('video-3'),  // L
    document.getElementById('video-4')   // R
];

const play_pause_button = document.getElementById('play-pause-btn');

// 当前播放的clips group中的视频索引
let currentIndex = 0;

// 这个变量不会有data race的情况，标准的浏览器环境中的 JavaScript 是单线程的
let loaded_videos_channel_cnt = 0;  // 已经准备好播放的路数
let ended_videos_channel_cnt = 0;  // 当前视频源已播放完毕的路数

// 4路都加载完毕自动播放
let is_playing = false;

play_pause_button.textContent = '播放';

let selectedPlayer = players[0];

// 返回按钮点击事件，跳转回主页面
const backButton = document.getElementById('back-button');
backButton.addEventListener('click', () => {
    window.history.back();  // 这个可以跳转回之前的位置
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
        console.log(savedVideoFiles[type].at(index));

        setVideosSrc(currentIndex);
    }
}

function setVideosSrc(clipsIndex) {
    console.log("set video src");
    console.log(clipsIndex);
    // 设置播放源
    if (clipsIndex < savedVideoFiles[type].at(index).clips.length) {
        const videos = savedVideoFiles[type].at(index).clips.at(clipsIndex).videos;

        console.log(videos);

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
        console.log("end cnt: %d", ended_videos_channel_cnt);
        if (ended_videos_channel_cnt === players.length) {
            // 所有视频都播放完毕
            console.log("change to next clip");
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


// 更新进度条
function updateProgress() {
    const largeVideo = document.querySelector('.video.large'); // 获取被放大的视频
    const progressBar = document.getElementById('progress-bar');

    // 如果有放大的视频，则用它的当前时间更新进度条
    if (largeVideo) {
        progressBar.max = largeVideo.duration;
        progressBar.value = largeVideo.currentTime;
    }

    // 通过 requestAnimationFrame 实现循环更新进度条
    requestAnimationFrame(updateProgress);
}

// 设置视频的播放时间
function setVideoTime(time) {
    players.forEach(player => {
        player.currentTime = time;
    });
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

// 当用户拖动进度条时同步视频的播放时间
function syncProgressWithVideo() {
    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('input', function () {
        setVideoTime(progressBar.value); // 将所有视频同步到进度条的当前值
    });
}


// 在页面加载后调用 selectVideo，选择 video-1
window.onload = function () {
    selectVideo(players[0]); // 主动选择 video-1
    syncProgressWithVideo(); // 启用拖动进度条同步功能
};

// 开始时更新进度条
updateProgress();
const mainVideo = document.getElementById('main-video');
const thumbnails = document.querySelectorAll('.thumbnail');
const progressBar = document.getElementById('progress-bar');
const playPauseBtn = document.getElementById('playPauseBtn');


function togglePlayPause() {
    const videos = document.querySelectorAll('.video');
    const button = document.getElementById('play-pause-btn');

    if (button.textContent === '暂停') {
        videos.forEach(video => {
            video.pause();
        });
        button.textContent = '播放';
    } else {
        videos.forEach(video => {
            video.play();
        });
        button.textContent = '暂停';
    }
}

// 更新进度条
function updateProgress() {
    const videos = document.querySelectorAll('.video');
    const progressBar = document.getElementById('progress-bar');
    
    // 取最小的当前播放时间作为进度条值
    const currentTime = Math.min(...Array.from(videos).map(video => video.currentTime));
    const duration = Math.max(...Array.from(videos).map(video => video.duration));
    
    // 更新进度条的最大值和当前值
    progressBar.max = duration;
    progressBar.value = currentTime;

    // 通过 requestAnimationFrame 实现循环更新进度条
    requestAnimationFrame(updateProgress);
}

// 设置视频的播放时间
function setVideoTime(time) {
    const videos = document.querySelectorAll('.video');
    videos.forEach(video => {
        video.currentTime = time;
    });
}


function selectVideo(selectedVideo) {
    // 获取所有视频元素
    const videos = document.querySelectorAll('.video');

    videos.forEach(video => {
        if (video === selectedVideo) {
            // 放大选中的视频
            video.classList.remove('small');
            video.classList.add('large');

            // 清除定位属性，使放大视频居中
            selectedVideo.style.top = '0';
            selectedVideo.style.left = '0';
            selectedVideo.style.right = '';
            selectedVideo.style.bottom = '';

        } else {
            // 缩小其他视频
            video.classList.remove('large');
            video.classList.add('small');

            // 清除定位属性，确保视频回到它的小角落
            video.style.top = '';
            video.style.left = '';
            video.style.right = '';
            video.style.bottom = '';
        }
    });
}


// 在页面加载后调用 selectVideo，选择 video-1
window.onload = function() {
    const video1 = document.getElementById('video-1');
    selectVideo(video1); // 主动选择 video-1
};

// 开始时更新进度条
updateProgress();

function togglePlayPause() {
    const videos = document.querySelectorAll('.video');
    const button = document.getElementById('play-pause-btn');
    const largeVideo = document.querySelector('.video.large'); // 获取被放大的视频

    if (button.textContent === '暂停') {
        videos.forEach(video => {
            video.pause();
        });

        // 当暂停时，将所有视频同步到被放大视频的当前时间
        if (largeVideo) {
            const largeVideoTime = largeVideo.currentTime;
            videos.forEach(video => {
                video.currentTime = largeVideoTime;
            });
        }

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

// 当用户拖动进度条时同步视频的播放时间
function syncProgressWithVideo() {
    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('input', function() {
        setVideoTime(progressBar.value); // 将所有视频同步到进度条的当前值
    });
}


// 在页面加载后调用 selectVideo，选择 video-1
window.onload = function() {
    const video1 = document.getElementById('video-1');
    selectVideo(video1); // 主动选择 video-1
    syncProgressWithVideo(); // 启用拖动进度条同步功能
};

// 开始时更新进度条
updateProgress();
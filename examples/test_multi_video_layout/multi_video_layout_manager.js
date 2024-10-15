const mainVideo = document.getElementById('main-video');
const thumbnails = document.querySelectorAll('.thumbnail video');
const progressBar = document.getElementById('progress-bar');

// 点击缩略图时，将对应的视频切换到主播放区域
thumbnails.forEach((thumbnail) => {
    thumbnail.parentElement.addEventListener('click', () => {
        const mainSource = mainVideo.querySelector('source');
        const newSource = thumbnail.querySelector('source');

        // 更换主视频源
        mainSource.src = newSource.src;
        mainVideo.load();
        mainVideo.play();
    });
});

// 同步所有视频的进度
mainVideo.addEventListener('timeupdate', () => {
    const progress = mainVideo.currentTime / mainVideo.duration;
    progressBar.value = progress;

    thumbnails.forEach((thumbnail) => {
        thumbnail.currentTime = mainVideo.currentTime;
    });
});

// 拖动进度条时，更新主视频和所有缩略图的视频进度
progressBar.addEventListener('input', () => {
    mainVideo.currentTime = progressBar.value * mainVideo.duration;
    thumbnails.forEach((thumbnail) => {
        thumbnail.currentTime = mainVideo.currentTime;
    });
});

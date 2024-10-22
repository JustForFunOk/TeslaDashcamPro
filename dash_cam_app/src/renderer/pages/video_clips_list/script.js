const selectFolderButton = document.getElementById('select-folder');
const savedVideoList = document.getElementById('saved-video-list');
const sentryVideoList = document.getElementById('sentry-video-list');
const allVideoList = document.getElementById('all-video-list');

// 加载已保存的视频列表（如果存在）
function loadSavedVideoList() {
    const savedVideoFiles = JSON.parse(sessionStorage.getItem('videoFiles'));

    if (savedVideoFiles) {
        showClipsGroups(savedVideoFiles);
    }
}

// 初始加载时恢复状态，这个需要，否则从视频播放页面退回时将是空白页面
window.onload = loadSavedVideoList;

selectFolderButton.addEventListener('click', async () => {
    // 调用 Electron API 选择文件夹
    const videoFiles = await window.electronAPI.selectFolder();

    // 保存视频列表到sessionStorage本地应用运行期间都可以获取其中的内容
    sessionStorage.setItem('videoFiles', JSON.stringify(videoFiles));

    showClipsGroups(videoFiles);
});

function showClipsGroups(videoFiles) {
    // 清空视频列表
    savedVideoList.innerHTML = '';
    sentryVideoList.innerHTML = '';
    allVideoList.innerHTML = '';

    // SavedClips
    if (videoFiles["SavedClips"].length > 0) {
        // 倒序显示
        for (let i = videoFiles["SavedClips"].length - 1; i >= 0; i--) {
            // 在列表中创建一个项目
            const li = document.createElement('li');
            // 创建一个可点击的链接
            const link = document.createElement('a');

            link.href = `../video_player/index.html?type=${encodeURIComponent("SavedClips")}&index=${encodeURIComponent(i)}`;
            link.textContent = videoFiles["SavedClips"][i].timestamp;  // 显示时间戳
            li.appendChild(link);
            savedVideoList.appendChild(li);
        }
    }

    if (videoFiles["SentryClips"].length > 0) {
        // 倒序显示
        for (let i = videoFiles["SentryClips"].length - 1; i >= 0; i--) {
            // 在列表中创建一个项目
            const li = document.createElement('li');
            // 创建一个可点击的链接
            const link = document.createElement('a');

            link.href = `../video_player/index.html?type=${encodeURIComponent("SentryClips")}&index=${encodeURIComponent(i)}`;
            link.textContent = videoFiles["SentryClips"][i].timestamp;  // 显示时间戳
            li.appendChild(link);
            savedVideoList.appendChild(li);
        }
    }

    if (videoFiles["AllClips"].length > 0) {
        // 倒序显示
        for (let i = videoFiles["AllClips"].length - 1; i >= 0; i--) {
            // 在列表中创建一个项目
            const li = document.createElement('li');
            // 创建一个可点击的链接
            const link = document.createElement('a');

            link.href = `../video_player/index.html?type=${encodeURIComponent("AllClips")}&index=${encodeURIComponent(i)}`;
            link.textContent = videoFiles["AllClips"][i].timestamp;  // 显示时间戳
            li.appendChild(link);
            savedVideoList.appendChild(li);
        }
    }
}

selectFolderButton.addEventListener('click', async () => {
    // 调用 Electron API 选择文件夹
    const videoFiles = await window.electronAPI.selectFolder();

    // 通过

});

function showPage(page) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    // Show the selected page
    document.getElementById(page).classList.add('active');

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.header-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Add active class to the clicked button
    const clickedButton = document.querySelector(`.btn-${page}`);
    clickedButton.classList.add('active');
}

function toggleEntry(entryId) {
    const entry = document.getElementById(entryId);
    entry.classList.toggle('active');
}

// Default to showing the "Saved" page on load
document.addEventListener('DOMContentLoaded', () => {
    showPage('saved');
});

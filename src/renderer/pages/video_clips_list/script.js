const selectFolderBtn = document.getElementById('select-folder');
const sections = {
    "SavedClips": document.getElementById("saved").querySelector(".timeline"),
    "SentryClips": document.getElementById("sentry").querySelector(".timeline"),
    "AllClips": document.getElementById("recent").querySelector(".timeline")
};

let videoFilesData = {};
let isReadSuccess = false;

// 加载已保存的视频列表（如果存在）
function restoreVideoList() {
    videoFilesData = JSON.parse(sessionStorage.getItem('videoFiles'));

    if (videoFilesData) {
        loadEntries("SavedClips");
        loadEntries("SentryClips");
        loadEntries("AllClips");
    }
}

selectFolderBtn.addEventListener('click', async () => {
    // 调用 Electron API 选择文件夹
    [isReadSuccess, videoFilesData, decodedCanFilesData] = await window.electronAPI.selectFolder();

    if (isReadSuccess) {
        // 保存视频列表到sessionStorage本地应用运行期间都可以获取其中的内容
        sessionStorage.setItem('videoFiles', JSON.stringify(videoFilesData));
        sessionStorage.setItem('decodedCanFiles', JSON.stringify(decodedCanFilesData));

        loadEntries("SavedClips");
        loadEntries("SentryClips");
        loadEntries("AllClips");
    }
});

// 将输入的时长（以秒为单位）转换为小时:分钟:秒 的格式
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // 格式化为两位数
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function loadEntries(videoType) {
    const pageSection = sections[videoType];
    const entries = videoFilesData[videoType];

    pageSection.innerHTML = "";  // clear first

    let currentEntryDate = ""; // To track the current date
    let entryContentDiv = null; // To hold the entry content div

    // 倒序展示
    for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        const entryDate = entry.timestamp.split("_")[0]; // Extract date part (e.g., "2024-09-04")

        // If the date has changed, create a new date item
        if (entryDate !== currentEntryDate) {
            currentEntryDate = entryDate; // Update current date

            const dateItem = document.createElement("div");
            dateItem.classList.add("date-item");

            const dateHeader = document.createElement("div");
            dateHeader.classList.add("date-header");
            dateHeader.onclick = () => toggleEntry(dateHeader);  // Pass the header itself

            const dateIcon = document.createElement("span");
            dateIcon.classList.add("date-icon");
            dateIcon.textContent = "●"; // Default icon

            const dateSpan = document.createElement("span");
            dateSpan.classList.add("date");
            dateSpan.textContent = entryDate; // 1 这2处一定要用entryDate而不是currentDate，currentDate是引用

            entryContentDiv = document.createElement("div");
            entryContentDiv.id = videoType + entryDate;  // 2 Use “type+时间戳”作为id避免不同section中id的重复
            entryContentDiv.classList.add("entry-content");
            entryContentDiv.style.display = 'none'; // Start hidden

            dateHeader.appendChild(dateIcon);
            dateHeader.appendChild(dateSpan);
            dateItem.appendChild(dateHeader);
            dateItem.appendChild(entryContentDiv);
            pageSection.appendChild(dateItem);
        }

        // Create a clickable link
        const videoEntryLink = document.createElement("a");
        videoEntryLink.href = `../video_player/index.html?type=${encodeURIComponent(videoType)}&index=${encodeURIComponent(i)}`;
        videoEntryLink.classList.add("video-entry");

        const timeDivElement = document.createElement("div");
        timeDivElement.classList.add("time");
        const hmsParts = entry.timestamp.split("_")[1].split('-');
        timeDivElement.textContent = `${hmsParts[0]}:${hmsParts[1]}`;  // 只显示时分

        const videoThumbnailDiv = document.createElement("div");
        videoThumbnailDiv.classList.add("video-thumbnail");

        const img = document.createElement("img");

        img.alt = "Video Thumbnail";
        if (!entry.thumbPath || entry.thumbPath.trim() === '') {
            img.src = "default_thumbnail.svg";  // 设置默认缩略图
        } else {
            img.src = entry.thumbPath; // 使用实际的缩略图路径
        }

        const durationDivElement = document.createElement("div");
        durationDivElement.classList.add("video-duration");
        durationDivElement.textContent = formatDuration(entry.duration);

        videoThumbnailDiv.appendChild(img);
        videoThumbnailDiv.appendChild(durationDivElement);
        videoEntryLink.appendChild(timeDivElement);
        videoEntryLink.appendChild(videoThumbnailDiv);
        entryContentDiv.appendChild(videoEntryLink); // Add video entry to current entry content
    }
}

function showSection(sectionId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    // Show the selected page
    document.getElementById(sectionId).classList.add('active');

    // 保存状态以便恢复页面
    sessionStorage.setItem('activeSection', sectionId);

    // 修改按钮的状态
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.header-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Add active class to the clicked button
    const clickedButton = document.querySelector(`.btn-${sectionId}`);
    clickedButton.classList.add('active');
}

/// 效果
// 1. 翻转折叠/展开状态
// 2. 最多只展开一个
function toggleEntry(header) {
    const content = header.nextElementSibling;  // Get the corresponding content
    const icon = header.querySelector('.date-icon');  // Get the icon in the header

    // Check if the content is currently displayed
    const isExpanded = content.style.display === 'block';

    // 如果想取消最多只能展开一个日期的功能，把下面这段代码注释掉即可
    // Collapse all other entries in the same section
    const allHeaders = header.parentNode.parentNode.querySelectorAll('.date-header');
    allHeaders.forEach(otherHeader => {
        const otherContent = otherHeader.nextElementSibling; // Get the content for each header
        otherContent.style.display = 'none'; // Collapse it
        const otherIcon = otherHeader.querySelector('.date-icon');
        otherIcon.textContent = '●'; // Reset icon to collapsed state
        otherHeader.classList.remove('highlight'); // Remove highlight from other headers
    });
    // 如果想取消最多只能展开一个日期的功能，把上面这段代码注释掉即可

    // Toggle the clicked entry
    if (isExpanded) {
        // If it's currently expanded, collapse it
        content.style.display = 'none';
        icon.textContent = '●'; // Collapsed state
        header.classList.remove('highlight'); // Remove highlight if collapsing
    } else {
        // If it's collapsed, expand it
        content.style.display = 'block';
        icon.textContent = '►'; // Expanded state
        header.classList.add('highlight'); // Add highlight to the header
    }
}



window.onload = () => {
    // 初始加载时恢复状态，这个需要，否则从视频播放页面退回时将是空白页面
    restoreVideoList();

    // 恢复页面状态，初始状态显示save页面
    const activeSection = sessionStorage.getItem('activeSection') || 'recent';
    showSection(activeSection);

    // 恢复折叠状态
    const entries = document.querySelectorAll('.entry-content');
    entries.forEach(entry => {
        const isVisible = sessionStorage.getItem(entry.id) === 'true';
        entry.style.display = isVisible ? 'block' : 'none';

        // 恢复展示折叠的样式
        // Get the corresponding header
        const dateItem = entry.parentElement; // Get the parent date item
        const header = dateItem.querySelector('.date-header'); // Find the header within the date item

        if (header) { // Check if header is not null
            const icon = header.querySelector('.date-icon'); // Get the icon in the header

            if (isVisible) {
                icon.textContent = '►'; // Set icon to expanded state
                header.classList.add('highlight'); // Add highlight to the header
            } else {
                icon.textContent = '●'; // Set icon to collapsed state
                header.classList.remove('highlight'); // Remove highlight if collapsing
            }
        }
    });

    // 恢复滚动位置
    const scrollPosition = sessionStorage.getItem('scrollPosition') || 0;
    window.scrollTo(0, scrollPosition);
};

window.onbeforeunload = () => {
    // 在离开页面前保存滚动位置
    sessionStorage.setItem('scrollPosition', window.scrollY);
    // 保存每个条目的显示状态
    const entries = document.querySelectorAll('.entry-content');
    entries.forEach(entry => {
        sessionStorage.setItem(entry.id, entry.style.display === 'block');
    });
};
const selectFolderButton = document.getElementById('select-folder');
const savedPage = document.getElementById("saved").querySelector(".timeline");
const sentryPage = document.getElementById("sentry").querySelector(".timeline");
const recentPage = document.getElementById("recent").querySelector(".timeline");

// 加载已保存的视频列表（如果存在）
function loadSavedVideoList() {
    const savedVideoFiles = JSON.parse(sessionStorage.getItem('videoFiles'));

    if (savedVideoFiles) {
        loadEntries(videoFiles["SavedClips"], savedPage);
        loadEntries(videoFiles["SentryClips"], sentryPage);
        loadEntries(videoFiles["AllClips"], recentPage);
    }
}

// 初始加载时恢复状态，这个需要，否则从视频播放页面退回时将是空白页面
window.onload = loadSavedVideoList;

selectFolderButton.addEventListener('click', async () => {
    // 调用 Electron API 选择文件夹
    const videoFiles = await window.electronAPI.selectFolder();

    // 保存视频列表到sessionStorage本地应用运行期间都可以获取其中的内容
    sessionStorage.setItem('videoFiles', JSON.stringify(videoFiles));

    loadEntries(videoFiles["SavedClips"], savedPage);
    loadEntries(videoFiles["SentryClips"], sentryPage);
    loadEntries(videoFiles["AllClips"], recentPage);
});

function loadEntries(entries, page) {
    let currentDate = ""; // To track the current date
    let entryContent = null; // To hold the entry content div

    entries.forEach(entry => {
        const entryDate = entry.timestamp.split("_")[0]; // Extract date part (e.g., "2024-09-04")

        // If the date has changed, create a new date item
        if (entryDate !== currentDate) {
            currentDate = entryDate; // Update current date

            const dateItem = document.createElement("div");
            dateItem.classList.add("date-item");

            const dateSpan = document.createElement("span");
            dateSpan.classList.add("date");
            dateSpan.textContent = currentDate; // Use just the date
            dateSpan.onclick = () => toggleEntry(entryContent); 

            entryContent = document.createElement("div");
            // entryContent.id = currentDate;
            entryContent.classList.add("entry-content");
            entryContent.style.display = "none"; // Initially hidden

            dateItem.appendChild(dateSpan);
            dateItem.appendChild(entryContent);
            page.appendChild(dateItem);
        }

        // Create video entry for the current entry
        const videoEntry = document.createElement("div");
        videoEntry.classList.add("video-entry");

        // Create a clickable link
        const link = document.createElement("a");
        link.href = `videoPage.html?time=${entry.timestamp}`; // Change this URL as needed
        link.target = "_blank"; // Opens in a new tab

        const timeDiv = document.createElement("div");
        timeDiv.classList.add("time");
        timeDiv.textContent = entry.timestamp.split("_")[1]; // Use time part

        const videoThumbnail = document.createElement("div");
        videoThumbnail.classList.add("video-thumbnail");

        const img = document.createElement("img");
        img.src = entry.thumbPath;
        img.alt = "Video Thumbnail";

        const durationDiv = document.createElement("div");
        durationDiv.classList.add("video-duration");
        durationDiv.textContent = entry.duration;

        videoThumbnail.appendChild(img);
        videoThumbnail.appendChild(durationDiv);
        link.appendChild(timeDiv);
        link.appendChild(videoThumbnail);
        videoEntry.appendChild(link); // Add the link to videoEntry
        entryContent.appendChild(videoEntry); // Add video entry to current entry content
    });
}

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

function toggleEntry(entryContent) {
    const allEntryContents = document.querySelectorAll(".entry-content");
    
    allEntryContents.forEach(content => {
        if (content !== entryContent) {
            content.style.display = "none"; // Hide other entries
        }
    });

    // Toggle the clicked entry
    if (entryContent.style.display === "none") {
        entryContent.style.display = "block"; // Show if hidden
    } else {
        entryContent.style.display = "none"; // Hide if already shown
    }
}

// Default to showing the "Saved" page on load
document.addEventListener('DOMContentLoaded', () => {
    showPage('saved');
});

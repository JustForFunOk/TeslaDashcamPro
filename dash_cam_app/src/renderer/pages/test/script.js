const selectFolderButton = document.getElementById('select-folder');

// Example data
const entries = [
    {
        date: "09/04/24",
        details: [
            { time: "9:14 AM", thumbnail: "thumb1.jpg", duration: "00:10:49" },
            { time: "8:33 AM", thumbnail: "thumb2.jpg", duration: "00:10:49" }
        ]
    },
    {
        date: "08/23/24",
        details: [
            { time: "5:00 PM", thumbnail: "thumb3.jpg", duration: "00:05:30" }
        ]
    },
    {
        date: "08/11/24",
        details: [
            { time: "11:15 AM", thumbnail: "thumb4.jpg", duration: "00:07:45" }
        ]
    }
];

// Function to add entries to the saved page
function loadEntries() {
    const savedPage = document.getElementById("saved").querySelector(".timeline");

    entries.forEach(entry => {
        const dateItem = document.createElement("div");
        dateItem.classList.add("date-item");

        const dateSpan = document.createElement("span");
        dateSpan.classList.add("date");
        dateSpan.textContent = entry.date;
        dateSpan.onclick = () => toggleEntry(entry.date); // Example function to toggle entry details

        const entryContent = document.createElement("div");
        entryContent.id = entry.date; // Use date as ID
        entryContent.classList.add("entry-content");

        entry.details.forEach(detail => {
            const videoEntry = document.createElement("div");
            videoEntry.classList.add("video-entry");

            const link = document.createElement("a");
            link.href = `./videoPage.html?time=${detail.time}`; // Change this URL as needed
            // link.target = "_blank"; // Opens in a new tab

            const timeDiv = document.createElement("div");
            timeDiv.classList.add("time");
            timeDiv.textContent = detail.time;

            const videoThumbnail = document.createElement("div");
            videoThumbnail.classList.add("video-thumbnail");

            const img = document.createElement("img");
            img.src = detail.thumbnail;
            img.alt = "Video Thumbnail";

            const durationDiv = document.createElement("div");
            durationDiv.classList.add("video-duration");
            durationDiv.textContent = detail.duration;

            videoThumbnail.appendChild(img);
            videoThumbnail.appendChild(durationDiv);
            videoEntry.appendChild(timeDiv);
            videoEntry.appendChild(videoThumbnail);
            videoEntry.appendChild(link); // Add the link to videoEntry
            entryContent.appendChild(videoEntry);
        });

        dateItem.appendChild(dateSpan);
        dateItem.appendChild(entryContent);
        savedPage.appendChild(dateItem);
    });
}

// Call the function to load entries
loadEntries();


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

function toggleEntry(clickedDate) {
    const allEntries = document.querySelectorAll('.entry-content');

    allEntries.forEach(entry => {
        // If the entry's ID matches the clicked date, toggle it
        if (entry.id === clickedDate) {
            entry.style.display = entry.style.display === 'block' ? 'none' : 'block';
        } else {
            // Otherwise, collapse it
            entry.style.display = 'none';
        }
    });
}

// Default to showing the "Saved" page on load
document.addEventListener('DOMContentLoaded', () => {
    showPage('saved');
});

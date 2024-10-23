const selectFolderButton = document.getElementById('select-folder');

// Example data
const entries = [
    {
        date: "2024-09-04_09-14-00",
        thumbnail: "thumb1.jpg",
        duration: "00:10:49"
    },
    {
        date: "2024-09-04_08-33-00",
        thumbnail: "thumb2.jpg",
        duration: "00:10:49"
    },
    {
        date: "2024-08-23_09-14-00",
        thumbnail: "thumb3.jpg",
        duration: "00:10:50"
    },
    {
        date: "2024-08-11_15-14-00",
        thumbnail: "thumb4.jpg",
        duration: "00:10:51"
    },
];

// Function to add entries to the saved page
function loadEntries() {
    const savedPage = document.getElementById("saved").querySelector(".timeline");
    const groupedEntries = {};

    // Group entries by date
    entries.forEach(entry => {
        const entryDate = entry.date.split("_")[0]; // Extract date part (e.g., "2024-09-04")
        if (!groupedEntries[entryDate]) {
            groupedEntries[entryDate] = []; // Initialize if not exists
        }
        groupedEntries[entryDate].push(entry);
    });

    // Create date items and video entries
    for (const [date, details] of Object.entries(groupedEntries)) {
        const dateItem = document.createElement("div");
        dateItem.classList.add("date-item");

        const dateSpan = document.createElement("span");
        dateSpan.classList.add("date");
        dateSpan.textContent = date; // Use just the date
        dateSpan.onclick = () => toggleEntry(date); 

        const entryContent = document.createElement("div");
        entryContent.id = date;
        entryContent.classList.add("entry-content");

        details.forEach(detail => {
            const videoEntry = document.createElement("div");
            videoEntry.classList.add("video-entry");

            // Create a clickable link
            const link = document.createElement("a");
            link.href = `videoPage.html?time=${detail.date}`; // Change this URL as needed
            link.target = "_blank"; // Opens in a new tab

            const timeDiv = document.createElement("div");
            timeDiv.classList.add("time");
            timeDiv.textContent = detail.date.split("_")[1]; // Use time part

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
            link.appendChild(timeDiv);
            link.appendChild(videoThumbnail);
            videoEntry.appendChild(link); // Add the link to videoEntry
            entryContent.appendChild(videoEntry);
        });

        dateItem.appendChild(dateSpan);
        dateItem.appendChild(entryContent);
        savedPage.appendChild(dateItem);
    }
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

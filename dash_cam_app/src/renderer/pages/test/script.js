const selectFolderButton = document.getElementById('select-folder');

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

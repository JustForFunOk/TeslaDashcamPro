document.getElementById('selectFolder').addEventListener('click', async () => {
    const videoList = document.getElementById('videoList');
    const videoPlayer = document.getElementById('videoPlayer');

    videoList.innerHTML = ''; // 清空列表

    try {
        // 打开文件夹选择器
        const directoryHandle = await window.showDirectoryPicker();

        console.log('Folder selected:', directoryHandle);

        for await (const [name, handle] of directoryHandle) {
            console.log(name);

            // 检查文件扩展名是否为视频格式
            if (handle.kind === 'file' && /\.(mp4|mkv|webm|avi|mov)$/i.test(name)) {
                const listItem = document.createElement('li');
                listItem.textContent = name;

                listItem.addEventListener('click', async () => {
                    const file = await handle.getFile();
                    const videoURL = URL.createObjectURL(file);
                    videoPlayer.src = videoURL;
                });

                videoList.appendChild(listItem);
            }
        }
    } catch (err) {
        console.error('Error selecting folder:', err);
        alert('There was an error selecting the folder: ' + err.message);
    }
});

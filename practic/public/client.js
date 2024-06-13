const socket = io();

async function searchUrls() {
    const keyword = document.getElementById('keyword').value;
    const response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
    });
    if (response.ok) {
        const urls = await response.json();
        displayUrls(urls);
    } else {
        const error = await response.json();
        alert(error.error);
    }
}

function displayUrls(urls) {
    const urlList = document.getElementById('url-list');
    urlList.innerHTML = '<h3>Доступные URL</h3>';
    urls.forEach((url) => {
        const link = document.createElement('a');
        link.href = '#';
        link.innerText = url;
        link.onclick = () => {
            downloadContent(url);
            return false;
        };
        urlList.appendChild(link);
        urlList.appendChild(document.createElement('br'));
    });
}

async function downloadContent(url) {
    const response = await fetch('/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });

    const data = await response.json();
    const htmlContent = data.content;
    const size = data.size;

    localStorage.setItem(url, JSON.stringify({ content: htmlContent, contentType: 'text/html', size }));
    displayDownloadedContent();
}

function displayDownloadedContent() {
    const downloadedContent = document.getElementById('downloaded-content');
    downloadedContent.innerHTML = '<h3>Скаченный контент</h3>';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const item = JSON.parse(localStorage.getItem(key));
        const content = item.content;
        const contentType = item.contentType;
        const size = item.size;

        const div = document.createElement('div');
        div.innerHTML = `<h4>${key}</h4><p>Размер: ${(size)/1000} КБ</p>`;
        if (contentType === 'text/html') {
            const link = document.createElement('a');
            link.href = '#';
            link.innerText = 'Открыть';
            link.onclick = () => {
                const newWindow = window.open();
                newWindow.document.write(content);
                newWindow.document.close();
                return false;
            };
            div.appendChild(link);
        }
        downloadedContent.appendChild(div);
    }
}

function clearLocalStorage() {
    localStorage.clear();
    displayDownloadedContent();
}

window.onload = displayDownloadedContent;

socket.on('download-progress', (data) => {
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progress-bar');
    const downloadedKB = data.progress / 1024;
    const totalKB = data.total / 1024;

    progress.innerText = `Сохранение ${data.url}: ${downloadedKB.toFixed(2)} KB из ${totalKB.toFixed(2)} KB скаченно.`;
    progressBar.value = downloadedKB;
    progressBar.max = totalKB;
});

socket.on('download-complete', (data) => {
    const progress = document.getElementById('progress');
    progress.innerText = `Сохранение завершено: ${(data.size / 1024).toFixed(2)} KB скаченно.`;
});

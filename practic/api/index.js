const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

let keywordsData;

fs.readFile('./keywords.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Ошибка словаря:", err);
        return;
    }
    keywordsData = JSON.parse(data);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.post('/search', (req, res) => {
    const keyword = req.body.keyword.toLowerCase();
    if (keywordsData[keyword]) {
        res.json(keywordsData[keyword]);
    } else {
        res.status(404).json({ error: 'Отсутствуют URL для данного ключевого слова!' });
    }
});

app.post('/download', async (req, res) => {
    const url = req.body.url;
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        let totalBytes = 1024 ; 
        let downloadedBytes = 0;
        
        const interval = setInterval(() => {
            downloadedBytes += Math.random() * 1024 * 100;
            if (downloadedBytes >= totalBytes) {
                clearInterval(interval);
                downloadedBytes = totalBytes;
            }
            io.emit('download-progress', { url, progress: downloadedBytes, total: totalBytes });
        }, 500);

        await page.goto(url, { waitUntil: 'networkidle2' });
        const htmlContent = await page.content();
        const size = Buffer.byteLength(htmlContent, 'utf8');

        await browser.close();

        clearInterval(interval);
        io.emit('download-complete', { url, size });

        res.json({ content: htmlContent, contentType: 'text/html', size });
    } catch (error) {
        res.status(500).json({ error: 'Не удалось скачать контент' });
    }
});

server.listen(port, () => {
    console.log("Сервер запущен на http://localhost:" + port);
});
module.exports = app;
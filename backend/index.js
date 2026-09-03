const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Need to install uuid

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Helper to check valid youtube URL roughly
const isValidUrl = (url) => {
    return url.includes('youtube.com/') || url.includes('youtu.be/');
};

// Endpoint: Get video info
app.get('/api/info', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ error: 'Valid YouTube URL is required' });
        }

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            noPlaylist: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });
        
        // Find combined video+audio formats first
        let videoFormats = info.formats
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
            .map(format => ({
                itag: format.format_id,
                qualityLabel: format.resolution || format.format_note,
                container: format.ext,
                hasAudio: true,
                hasVideo: true,
            }));

        // If no combined formats exist (common for VEVO), show video-only streams BUT we will merge them later!
        // So we remove the "(No Audio)" warning, since backend will use ffmpeg to merge!
        if (videoFormats.length === 0) {
             videoFormats = info.formats
            .filter(f => f.vcodec !== 'none' && f.acodec === 'none')
            .map(format => ({
                itag: format.format_id,
                qualityLabel: format.resolution || format.format_note, // Removed "(No Audio)" warning!
                container: 'mp4', // Forced to mp4 after merge
                hasAudio: true, // It will have audio after we merge it
                hasVideo: true,
            }));
        }

        const audioFormats = info.formats
            .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
            .map(format => ({
                itag: format.format_id,
                audioBitrate: format.abr || parseInt(format.format_note) || 'Unknown',
                container: 'mp3', // Forced to MP3
                hasAudio: true,
                hasVideo: false,
                isMp3: true
            }));

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            author: info.uploader,
            lengthSeconds: info.duration,
            videoFormats,
            audioFormats
        });

    } catch (error) {
        console.error('Error fetching info:', error.message);
        res.status(500).json({ error: 'Failed to fetch video information. Make sure the video is public.' });
    }
});

// Endpoint: Download video/audio
app.get('/api/download', async (req, res) => {
    try {
        const { url, itag, type } = req.query;

        if (!url || !isValidUrl(url)) {
            return res.status(400).send('Valid YouTube URL is required');
        }

        if (!itag) {
            return res.status(400).send('Format itag is required');
        }

        // Generate unique ID for temp file
        const uuid = uuidv4();
        const outputTemplate = path.join(tempDir, `${uuid}.%(ext)s`);

        let ytdlOptions = {
            noCheckCertificates: true,
            noWarnings: true,
            noPlaylist: true,
            output: outputTemplate,
        };

        if (type === 'mp3') {
            ytdlOptions = {
                ...ytdlOptions,
                extractAudio: true,
                audioFormat: 'mp3',
                format: 'bestaudio'
            };
        } else {
            ytdlOptions = {
                ...ytdlOptions,
                format: `${itag}+bestaudio[ext=m4a]/bestaudio/best`,
                mergeOutputFormat: 'mp4'
            };
        }

        // This will block until download and conversion (ffmpeg) is complete
        await youtubedl(url, ytdlOptions);

        // Find the generated file (since yt-dlp replaces %(ext)s, we must find it)
        const files = fs.readdirSync(tempDir);
        const downloadedFile = files.find(f => f.startsWith(uuid));

        if (!downloadedFile) {
            throw new Error('Download failed, file not found');
        }

        const filePath = path.join(tempDir, downloadedFile);

        // Get video title for download name
        const info = await youtubedl(url, { dumpSingleJson: true, noPlaylist: true });
        const title = info.title.replace(/[^\w\s-]/gi, ''); // Sanitize
        const ext = downloadedFile.split('.').pop();
        const filename = `${title}.${ext}`;

        res.download(filePath, filename, (err) => {
            if (err) {
                console.error("Error sending file to client:", err);
            }
            // Cleanup temp file
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error("Failed to delete temp file:", e);
            }
        });

    } catch (error) {
        console.error('Error downloading:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Failed to download or convert video. Ensure ffmpeg is installed.');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

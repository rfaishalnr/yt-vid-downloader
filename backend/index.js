const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const { exec } = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

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
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });
        
        // Filter formats
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

        // If no combined formats exist (common for VEVO/music videos on YT), fallback to video only so user gets *something*
        if (videoFormats.length === 0) {
             videoFormats = info.formats
            .filter(f => f.vcodec !== 'none' && f.acodec === 'none')
            .map(format => ({
                itag: format.format_id,
                qualityLabel: (format.resolution || format.format_note) + " (No Audio)",
                container: format.ext,
                hasAudio: false,
                hasVideo: true,
            }));
        }

        const audioFormats = info.formats
            .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
            .map(format => ({
                itag: format.format_id,
                audioBitrate: format.abr || parseInt(format.format_note) || 'Unknown',
                container: format.ext,
                hasAudio: true,
                hasVideo: false,
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
        const { url, itag } = req.query;

        if (!url || !isValidUrl(url)) {
            return res.status(400).send('Valid YouTube URL is required');
        }

        if (!itag) {
            return res.status(400).send('Format itag is required');
        }

        // Get basic info for filename
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true
        });

        const title = info.title.replace(/[^\w\s]/gi, ''); // Sanitize filename
        const format = info.formats.find(f => f.format_id === itag);
        const ext = format ? format.ext : 'mp4';
        const filename = `${title}.${ext}`;
        
        res.header('Content-Disposition', `attachment; filename="${filename}"`);
        res.header('Content-Type', 'application/octet-stream'); // Generic stream

        // Spawn yt-dlp to download and pipe to response
        const subprocess = exec(url, {
            format: itag,
            output: '-', // stdout
            noCheckCertificates: true,
            noWarnings: true
        });

        subprocess.stdout.pipe(res);

        subprocess.on('error', (err) => {
            console.error('Download stream error:', err);
            if (!res.headersSent) {
                res.status(500).send('Stream error');
            }
        });

    } catch (error) {
        console.error('Error downloading:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Failed to download video');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

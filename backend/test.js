const youtubedl = require('youtube-dl-exec');

const url = 'https://www.youtube.com/watch?v=67auoS0oMzU';

async function test() {
    try {
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
        
        console.log("Title:", info.title);
        console.log("Thumbnail:", info.thumbnail);
        console.log("Author:", info.uploader);
        console.log("Length:", info.duration);
        
        // Print one video format and one audio format to see the fields
        const v = info.formats.find(f => f.vcodec !== 'none' && f.acodec !== 'none');
        console.log("Combined Format:", v);
        
        const a = info.formats.find(f => f.vcodec === 'none' && f.acodec !== 'none');
        console.log("Audio Format:", a);
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();

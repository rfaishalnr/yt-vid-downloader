const youtubedl = require('youtube-dl-exec');

const url = 'https://www.youtube.com/watch?v=67auoS0oMzU&list=RDMM67auoS0oMzU&start_radio=1';

async function test() {
    console.log("Starting test for URL:", url);
    try {
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
        console.log("Success! Title:", info.title);
        console.log("Formats exists?", !!info.formats);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();

// youtube-downloader.js
const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

const PORT = 3000;

// Download video as MP4
app.post('/download/mp4', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).send({ error: 'URL is required' });
  }

  const outputPath = `downloads/%(title)s.%(ext)s`;
  const command = `yt-dlp -f best -o "${outputPath}" "${url}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send({ error: 'Download failed' });
    }
    res.send({ message: 'Download started', stdout });
  });
});

// Download video as MP3
app.post('/download/mp3', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).send({ error: 'URL is required' });
  }

  const outputPath = `downloads/%(title)s.%(ext)s`;
  const command = `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send({ error: 'Download failed' });
    }
    res.send({ message: 'Download started', stdout });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

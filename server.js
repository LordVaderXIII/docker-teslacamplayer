const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Environment variables for login
if (!process.env.SESSION_SECRET || !process.env.TESLA_USERNAME || !process.env.TESLA_PASSWORD) {
    throw new Error('Missing required environment variables: SESSION_SECRET, TESLA_USERNAME, TESLA_PASSWORD');
}
const USERNAME = process.env.TESLA_USERNAME;
const PASSWORD = process.env.TESLA_PASSWORD;

// Middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Authentication middleware
function requireLogin(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
app.get('/', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    req.session.loggedin = true;
    req.session.username = username;
    res.redirect('/');
  } else {
    res.send('Incorrect Username and/or Password!');
  }
  res.end();
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/login');
  });
});

// API endpoint to get the list of clips
app.get('/api/clips', (req, res) => {
    const clipsDir = '/clips';

    if (!fs.existsSync(clipsDir)) {
        console.log("Clips directory not found:", clipsDir);
        return res.json([]);
    }

    const getClips = (dir) => {
        let allFiles = [];
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    allFiles = allFiles.concat(getClips(fullPath));
                } else if (item.isFile() && item.name.endsWith('.mp4')) {
                    allFiles.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error reading directory ${dir}:`, error);
        }
        return allFiles;
    };

    const allMp4Files = getClips(clipsDir);

    const fileGroups = {};
    for (const file of allMp4Files) {
        const filename = path.basename(file);
        const timestamp = filename.substring(0, 19); // YYYY-MM-DD_HH-MM-SS
        if (!fileGroups[timestamp]) {
            fileGroups[timestamp] = [];
        }
        const relativePath = path.relative(clipsDir, file);
        fileGroups[timestamp].push(relativePath);
    }

    const sortedGroups = Object.values(fileGroups).sort((a, b) => {
        const timestampA = path.basename(a[0]).substring(0, 19);
        const timestampB = path.basename(b[0]).substring(0, 19);
        return timestampA.localeCompare(timestampB);
    });

    res.json(sortedGroups);
});

// Video streaming endpoint
app.get('/video/*', (req, res) => {
    const videoPath = path.join('/clips', req.params[0]);
    const clipsDir = path.resolve('/clips');
    const requestedPath = path.resolve(videoPath);

    if (!requestedPath.startsWith(clipsDir)) {
        return res.status(403).send('Forbidden');
    }

    if (fs.existsSync(requestedPath)) {
        res.sendFile(requestedPath);
    } else {
        res.status(404).send('File not found');
    }
});

app.post('/export', (req, res) => {
    const { startTime, endTime, fileNames } = req.body;
    const startTimeInt = parseInt(startTime, 10);
    const endTimeInt = parseInt(endTime, 10);

    if (isNaN(startTimeInt) || isNaN(endTimeInt)) {
        return res.status(400).send('Invalid time format');
    }

    const outputFilename = `exported_clip_${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, 'temp_exports', outputFilename);
    const tempDir = path.join(__dirname, 'temp_exports');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const clipsDir = path.resolve('/clips');
    for (const fileName of fileNames) {
        const fullPath = path.resolve(clipsDir, fileName);

        // Path Traversal Check
        if (!fullPath.startsWith(clipsDir)) {
            return res.status(403).send('Forbidden: Path traversal detected.');
        }

        // Existence Check
        if (!fs.existsSync(fullPath)) {
            return res.status(404).send(`File not found: ${fileName}`);
        }
    }

    const videoPaths = fileNames.map(name => path.join('/clips', name));

    // Identify main video (front camera)
    let mainVideoIndex = videoPaths.findIndex(p => p.includes('front'));
    if (mainVideoIndex === -1) {
        mainVideoIndex = 0; // Default to the first video if "front" is not found
    }
    const mainVideo = videoPaths[mainVideoIndex];
    const otherVideos = videoPaths.filter((_, i) => i !== mainVideoIndex);

    let ffmpegCommand = `ffmpeg -y `;
    ffmpegCommand += `-i "${mainVideo}" `;
    otherVideos.forEach(video => {
        ffmpegCommand += `-i "${video}" `;
    });

    ffmpegCommand += `-filter_complex "`;
    ffmpegCommand += `[0:v]trim=start=${startTimeInt}:end=${endTimeInt},setpts=PTS-STARTPTS[v0];`;

    let lastOverlayOutput = 'v0';
    otherVideos.forEach((_, index) => {
        const videoIndex = index + 1;
        const x = (index % 2 === 0) ? '10' : 'W-w-10'; // left/right
        const y = (index < 2) ? '10' : 'H-h-10'; // top/bottom

        ffmpegCommand += `[${videoIndex}:v]trim=start=${startTimeInt}:end=${endTimeInt},setpts=PTS-STARTPTS,scale=iw/4:ih/4[pip${videoIndex}];`;
        ffmpegCommand += `[${lastOverlayOutput}][pip${videoIndex}]overlay=x=${x}:y=${y}[v${videoIndex}];`;
        lastOverlayOutput = `v${videoIndex}`;
    });

    ffmpegCommand += `" -map "[${lastOverlayOutput}]" -c:v libx264 -preset veryfast -crf 22 "${outputPath}"`;

    exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`ffmpeg error: ${error.message}`);
            console.error(`ffmpeg stderr: ${stderr}`);
            return res.status(500).send('Error exporting video');
        }
        res.download(outputPath, outputFilename, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Cleanup
            fs.unlinkSync(outputPath);
        });
    });
});


// Start the server
app.listen(port, () => {
    // Clean up temp directory on startup
    const tempDir = path.join(__dirname, 'temp_exports');
    if (fs.existsSync(tempDir)) {
        fs.readdirSync(tempDir).forEach(file => {
            fs.unlinkSync(path.join(tempDir, file));
        });
    }
    console.log(`Server listening on port ${port}`);
});

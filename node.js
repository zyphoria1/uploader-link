const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const upload = multer({ dest: '/tmp/' });

// Serve static files
app.use(express.static('public'));

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const originalName = req.file.originalname;
    const newPath = path.join(__dirname, 'uploads', fileId + path.extname(originalName));

    fs.renameSync(req.file.path, newPath);

    // Schedule file deletion after 60 minutes
    setTimeout(() => {
        try {
            fs.unlinkSync(newPath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    }, 60 * 60 * 1000);

    res.json({
        downloadUrl: `${req.protocol}://${req.get('host')}/download/${fileId}${path.extname(originalName)}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
});

// File download endpoint
app.get('/download/:fileId', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.fileId);
    res.download(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const { Bucket } = require('@upstash/blob');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Render-এ লগইন কাজ করার জন্য এই লাইনটি জরুরি
app.set('trust proxy', 1);

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const bucket = new Bucket({
    url: process.env.UPSTASH_BLOB_URL,
    token: process.env.UPSTASH_BLOB_TOKEN
});

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 300 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({ 
    secret: process.env.SESSION_SECRET || 'snappro-super-secret-key-2026',
    resave: false, 
    saveUninitialized: false,
    cookie: { 
        secure: false, // লগইন লুপ এড়াতে
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.redirect('/login');
}

app.get('/api/apps', async (req, res) => {
    try {
        const apps = await redis.get('snappro_apps');
        res.json(apps || []);
    } catch (error) {
        console.error('Redis error:', error);
        res.json([]);
    }
});

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.post('/login', (req, res) => {
    const userPass = req.body.password;
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';

    if (userPass === adminPass) {
        req.session.isAdmin = true;
        req.session.save((err) => {
            if (err) return res.status(500).send("Session error");
            res.redirect('/snap-admin');
        });
    } else {
        res.redirect('/login?error=1');
    }
});

app.get('/logout', (req, res) => { 
    req.session.destroy(); 
    res.redirect('/'); 
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/snap-admin', isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.post('/snap-admin/upload', isAuthenticated, upload.single('apkfile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No APK file uploaded.' });
        
        let { version, size, device } = req.body;
        const finalVersion = (version && version.trim() !== '') ? version.trim() : '1.0.0';
        const finalSize = size || (req.file.size / (1024 * 1024)).toFixed(1) + ' MB';
        const finalDevice = (device && device.trim() !== '') ? device.trim() : 'Android 8.0+';
        const filename = `snappro-v${finalVersion}-${Date.now()}.apk`;
        
        const blob = await bucket.put(filename, req.file.buffer, {
            contentType: 'application/vnd.android.package-archive',
            access: 'public'
        });

        const downloadUrl = blob.url;
        let apps = await redis.get('snappro_apps') || [];
        if (typeof apps === 'string') apps = JSON.parse(apps);

        let existingAppIndex = apps.findIndex(a => a.id === 'snappro');
        
        if (existingAppIndex !== -1) {
            let existingApp = apps[existingAppIndex];
            existingApp.versions = existingApp.versions.filter(v => v.version !== finalVersion);
            existingApp.versions.unshift({ version: finalVersion, filename: downloadUrl, size: finalSize, device: finalDevice, date: new Date().toLocaleDateString() });
            apps.splice(existingAppIndex, 1);
            apps.unshift(existingApp);
        } else {
            apps.unshift({
                id: 'snappro', title: "SnapPro", description: "The fastest video downloader for Android.",
                tags: "Video Downloader",
                versions: [{ version: finalVersion, filename: downloadUrl, size: finalSize, device: finalDevice, date: new Date().toLocaleDateString() }]
            });
        }

        await redis.set('snappro_apps', apps);
        res.json({ success: true, message: 'App uploaded successfully!' });
    } catch (error) {
        console.error('UPLOAD ERROR DETAILS:', error); 
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to upload file. Check logs.' });
        }
    }
});

app.get('/download/:version', async (req, res) => {
    try {
        const requestedVersion = req.params.version;
        let apps = await redis.get('snappro_apps') || [];
        if (typeof apps === 'string') apps = JSON.parse(apps);
        
        if (apps.length === 0) return res.status(404).send('App not found.');
        
        let targetVersion = apps[0].versions.find(v => v.version === requestedVersion) || apps[0].versions[0];
        if (!targetVersion) return res.status(404).send('Version not found.');

        res.redirect(targetVersion.filename); 

    } catch (error) {
        console.error('Proxy error:', error);
        if (!res.headersSent) res.status(500).send('Server Error');
    }
});

app.post('/snap-admin/delete-version', isAuthenticated, async (req, res) => {
    const { filename } = req.body;
    try {
        let apps = await redis.get('snappro_apps') || [];
        if (typeof apps === 'string') apps = JSON.parse(apps);

        if (apps.length > 0) {
            let app = apps[0];
            if (filename.startsWith('http')) {
                const blobName = filename.split('/').pop().split('?')[0]; 
                await bucket.del(blobName);
            }
            app.versions = app.versions.filter(v => v.filename !== filename);
            if (app.versions.length === 0) apps = []; 
            await redis.set('snappro_apps', apps);
        }
    } catch (err) { console.error(err); }
    res.redirect('/snap-admin');
});

app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`⚡ Server running on: http://localhost:${PORT}`));

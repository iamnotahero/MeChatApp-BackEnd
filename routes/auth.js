const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { signup, login } = require('../controllers/auth.js');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '..', 'uploads', 'avatars');
const allowedImageTypes = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/gif', '.gif'],
    ['image/webp', '.webp'],
]);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
        const extension = allowedImageTypes.get(file.mimetype);
        callback(null, `${crypto.randomBytes(16).toString('hex')}${extension}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!allowedImageTypes.has(file.mimetype)) {
            return callback(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'));
        }

        callback(null, true);
    },
});

router.post('/signup', upload.single('avatarURL'), signup);
router.post('/login', upload.single('avatarURL'), login);

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: error.message });
    }

    if (error.message === 'Only JPEG, PNG, GIF, or WebP images are allowed') {
        return res.status(400).json({ message: error.message });
    }

    next(error);
});

module.exports = router;
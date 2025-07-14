const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { getWeatherFromCSV, getWeatherHistory } = require('../controllers/weatherController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') cb(null, true);
    else cb(new Error('Only CSV files are allowed'));
  }
});

router.post('/upload', upload.single('file'), getWeatherFromCSV);
router.get('/history', getWeatherHistory);

module.exports = router;

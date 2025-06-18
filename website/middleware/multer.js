const multer = require('multer');
const path = require('path');

const NEWS_UPLOAD_PATH = 'public/images/newsPhoto';

const storageNewsPhotos = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, NEWS_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploadNewsPhoto = multer({
    storage: storageNewsPhotos,
    limits: { fileSize: 10 * 1024 * 1024 }, // до 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения (jpeg, jpg, png)'));
        }
    }
});

const REVIEW_UPLOAD_PATH = 'public/images/reviewPhoto';

const storageReviewPhotos = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, REVIEW_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});


const uploadReviewPhotos = multer({
  storage: storageReviewPhotos,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (jpeg, jpg, png)'));
    }
  }
});

const LAWYER_UPLOAD_PATH = 'public/images/lawyerPhoto';

const storageLawyerPhotos = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, LAWYER_UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploadLawyerPhotos = multer({
  storage: storageLawyerPhotos,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (jpeg, jpg, png)'));
    }
  }
});

module.exports = {
    uploadNewsPhoto,
    uploadReviewPhotos,
    uploadLawyerPhotos
};

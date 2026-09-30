import multer from 'multer';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from '../utils/fileValidation.util';

// Store uploaded files in memory buffers to stream directly to S3
const storage = multer.memoryStorage();

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed image formats: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`
      )
    );
  }
};

const videoFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed video formats: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`
      )
    );
  }
};

const singleImageMulter = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: imageFileFilter,
}).any();

export const uploadSingleImage = (req: any, res: any, next: any) => {
  singleImageMulter(req, res, (err: any) => {
    if (err) return next(err);
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

export const uploadMultipleImages = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: imageFileFilter,
}).array('files', 10);

export const uploadSingleVideo = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
  fileFilter: videoFileFilter,
}).single('file');

export const uploadMultipleVideos = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
  fileFilter: videoFileFilter,
}).array('files', 5);

const csvFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const isCsvExt = file.originalname.toLowerCase().endsWith('.csv');
  const allowedCsvMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'text/plain',
    'text/x-csv',
    'application/csv',
    'application/x-csv',
    'text/comma-separated-values',
    'application/excel',
    'application/octet-stream',
  ];
  if (isCsvExt || allowedCsvMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Please upload a valid CSV file (.csv)'));
  }
};

const singleCsvMulter = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: csvFileFilter,
}).any();

export const uploadSingleCsv = (req: any, res: any, next: any) => {
  singleCsvMulter(req, res, (err: any) => {
    if (err) return next(err);
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};


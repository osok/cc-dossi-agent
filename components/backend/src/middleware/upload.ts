import multer from 'multer';

/**
 * Multer configuration for agent .md file uploads.
 * Memory storage (files in buffer), 1MB limit, .md extension only.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB per file
    files: 100, // Max 100 files per upload (NFR-SCALE-001)
  },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Only .md files are accepted'));
    }
  },
});

const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for documents
});

// GET /api/documents - Retrieve documents
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    let whereClause = {};
    if (userId && userId !== 'admin') {
      // For employees, show their own uploads + files targeted to them or ALL employees by admin
      whereClause = {
        [Op.or]: [
          { uploaderId: userId },
          {
            uploaderId: 'admin',
            [Op.or]: [
              { targetType: 'ALL' },
              { targetType: 'INDIVIDUAL', targetUserId: userId }
            ]
          }
        ]
      };
    }

    const documents = await Document.findAll({
      where: whereClause,
      order: [['uploadedAt', 'DESC']]
    });

    return res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/documents - Upload document
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file selected for upload.' });
    }

    const {
      title,
      uploaderId,
      uploaderName,
      targetType,
      targetUserId,
      targetUserName
    } = req.body;

    if (!title || !uploaderId || !uploaderName || !targetType) {
      // Clean up the uploaded file since DB record creation failed/skipped
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Missing required document upload parameters.' });
    }

    // Build the static file path accessible by clients
    const filePath = `/static/uploads/${req.file.filename}`;
    const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const fileSize = req.file.size;

    const newDoc = await Document.create({
      title,
      filePath,
      uploaderId,
      uploaderName,
      targetType,
      targetUserId: targetType === 'INDIVIDUAL' ? targetUserId : null,
      targetUserName: targetType === 'INDIVIDUAL' ? targetUserName : null,
      fileType,
      fileSize,
      uploadedAt: Date.now()
    });

    return res.status(201).json(newDoc);
  } catch (error) {
    console.error('Error uploading document:', error);
    // Clean up file if error occurs
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Attempt to delete physical file from disk
    const filename = path.basename(document.filePath);
    const fullPath = path.join(__dirname, '..', 'uploads', filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await document.destroy();
    return res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

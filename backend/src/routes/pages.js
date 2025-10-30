const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const pageController = require('../controllers/pageController');
const { upload } = require('../utils/fileUpload');

// Pages CRUD & Tree & Search
router.get('/tree', authenticateToken, pageController.getTree);
router.get('/search', authenticateToken, pageController.searchPages);
router.get('/slug/:slug', authenticateToken, pageController.getBySlug);
router.get('/:id', authenticateToken, pageController.getById);
router.post('/', authenticateToken, pageController.createPage);
router.put('/:id', authenticateToken, pageController.updatePage);
router.delete('/:id', authenticateToken, pageController.deletePage);

// Blocks
router.get('/:id/blocks', authenticateToken, pageController.listBlocks);
router.post('/:id/blocks', authenticateToken, pageController.createBlock);
router.post('/:id/blocks/reorder', authenticateToken, pageController.reorderBlocks);
router.post('/:id/blocks/upload', authenticateToken, upload.single('file'), pageController.uploadBlockImage);
router.put('/blocks/:blockId', authenticateToken, pageController.updateBlock);
router.delete('/blocks/:blockId', authenticateToken, pageController.deleteBlock);

module.exports = router;



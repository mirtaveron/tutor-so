const express = require('express');
const router = express.Router();
const { getUnits, getLessonById, toggleLessonProgress, getUserProgress } = require('../controllers/contentController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Todas las rutas de contenido requieren autenticación
router.use(requireAuth);

router.get('/units', getUnits);
router.get('/lessons/:id', getLessonById);
router.post('/lessons/:id/progress', toggleLessonProgress);
router.get('/progress', getUserProgress);

module.exports = router;

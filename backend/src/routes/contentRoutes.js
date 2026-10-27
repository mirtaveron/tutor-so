const express = require('express');
const router = express.Router();
const { getUnits, getLessonById, toggleLessonProgress, getUserProgress } = require('../controllers/contentController');

// Todas las rutas de contenido son públicas (sin login requerido)
router.get('/units', getUnits);
router.get('/lessons/:id', getLessonById);
router.post('/lessons/:id/progress', toggleLessonProgress);
router.get('/progress', getUserProgress);

module.exports = router;

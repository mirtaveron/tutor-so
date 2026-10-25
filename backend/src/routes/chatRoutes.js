const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Ruta para enviar mensajes al Asistente IA
router.post('/', chatController.sendMessage);

module.exports = router;

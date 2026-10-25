const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Confianza en proxies inversos (necesario en Render, Railway, etc. para HTTPS)
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Importante para las cookies HttpOnly
}));
app.use(express.json());
app.use(cookieParser());

// Rutas
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Rutas base
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor de OS-UNS corriendo en http://localhost:${PORT}`);
});

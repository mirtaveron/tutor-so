const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Confianza en proxies inversos (necesario en Render, Railway, etc. para HTTPS)
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permitir acceso desde localhost, red Wi-Fi o dominio de producción
    callback(null, true);
  },
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

// Obtener IPs locales de la máquina
function getLocalIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

// Inicio del servidor en 0.0.0.0 para permitir conexiones desde dispositivos en la misma red Wi-Fi (como el celular)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`Servidor TutorSO activo en puerto ${PORT}`);
  console.log(`- Local PC:   http://localhost:${PORT}`);
  const ips = getLocalIPs();
  ips.forEach(ip => {
    console.log(`- Red Wi-Fi:  http://${ip}:${PORT}`);
  });
  console.log(`========================================\n`);
});

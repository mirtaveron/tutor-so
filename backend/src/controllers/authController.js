const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
});

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password_hash }
    });

    const token = generateToken(user.id, user.role);

    res.cookie('token', token, getCookieOptions());

    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = generateToken(user.id, user.role);

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', getCookieOptions());
  res.status(200).json({ message: 'Sesión cerrada exitosamente' });
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { register, login, logout, getMe };

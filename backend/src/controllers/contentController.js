const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las unidades con sus lecciones
const getUnits = async (req, res) => {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, type: true, order: true }
        }
      }
    });
    res.status(200).json(units);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las unidades' });
  }
};

// Obtener el detalle de una lección (con pasos si es TP)
const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lección no encontrada' });
    }

    res.status(200).json(lesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la lección' });
  }
};

// Marcar/Desmarcar lección como completada
const toggleLessonProgress = async (req, res) => {
  try {
    const { id } = req.params; // lessonId
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(200).json({ message: 'Modo sin login activo', completed: true });
    }

    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: id } }
    });

    if (existingProgress) {
      await prisma.userProgress.delete({
        where: { userId_lessonId: { userId, lessonId: id } }
      });
      return res.status(200).json({ message: 'Lección desmarcada', completed: false });
    } else {
      await prisma.userProgress.create({
        data: { userId, lessonId: id }
      });
      return res.status(200).json({ message: 'Lección completada', completed: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el progreso' });
  }
};

// Obtener progreso del usuario (lista de IDs de lecciones completadas)
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(200).json([]);
    }
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true }
    });
    
    res.status(200).json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el progreso del usuario' });
  }
};

module.exports = { getUnits, getLessonById, toggleLessonProgress, getUserProgress };

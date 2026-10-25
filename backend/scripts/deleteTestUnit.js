const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
prisma.unit.deleteMany({where: {title: 'Administración de Memoria'}})
  .then(res => console.log('Borrados:', res.count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());

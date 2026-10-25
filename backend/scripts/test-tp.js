const {PrismaClient} = require('@prisma/client'); 
const prisma = new PrismaClient(); 
prisma.lesson.findFirst({where: {type: 'PRACTICAL_WORK'}})
  .then(res => console.log(res.content))
  .finally(() => prisma.$disconnect());

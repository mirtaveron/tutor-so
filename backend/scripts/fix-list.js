const {PrismaClient} = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function fix() { 
  const tp2 = await prisma.lesson.findFirst({where:{title:{contains:'Practico2'}}}); 
  const step = await prisma.step.findFirst({where:{lessonId:tp2.id, order:2}}); 
  
  await prisma.step.update({
    where:{id:step.id}, 
    data:{
      explanation: '**Sucesos:** Arranque del sistema (init), el usuario ejecuta un programa (doble clic), o un proceso pide explícitamente crear otro proceso (syscall `fork` en UNIX).\n\n**Pasos del SO:**\n1. Asigna un identificador (PID).\n2. Crea y ubica su Bloque de Control de Proceso (PCB).\n3. Asigna espacio en memoria para su código, datos y pila.\n4. Lo inserta en la cola de procesos Listos (Ready).'
    }
  }); 
  console.log('Formato de lista arreglado'); 
} 
fix().finally(() => prisma.$disconnect());

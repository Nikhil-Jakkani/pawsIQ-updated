import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVaccinesDetails() {
  try {
    console.log('📋 Detailed Vaccine Master Analysis...\n');
    
    // Get unique combinations of pet_type and pet_age_grp
    const combinations = await prisma.pIQ_Vaccine_Master.findMany({
      distinct: ['pet_type', 'pet_age_grp'],
      select: { 
        pet_type: true,
        pet_age_grp: true
      }
    });
    
    console.log('Available Pet Type + Age Group combinations:');
    combinations.forEach(c => {
      console.log(`  ✓ Pet Type: "${c.pet_type}", Age Group: "${c.pet_age_grp}"`);
    });
    
    console.log('\n---\n');
    
    // Count by pet type
    const typeCount = {};
    const allVaccines = await prisma.pIQ_Vaccine_Master.findMany({
      select: { pet_type: true }
    });
    
    allVaccines.forEach(v => {
      typeCount[v.pet_type] = (typeCount[v.pet_type] || 0) + 1;
    });
    
    console.log('Vaccine count by pet type:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} vaccines`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkVaccinesDetails();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVaccines() {
  try {
    console.log('📋 Checking Vaccine Master Data in Database...\n');
    
    // Get count of all vaccines
    const totalCount = await prisma.pIQ_Vaccine_Master.count();
    console.log(`Total vaccines in database: ${totalCount}\n`);
    
    // Get unique pet types
    const uniqueTypes = await prisma.pIQ_Vaccine_Master.findMany({
      distinct: ['pet_type'],
      select: { pet_type: true }
    });
    console.log('Pet types available:');
    uniqueTypes.forEach(t => console.log(`  - ${t.pet_type}`));
    
    console.log('\n---\n');
    
    // Check vaccines for Dog - Adult
    console.log('Vaccines for Dog - Adult:');
    const dogAdult = await prisma.pIQ_Vaccine_Master.findMany({
      where: {
        pet_type: 'Dog',
        pet_age_grp: 'Adult'
      },
      select: {
        vaccine_mstr_id: true,
        vaccine_name: true,
        vaccine_purpose: true,
        pet_age_grp: true,
        is_vaccine_core: true
      }
    });
    console.log(`Found: ${dogAdult.length} vaccines`);
    dogAdult.forEach(v => {
      console.log(`  ✓ ${v.vaccine_name} (${v.is_vaccine_core ? 'CORE' : 'non-core'})`);
    });
    
    console.log('\n---\n');
    
    // Check vaccines for Cat - Puppy
    console.log('Vaccines for Cat - Puppy:');
    const catPuppy = await prisma.pIQ_Vaccine_Master.findMany({
      where: {
        pet_type: 'Cat',
        pet_age_grp: 'Puppy'
      },
      select: {
        vaccine_mstr_id: true,
        vaccine_name: true,
        vaccine_purpose: true,
        pet_age_grp: true,
        is_vaccine_core: true
      }
    });
    console.log(`Found: ${catPuppy.length} vaccines`);
    catPuppy.forEach(v => {
      console.log(`  ✓ ${v.vaccine_name} (${v.is_vaccine_core ? 'CORE' : 'non-core'})`);
    });
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkVaccines();
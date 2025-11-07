import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const additionalVaccines = [
  // Cat vaccines - Puppy (Kitten)
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'FVRCP', vaccine_purpose: 'Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia', vaccine_description_dtls: 'Essential for all kittens. Protects against feline distemper and respiratory diseases.', vaccine_pet_age: '6-8 weeks', vaccine_frequency: '3-4 weeks intervals until 16 weeks', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Rabies', vaccine_purpose: 'Rabies protection', vaccine_description_dtls: 'Required by law. Protects against rabies virus.', vaccine_pet_age: '12-16 weeks', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Feline Leukemia (FeLV)', vaccine_purpose: 'Feline Leukemia protection', vaccine_description_dtls: 'Recommended for outdoor cats or those exposed to outdoor cats.', vaccine_pet_age: '8-12 weeks', vaccine_frequency: '2-4 weeks after first dose, then annually for 1 year', is_vaccine_core: false },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Feline Immunodeficiency Virus (FIV)', vaccine_purpose: 'FIV protection', vaccine_description_dtls: 'Recommended for outdoor cats or those in households with FIV+ cats.', vaccine_pet_age: '12+ weeks', vaccine_frequency: '2-4 weeks after first dose, then annually', is_vaccine_core: false },

  // Cat vaccines - Adult
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'FVRCP', vaccine_purpose: 'Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia', vaccine_description_dtls: 'Booster shots recommended every 1-3 years.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Rabies', vaccine_purpose: 'Rabies protection', vaccine_description_dtls: 'Required by law. Booster shots required per local regulations.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Feline Leukemia (FeLV)', vaccine_purpose: 'Feline Leukemia protection', vaccine_description_dtls: 'Annual booster for outdoor cats or cats in multi-cat households.', vaccine_pet_age: 'Adult', vaccine_frequency: 'Annually (outdoor)', is_vaccine_core: false },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Feline Immunodeficiency Virus (FIV)', vaccine_purpose: 'FIV protection', vaccine_description_dtls: 'Annual booster for at-risk cats.', vaccine_pet_age: 'Adult', vaccine_frequency: 'Annually', is_vaccine_core: false },

  // Cat vaccines - Senior
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'FVRCP', vaccine_purpose: 'Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia', vaccine_description_dtls: 'Senior cats should maintain vaccination protection based on health status.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Rabies', vaccine_purpose: 'Rabies protection', vaccine_description_dtls: 'Required by law even for senior cats.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Feline Leukemia (FeLV)', vaccine_purpose: 'Feline Leukemia protection', vaccine_description_dtls: 'Discuss with vet based on health status and exposure risk.', vaccine_pet_age: 'Senior', vaccine_frequency: 'As recommended by vet', is_vaccine_core: false },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Feline Immunodeficiency Virus (FIV)', vaccine_purpose: 'FIV protection', vaccine_description_dtls: 'Discuss with vet based on health status and exposure risk.', vaccine_pet_age: 'Senior', vaccine_frequency: 'As recommended by vet', is_vaccine_core: false },

  // Other pets - Puppy
  { pet_type: 'Other', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Rabies', vaccine_purpose: 'Rabies protection', vaccine_description_dtls: 'Required by law for most exotic pets. Check local regulations.', vaccine_pet_age: '12-16 weeks', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },

  // Other pets - Adult
  { pet_type: 'Other', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Rabies', vaccine_purpose: 'Rabies protection', vaccine_description_dtls: 'Required by law for most exotic pets.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },

  // Other pets - Senior
  { pet_type: 'Other', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Rabies', vaccine_purpose: 'Rabies protection', vaccine_description_dtls: 'Required by law even for senior exotic pets.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true }
];

async function seed() {
  try {
    console.log('🚀 Adding Cat and Other pet vaccines...\n');
    
    const result = await prisma.pIQ_Vaccine_Master.createMany({
      data: additionalVaccines,
      skipDuplicates: true,
    });

    console.log(`✅ Successfully added ${result.count} vaccines for Cat and Other pets!`);
    
    // Show summary
    const dogCount = await prisma.pIQ_Vaccine_Master.count({ where: { pet_type: 'Dog' } });
    const catCount = await prisma.pIQ_Vaccine_Master.count({ where: { pet_type: 'Cat' } });
    const otherCount = await prisma.pIQ_Vaccine_Master.count({ where: { pet_type: 'Other' } });
    
    console.log('\n📊 Vaccine Distribution:');
    console.log(`  🐕 Dog: ${dogCount} vaccines`);
    console.log(`  🐱 Cat: ${catCount} vaccines`);
    console.log(`  🦎 Other: ${otherCount} vaccines`);
    console.log(`  📈 Total: ${dogCount + catCount + otherCount} vaccines`);
    
    console.log('\n🎉 All pet types now have vaccinations!');
    
  } catch (error) {
    console.error('❌ Error seeding vaccines:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
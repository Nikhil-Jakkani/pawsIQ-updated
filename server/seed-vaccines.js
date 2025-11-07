import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vaccineData = [
  // Core vaccines for Dogs - Puppy
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'DHPP (Distemper/Parvovirus)', vaccine_purpose: 'Core vaccine protecting against distemper, hepatitis, parvovirus, and parainfluenza', vaccine_description_dtls: 'Essential for all puppies. Protects against deadly viral diseases.', vaccine_pet_age: '6-8 weeks', vaccine_frequency: '6 weeks, then 3-4 weeks intervals', is_vaccine_core: true },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law. Protects against rabies virus.', vaccine_pet_age: '12-16 weeks', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Bordetella (Kennel Cough)', vaccine_purpose: 'Non-core vaccine for respiratory protection', vaccine_description_dtls: 'Recommended if puppy will be boarded or attend dog parks. Intranasal or injection form available.', vaccine_pet_age: '3-4 weeks', vaccine_frequency: 'Annually or every 6 months', is_vaccine_core: false },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Leptospirosis', vaccine_purpose: 'Non-core vaccine for bacterial infection protection', vaccine_description_dtls: 'Recommended in areas with high exposure risk. Protects against bacterial disease spread by wildlife urine.', vaccine_pet_age: '8-12 weeks', vaccine_frequency: '2-4 weeks after first dose, then annually', is_vaccine_core: false },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Lyme Disease', vaccine_purpose: 'Non-core vaccine for tick-borne disease protection', vaccine_description_dtls: 'Recommended in tick-endemic areas. Protects against Lyme disease bacteria.', vaccine_pet_age: '12 weeks', vaccine_frequency: '2-4 weeks after first dose, then annually', is_vaccine_core: false },

  // Core vaccines for Dogs - Adult
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'DHPP (Distemper/Parvovirus)', vaccine_purpose: 'Core vaccine protecting against distemper, hepatitis, parvovirus, and parainfluenza', vaccine_description_dtls: 'Essential for all adult dogs. Booster shots recommended every 3 years.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law. Booster shots required per local regulations.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Bordetella (Kennel Cough)', vaccine_purpose: 'Non-core vaccine for respiratory protection', vaccine_description_dtls: 'Recommended for dogs with exposure risk. Annual booster recommended.', vaccine_pet_age: 'Adult', vaccine_frequency: 'Annually', is_vaccine_core: false },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Leptospirosis', vaccine_purpose: 'Non-core vaccine for bacterial infection protection', vaccine_description_dtls: 'Recommended annually in high-risk areas.', vaccine_pet_age: 'Adult', vaccine_frequency: 'Annually', is_vaccine_core: false },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Lyme Disease', vaccine_purpose: 'Non-core vaccine for tick-borne disease protection', vaccine_description_dtls: 'Recommended annually in endemic areas.', vaccine_pet_age: 'Adult', vaccine_frequency: 'Annually', is_vaccine_core: false },

  // Core vaccines for Dogs - Senior
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'DHPP (Distemper/Parvovirus)', vaccine_purpose: 'Core vaccine protecting against distemper, hepatitis, parvovirus, and parainfluenza', vaccine_description_dtls: 'Senior dogs should maintain vaccination protection. Booster every 3 years.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law even for senior dogs. Booster shots required per local regulations.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Bordetella (Kennel Cough)', vaccine_purpose: 'Non-core vaccine for respiratory protection', vaccine_description_dtls: 'Optional for senior dogs based on lifestyle and health status.', vaccine_pet_age: 'Senior', vaccine_frequency: 'Annually', is_vaccine_core: false },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Leptospirosis', vaccine_purpose: 'Non-core vaccine for bacterial infection protection', vaccine_description_dtls: 'Discuss with vet based on health status and exposure risk.', vaccine_pet_age: 'Senior', vaccine_frequency: 'Annually', is_vaccine_core: false },
  { pet_type: 'Dog', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Lyme Disease', vaccine_purpose: 'Non-core vaccine for tick-borne disease protection', vaccine_description_dtls: 'Consider based on exposure risk and overall health.', vaccine_pet_age: 'Senior', vaccine_frequency: 'Annually', is_vaccine_core: false },

  // Core vaccines for Cats - Kitten
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', vaccine_purpose: 'Core vaccine protecting against three major feline diseases', vaccine_description_dtls: 'Essential for all kittens. Protects against feline distemper and respiratory diseases.', vaccine_pet_age: '6-8 weeks', vaccine_frequency: '3-4 weeks intervals until 16 weeks', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law. Protects against rabies virus.', vaccine_pet_age: '12-16 weeks', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Feline Leukemia (FeLV)', vaccine_purpose: 'Non-core vaccine for viral infection protection', vaccine_description_dtls: 'Recommended for outdoor cats or those exposed to outdoor cats. Critical if FeLV status unknown.', vaccine_pet_age: '8-12 weeks', vaccine_frequency: '2-4 weeks after first dose, then annually for 1 year, then per risk', is_vaccine_core: false },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Feline Immunodeficiency Virus (FIV)', vaccine_purpose: 'Non-core vaccine for viral infection protection', vaccine_description_dtls: 'Recommended for outdoor cats or those in households with FIV+ cats. Blood test required before vaccination.', vaccine_pet_age: '12+ weeks', vaccine_frequency: '2-4 weeks after first dose, then annually', is_vaccine_core: false },

  // Core vaccines for Cats - Adult
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', vaccine_purpose: 'Core vaccine protecting against three major feline diseases', vaccine_description_dtls: 'Booster shots recommended every 1-3 years for indoor cats, annually for outdoor cats.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law. Booster shots required per local regulations.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Feline Leukemia (FeLV)', vaccine_purpose: 'Non-core vaccine for viral infection protection', vaccine_description_dtls: 'Annual booster for outdoor cats or cats in multi-cat households. Indoor cats may not need boosters if current on initial series.', vaccine_pet_age: 'Adult', vaccine_frequency: 'Annually (outdoor)', is_vaccine_core: false },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Feline Immunodeficiency Virus (FIV)', vaccine_purpose: 'Non-core vaccine for viral infection protection', vaccine_description_dtls: 'Annual booster for at-risk cats. Blood test required periodically.', vaccine_pet_age: 'Adult', vaccine_frequency: 'Annually', is_vaccine_core: false },

  // Core vaccines for Cats - Senior
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', vaccine_purpose: 'Core vaccine protecting against three major feline diseases', vaccine_description_dtls: 'Senior cats should maintain vaccination protection based on health status.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law even for senior cats. Booster shots required per local regulations.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Feline Leukemia (FeLV)', vaccine_purpose: 'Non-core vaccine for viral infection protection', vaccine_description_dtls: 'Discuss with vet based on health status and exposure risk.', vaccine_pet_age: 'Senior', vaccine_frequency: 'As recommended by vet', is_vaccine_core: false },
  { pet_type: 'Cat', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Feline Immunodeficiency Virus (FIV)', vaccine_purpose: 'Non-core vaccine for viral infection protection', vaccine_description_dtls: 'Discuss with vet based on health status and exposure risk.', vaccine_pet_age: 'Senior', vaccine_frequency: 'As recommended by vet', is_vaccine_core: false },

  // Core vaccines for Other pets - Puppy
  { pet_type: 'Other', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Puppy', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law for most exotic pets. Check local regulations.', vaccine_pet_age: '12-16 weeks', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },

  // Core vaccines for Other pets - Adult
  { pet_type: 'Other', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Adult', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law for most exotic pets. Booster shots required per local regulations.', vaccine_pet_age: '1 year', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true },

  // Core vaccines for Other pets - Senior
  { pet_type: 'Other', pet_breed_group: null, pet_breed: null, pet_age_grp: 'Senior', vaccine_name: 'Rabies', vaccine_purpose: 'Core vaccine required by law in most regions', vaccine_description_dtls: 'Required by law even for senior exotic pets. Booster shots required per local regulations.', vaccine_pet_age: '7+ years', vaccine_frequency: 'Every 1-3 years', is_vaccine_core: true }
];

async function seed() {
  try {
    console.log('🚀 Starting vaccine seed...');
    
    // Check if vaccines already exist
    const existingCount = await prisma.pIQ_Vaccine_Master.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing vaccines. Skipping seed to avoid duplicates.`);
      console.log('✅ Vaccines already in database! Your vaccination feature is ready to use.');
      return;
    }

    // Insert all vaccines
    const result = await prisma.pIQ_Vaccine_Master.createMany({
      data: vaccineData,
      skipDuplicates: true,
    });

    console.log(`✅ Successfully seeded ${result.count} vaccines!`);
    
    // If no new vaccines were added, check if we need to add Cat and Other vaccines
    if (result.count === 0) {
      const catCount = await prisma.pIQ_Vaccine_Master.count({ where: { pet_type: 'Cat' } });
      const otherCount = await prisma.pIQ_Vaccine_Master.count({ where: { pet_type: 'Other' } });
      
      if (catCount === 0 || otherCount === 0) {
        console.log('⚠️  Cat and/or Other pet vaccines are missing, but vaccines were skipped due to existing data.');
        console.log('Please contact support to add missing pet type vaccines.');
      }
    }
    
    console.log('🎉 Your vaccination feature is now ready to use!');
  } catch (error) {
    console.error('❌ Error seeding vaccines:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
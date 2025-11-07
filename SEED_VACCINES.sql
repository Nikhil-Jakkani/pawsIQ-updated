-- Seed vaccine master data for Dogs, Cats, and Other pets
-- This populates the PIQ_Vaccine_Master table with core and non-core vaccines

-- Core vaccines for Dogs - Puppy
INSERT INTO "PIQ_Vaccine_Master" (pet_type, pet_breed_group, pet_breed, pet_age_grp, vaccine_name, vaccine_purpose, vaccine_description_dtls, vaccine_pet_age, vaccine_frequency, is_vaccine_core, is_record_valid, created_at)
VALUES 
('Dog', NULL, NULL, 'Puppy', 'DHPP (Distemper/Parvovirus)', 'Core vaccine protecting against distemper, hepatitis, parvovirus, and parainfluenza', 'Essential for all puppies. Protects against deadly viral diseases.', '6-8 weeks', '6 weeks, then 3-4 weeks intervals', true, true, now()),
('Dog', NULL, NULL, 'Puppy', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law. Protects against rabies virus.', '12-16 weeks', 'Every 1-3 years', true, true, now()),
('Dog', NULL, NULL, 'Puppy', 'Bordetella (Kennel Cough)', 'Non-core vaccine for respiratory protection', 'Recommended if puppy will be boarded or attend dog parks. Intranasal or injection form available.', '3-4 weeks', 'Annually or every 6 months', false, true, now()),
('Dog', NULL, NULL, 'Puppy', 'Leptospirosis', 'Non-core vaccine for bacterial infection protection', 'Recommended in areas with high exposure risk. Protects against bacterial disease spread by wildlife urine.', '8-12 weeks', '2-4 weeks after first dose, then annually', false, true, now()),
('Dog', NULL, NULL, 'Puppy', 'Lyme Disease', 'Non-core vaccine for tick-borne disease protection', 'Recommended in tick-endemic areas. Protects against Lyme disease bacteria.', '12 weeks', '2-4 weeks after first dose, then annually', false, true, now()),

-- Core vaccines for Dogs - Adult
('Dog', NULL, NULL, 'Adult', 'DHPP (Distemper/Parvovirus)', 'Core vaccine protecting against distemper, hepatitis, parvovirus, and parainfluenza', 'Essential for all adult dogs. Booster shots recommended every 3 years.', '1 year', 'Every 1-3 years', true, true, now()),
('Dog', NULL, NULL, 'Adult', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law. Booster shots required per local regulations.', '1 year', 'Every 1-3 years', true, true, now()),
('Dog', NULL, NULL, 'Adult', 'Bordetella (Kennel Cough)', 'Non-core vaccine for respiratory protection', 'Recommended for dogs with exposure risk. Annual booster recommended.', 'Adult', 'Annually', false, true, now()),
('Dog', NULL, NULL, 'Adult', 'Leptospirosis', 'Non-core vaccine for bacterial infection protection', 'Recommended annually in high-risk areas.', 'Adult', 'Annually', false, true, now()),
('Dog', NULL, NULL, 'Adult', 'Lyme Disease', 'Non-core vaccine for tick-borne disease protection', 'Recommended annually in endemic areas.', 'Adult', 'Annually', false, true, now()),

-- Core vaccines for Dogs - Senior
('Dog', NULL, NULL, 'Senior', 'DHPP (Distemper/Parvovirus)', 'Core vaccine protecting against distemper, hepatitis, parvovirus, and parainfluenza', 'Senior dogs should maintain vaccination protection. Booster every 3 years.', '7+ years', 'Every 1-3 years', true, true, now()),
('Dog', NULL, NULL, 'Senior', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law even for senior dogs. Booster shots required per local regulations.', '7+ years', 'Every 1-3 years', true, true, now()),
('Dog', NULL, NULL, 'Senior', 'Bordetella (Kennel Cough)', 'Non-core vaccine for respiratory protection', 'Optional for senior dogs based on lifestyle and health status.', 'Senior', 'Annually', false, true, now()),
('Dog', NULL, NULL, 'Senior', 'Leptospirosis', 'Non-core vaccine for bacterial infection protection', 'Discuss with vet based on health status and exposure risk.', 'Senior', 'Annually', false, true, now()),
('Dog', NULL, NULL, 'Senior', 'Lyme Disease', 'Non-core vaccine for tick-borne disease protection', 'Consider based on exposure risk and overall health.', 'Senior', 'Annually', false, true, now()),

-- Core vaccines for Cats - Kitten
('Cat', NULL, NULL, 'Puppy', 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', 'Core vaccine protecting against three major feline diseases', 'Essential for all kittens. Protects against feline distemper and respiratory diseases.', '6-8 weeks', '3-4 weeks intervals until 16 weeks', true, true, now()),
('Cat', NULL, NULL, 'Puppy', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law. Protects against rabies virus.', '12-16 weeks', 'Every 1-3 years', true, true, now()),
('Cat', NULL, NULL, 'Puppy', 'Feline Leukemia (FeLV)', 'Non-core vaccine for viral infection protection', 'Recommended for outdoor cats or those exposed to outdoor cats. Critical if FeLV status unknown.', '8-12 weeks', '2-4 weeks after first dose, then annually for 1 year, then per risk', false, true, now()),
('Cat', NULL, NULL, 'Puppy', 'Feline Immunodeficiency Virus (FIV)', 'Non-core vaccine for viral infection protection', 'Recommended for outdoor cats or those in households with FIV+ cats. Blood test required before vaccination.', '12+ weeks', '2-4 weeks after first dose, then annually', false, true, now()),

-- Core vaccines for Cats - Adult
('Cat', NULL, NULL, 'Adult', 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', 'Core vaccine protecting against three major feline diseases', 'Booster shots recommended every 1-3 years for indoor cats, annually for outdoor cats.', '1 year', 'Every 1-3 years', true, true, now()),
('Cat', NULL, NULL, 'Adult', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law. Booster shots required per local regulations.', '1 year', 'Every 1-3 years', true, true, now()),
('Cat', NULL, NULL, 'Adult', 'Feline Leukemia (FeLV)', 'Non-core vaccine for viral infection protection', 'Annual booster for outdoor cats or cats in multi-cat households. Indoor cats may not need boosters if current on initial series.', 'Adult', 'Annually (outdoor)', false, true, now()),
('Cat', NULL, NULL, 'Adult', 'Feline Immunodeficiency Virus (FIV)', 'Non-core vaccine for viral infection protection', 'Annual booster for at-risk cats. Blood test required periodically.', 'Adult', 'Annually', false, true, now()),

-- Core vaccines for Cats - Senior
('Cat', NULL, NULL, 'Senior', 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', 'Core vaccine protecting against three major feline diseases', 'Senior cats should maintain vaccination protection based on health status.', '7+ years', 'Every 1-3 years', true, true, now()),
('Cat', NULL, NULL, 'Senior', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law even for senior cats. Booster shots required per local regulations.', '7+ years', 'Every 1-3 years', true, true, now()),
('Cat', NULL, NULL, 'Senior', 'Feline Leukemia (FeLV)', 'Non-core vaccine for viral infection protection', 'Discuss with vet based on health status and exposure risk.', 'Senior', 'As recommended by vet', false, true, now()),
('Cat', NULL, NULL, 'Senior', 'Feline Immunodeficiency Virus (FIV)', 'Non-core vaccine for viral infection protection', 'Discuss with vet based on health status and exposure risk.', 'Senior', 'As recommended by vet', false, true, now()),

-- Core vaccines for Other pets - Puppy
('Other', NULL, NULL, 'Puppy', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law for most exotic pets. Check local regulations.', '12-16 weeks', 'Every 1-3 years', true, true, now()),

-- Core vaccines for Other pets - Adult
('Other', NULL, NULL, 'Adult', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law for most exotic pets. Booster shots required per local regulations.', '1 year', 'Every 1-3 years', true, true, now()),

-- Core vaccines for Other pets - Senior
('Other', NULL, NULL, 'Senior', 'Rabies', 'Core vaccine required by law in most regions', 'Required by law even for senior exotic pets. Booster shots required per local regulations.', '7+ years', 'Every 1-3 years', true, true, now());
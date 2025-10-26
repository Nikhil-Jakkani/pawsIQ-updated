import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

interface ProviderData {
  serv_provider_name: string;
  serv_provider_email: string;
  serv_provider_password: string;
  serv_provider_contact_nbr: string;
  serv_provider_type: string;
  serv_provider_status: string;
  serv_provider_desc?: string;
}

const providers: ProviderData[] = [
  {
    serv_provider_name: 'Dr. Veterinarian',
    serv_provider_email: 'vet@pawsiq.com',
    serv_provider_password: 'provider123',
    serv_provider_contact_nbr: '+1-555-0101',
    serv_provider_type: 'Veterinarian',
    serv_provider_status: 'active',
    serv_provider_desc: 'Experienced veterinarian with 10+ years of practice',
  },
  {
    serv_provider_name: 'Pet Trainer Pro',
    serv_provider_email: 'trainer@pawsiq.com',
    serv_provider_password: 'provider123',
    serv_provider_contact_nbr: '+1-555-0102',
    serv_provider_type: 'Trainer',
    serv_provider_status: 'active',
    serv_provider_desc: 'Professional pet trainer specializing in obedience',
  },
  {
    serv_provider_name: 'Groom Master',
    serv_provider_email: 'groomer@pawsiq.com',
    serv_provider_password: 'provider123',
    serv_provider_contact_nbr: '+1-555-0103',
    serv_provider_type: 'Groomer',
    serv_provider_status: 'active',
    serv_provider_desc: 'Expert grooming and styling services',
  },
];

async function seedProviders() {
  try {
    console.log('Starting provider seeding...');

    for (const provider of providers) {
      // Check if provider already exists
      const { data: existingProvider } = await db
        .from('PIQ_Service_Provider')
        .select('service_provider_id')
        .ilike('serv_provider_email', provider.serv_provider_email)
        .single();

      if (existingProvider) {
        console.log(`Provider ${provider.serv_provider_email} already exists. Skipping...`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(provider.serv_provider_password, 10);

      // Insert provider
      const { data, error } = await db
        .from('PIQ_Service_Provider')
        .insert([
          {
            serv_provider_name: provider.serv_provider_name,
            serv_provider_email: provider.serv_provider_email,
            serv_provider_password: hashedPassword,
            serv_provider_contact_nbr: provider.serv_provider_contact_nbr,
            serv_provider_type: provider.serv_provider_type,
            serv_provider_status: provider.serv_provider_status,
            serv_provider_desc: provider.serv_provider_desc,
            last_updated_dtm: new Date(),
          },
        ])
        .select();

      if (error) {
        console.error(`Error inserting ${provider.serv_provider_email}:`, error);
      } else {
        console.log(`✓ Successfully seeded ${provider.serv_provider_email}`);
      }
    }

    console.log('Provider seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedProviders();
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function checkAdmins() {
  console.log('🔍 Checking PIQ_Admins table...\n');
  
  const { data: admins, error } = await db
    .from('PIQ_Admins')
    .select('admin_id, email, created_at');
  
  if (error) {
    console.error('❌ Error querying admins:', error.message);
    return;
  }
  
  if (!admins || admins.length === 0) {
    console.log('⚠️  No admins found in PIQ_Admins table!');
    console.log('\n📝 You need to create an admin account in the database.');
    return;
  }
  
  console.log(`✅ Found ${admins.length} admin(s):\n`);
  admins.forEach(admin => {
    console.log(`   Admin ID: ${admin.admin_id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Created: ${admin.created_at}`);
    console.log('   ---');
  });
}

checkAdmins().then(() => process.exit(0));

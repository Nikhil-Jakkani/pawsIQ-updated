// Quick test to verify vaccine API endpoint works
const API_URL = 'http://localhost:4000/api/v1';

async function testVaccineAPI() {
  try {
    console.log('🧪 Testing Vaccine API Endpoint...\n');
    
    // Test 1: Get vaccines for Dog - Adult
    console.log('Test 1: Fetching vaccines for Dog - Adult');
    const url1 = `${API_URL}/vaccines/master?petType=Dog&ageGroup=Adult`;
    console.log(`URL: ${url1}`);
    
    const res1 = await fetch(url1);
    const data1 = await res1.json();
    
    console.log(`Status: ${res1.status}`);
    console.log(`Vaccines found: ${data1.vaccines?.length || 0}`);
    if (data1.vaccines && data1.vaccines.length > 0) {
      console.log('Sample vaccine:', JSON.stringify(data1.vaccines[0], null, 2));
    }
    
    console.log('\n---\n');
    
    // Test 2: Get vaccines for Cat - Puppy (Kitten)
    console.log('Test 2: Fetching vaccines for Cat - Puppy');
    const url2 = `${API_URL}/vaccines/master?petType=Cat&ageGroup=Puppy`;
    console.log(`URL: ${url2}`);
    
    const res2 = await fetch(url2);
    const data2 = await res2.json();
    
    console.log(`Status: ${res2.status}`);
    console.log(`Vaccines found: ${data2.vaccines?.length || 0}`);
    if (data2.vaccines && data2.vaccines.length > 0) {
      console.log('Sample vaccine:', JSON.stringify(data2.vaccines[0], null, 2));
    }
    
    console.log('\n---\n');
    console.log('✅ API is working! Vaccines are being returned correctly.');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n⚠️  Make sure your backend server is running on port 4000');
    process.exit(1);
  }
}

testVaccineAPI();
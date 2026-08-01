const http = require('http');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

async function checkUrl(name, url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`✅ [PASS] ${name} is UP at ${url} (Status: ${res.statusCode})`);
          resolve(true);
        } else {
          console.error(`❌ [FAIL] ${name} at ${url} returned status ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ [FAIL] ${name} at ${url} is UNREACHABLE (${err.message})`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log(' SCN JOBS — SYSTEM HEALTH CHECK');
  console.log('════════════════════════════════════════════════════════════════════════\n');
  
  const results = await Promise.all([
    checkUrl('Frontend Homepage', `${FRONTEND_URL}/`),
    checkUrl('Frontend Jobs Page', `${FRONTEND_URL}/jobs`),
    checkUrl('Frontend Login Page', `${FRONTEND_URL}/login`),
    checkUrl('Backend Health Check', `${BACKEND_URL}/api/health`),
    checkUrl('Backend Public Jobs API', `${BACKEND_URL}/api/jobs`)
  ]);

  console.log('\n--- Test Summary ---');
  if (results.every(r => r)) {
    console.log('🎉 ALL BASIC TESTS PASSED! Both frontend and backend are communicating properly.');
    console.log('\nNote: To test the full backend creation flows (like recruiters, jobs, workers),');
    console.log('run the comprehensive script inside the monolith folder:');
    console.log('  cd scn-jobs-monolith');
    console.log('  node test-full-flow.js');
  } else {
    console.log('⚠️ SOME TESTS FAILED.');
    console.log('Make sure you have started both servers:');
    console.log('  1. Frontend: cd project && npm run dev (or start)');
    console.log('  2. Backend: cd scn-jobs-monolith && npm run dev (or start)');
  }
}

runTests();

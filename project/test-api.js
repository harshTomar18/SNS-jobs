const https = require('https');

function apiPost(url, data) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(data);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(payload);
    req.end();
  });
}

function apiGet(url, token) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    https.get(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  const loginRes = await apiPost('https://portal-z00v.onrender.com/api/auth/login', {
    email: 'admin@scnjobs.com',
    password: 'Jatin@scn5320'
  });
  console.log('Login Status:', loginRes.status);
  const token = loginRes.body?.data?.token;
  if (!token) {
    console.error('Could not get token:', loginRes.body);
    return;
  }
  console.log('Token acquired successfully.');

  // Test locations endpoint
  const locationsRes = await apiGet('https://portal-z00v.onrender.com/api/master/locations', token);
  console.log('Locations count:', locationsRes.body?.data?.length);
  if (locationsRes.body?.data?.length > 0) {
    console.log('Sample location item:', JSON.stringify(locationsRes.body.data[0], null, 2));
  }

  // Test states endpoint
  const statesRes = await apiGet('https://portal-z00v.onrender.com/api/master/locations/states', token);
  console.log('States status:', statesRes.status);
  console.log('States response:', JSON.stringify(statesRes.body, null, 2));
}

run();

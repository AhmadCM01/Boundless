import WebSocket from 'ws';
import http from 'node:http';

console.log('🧪 Testing Boundless Production Server on http://localhost:3000...');

// Test 1: HTTP GET /
const testHttp = () => {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/', (res) => {
      console.log(`✅ HTTP GET / Status: ${res.statusCode}`);
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (body.includes('<title>Boundless') || body.includes('root')) {
          console.log('✅ HTML SPA index served correctly!');
          resolve(true);
        } else {
          reject(new Error('HTML output mismatch'));
        }
      });
    }).on('error', reject);
  });
};

// Test 2: WebSocket upgrade to /yjs?room=live-test-room
const testWebSocket = () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/yjs?room=live-test-room');
    ws.on('open', () => {
      console.log('✅ WebSocket connection upgraded and opened successfully on /yjs?room=live-test-room!');
      ws.close();
      resolve(true);
    });
    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err);
      reject(err);
    });
  });
};

// Test 3: Asset Upload and Retrieval via HTTP API
const testAssetsApi = async () => {
  const boundary = '--------------------------' + Date.now().toString(16);
  const content = 'Test audio data buffer for Boundless';
  
  const postData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test_audio.webm"',
    'Content-Type: audio/webm',
    '',
    content,
    `--${boundary}--`,
    ''
  ].join('\r\n');

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/assets',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        console.log('✅ Asset upload POST response:', json);
        if (json.assetId && json.url) {
          // Verify Retrieval GET
          http.get(`http://localhost:3000${json.url}`, (getRes) => {
            console.log(`✅ Asset GET Status: ${getRes.statusCode}, Content-Type: ${getRes.headers['content-type']}`);
            resolve(true);
          }).on('error', reject);
        } else {
          reject(new Error('Asset upload failed'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

try {
  await testHttp();
  await testWebSocket();
  await testAssetsApi();
  console.log('🎉 ALL SERVER PRODUCTION CHECKS PASSED 100%!');
  process.exit(0);
} catch (err) {
  console.error('❌ Test failed:', err);
  process.exit(1);
}

const API_KEY = '24c2579bc417433796ec7043de22fa7b.doaVgFuwK69cvmLO';

async function testZaiApi() {
  const endpoints = [
    'https://api.z.ai/api/paas/v4/chat/completions',
    'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  ];

  for (const url of endpoints) {
    console.log(`--- Testing Z.AI endpoint: ${url} ---`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'glm-4.5-flash',
          messages: [
            { role: 'user', content: 'Say hello in 3 words' }
          ]
        })
      });

      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text.substring(0, 300));
    } catch (err) {
      console.error('Error:', err);
    }
  }
}

testZaiApi();

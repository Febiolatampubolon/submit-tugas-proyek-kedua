// Test Story API endpoints
async function testStoryAPI() {
  const baseURL = 'https://story-api.dicoding.dev/v1';
  
  console.log('=== Testing Story API ===');
  
  // Test 1: Register new user
  console.log('\n1. Testing Registration...');
  try {
    const registerData = {
      name: 'Test User ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'testpass123'
    };
    
    console.log('Sending registration data:', registerData);
    
    const registerResponse = await fetch(`${baseURL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerResponse.json();
    console.log('Registration response status:', registerResponse.status);
    console.log('Registration response:', registerResult);
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful');
      
      // Test 2: Login with the created user
      console.log('\n2. Testing Login...');
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };
      
      console.log('Sending login data:', loginData);
      
      const loginResponse = await fetch(`${baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      const loginResult = await loginResponse.json();
      console.log('Login response status:', loginResponse.status);
      console.log('Login response:', loginResult);
      
      if (loginResponse.ok && loginResult.loginResult?.token) {
        console.log('✅ Login successful');
        const token = loginResult.loginResult.token;
        
        // Test 3: Get stories with authentication
        console.log('\n3. Testing Get Stories...');
        const storiesResponse = await fetch(`${baseURL}/stories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const storiesResult = await storiesResponse.json();
        console.log('Stories response status:', storiesResponse.status);
        console.log('Stories count:', storiesResult.listStory?.length || 0);
        
        if (storiesResponse.ok) {
          console.log('✅ Get stories successful');
        } else {
          console.log('❌ Get stories failed:', storiesResult);
        }
      } else {
        console.log('❌ Login failed:', loginResult);
      }
    } else {
      console.log('❌ Registration failed:', registerResult);
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error);
  }
}

// Test public stories (no auth required)
async function testPublicStories() {
  console.log('\n=== Testing Public Stories ===');
  try {
    const response = await fetch('https://story-api.dicoding.dev/v1/stories');
    const result = await response.json();
    
    console.log('Public stories response status:', response.status);
    console.log('Public stories count:', result.listStory?.length || 0);
    
    if (response.ok) {
      console.log('✅ Public stories accessible');
      if (result.listStory && result.listStory.length > 0) {
        console.log('Sample story:', {
          id: result.listStory[0].id,
          name: result.listStory[0].name,
          description: result.listStory[0].description?.substring(0, 100) + '...',
          hasLocation: !!(result.listStory[0].lat && result.listStory[0].lon)
        });
      }
    } else {
      console.log('❌ Public stories failed:', result);
    }
  } catch (error) {
    console.error('❌ Public stories test failed:', error);
  }
}

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  window.testStoryAPI = testStoryAPI;
  window.testPublicStories = testPublicStories;
  
  console.log('API Test functions loaded. Run in console:');
  console.log('- testStoryAPI()');
  console.log('- testPublicStories()');
} else {
  // Node environment
  testPublicStories().then(() => testStoryAPI());
}

export { testStoryAPI, testPublicStories };
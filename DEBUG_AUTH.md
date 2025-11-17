# Debug Authentication

## Quick Test Account Creation
Untuk testing cepat, buat akun dengan data ini:

### Test Account 1
- Name: Test User
- Email: testuser@example.com  
- Password: testpass123

### Test Account 2
- Name: Demo User
- Email: demo@storyCatalog.app
- Password: democatalog2024

## Testing Steps
1. Register new account at: http://localhost:5173/#/register
2. Login at: http://localhost:5173/#/login
3. Test features at: http://localhost:5173/#/stories

## API Endpoints Used
- POST /register - Create new account
- POST /login - Authenticate user
- GET /stories - Get stories (requires auth)
- POST /stories - Add new story (requires auth)

## Token Storage
- Token disimpan di localStorage dengan key 'token'
- Check token: `localStorage.getItem('token')`
- Clear token: `localStorage.removeItem('token')`

## Common Issues
1. **"Login gagal"** - Periksa email/password
2. **"Token expired"** - Login ulang
3. **"Network error"** - Periksa koneksi internet
4. **"Validation error"** - Periksa format input

## Browser Console Commands
```javascript
// Check if logged in
console.log(!!localStorage.getItem('token'));

// Logout manually
localStorage.removeItem('token');
window.location.reload();

// Check API response
fetch('https://story-api.dicoding.dev/v1/stories', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log);
```
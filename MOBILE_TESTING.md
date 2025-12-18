# Mobile Testing Instructions

## Network Configuration

The application is now configured to accept connections from devices on the same WiFi network.

### Network Details
- **Mac IP:** 10.0.0.180
- **Frontend URL:** http://10.0.0.180:5173
- **Backend URL:** http://10.0.0.180:3000
- **WiFi Network:** Same network as Mac

---

## Changes Made

### 1. Backend CORS Configuration
**File:** `apps/backend/src/main.ts`

Added network IP to CORS allowed origins:
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://10.0.0.180:5173', // Network access for mobile devices
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 2. Frontend API URL Auto-Detection
**File:** `apps/frontend/src/shared/config/env.ts`

Modified to auto-detect the API URL based on current host:
```typescript
const getApiUrl = (): string => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Otherwise, use the same host as the frontend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = 3000; // Backend port

  return `${protocol}//${hostname}:${port}/api`;
};
```

**How it works:**
- When accessing from `localhost:5173` → API URL: `http://localhost:3000/api`
- When accessing from `10.0.0.180:5173` → API URL: `http://10.0.0.180:3000/api`

### 3. WebSocket Configuration
**File:** `apps/frontend/src/shared/api/websocket.ts`

WebSocket automatically uses the same host as the API:
```typescript
const wsUrl = env.apiUrl.replace(/^http/, "ws");
socket = io(`${wsUrl}/events`, {
  auth: {
    businessId: user.id,
  },
  transports: ["websocket"],
});
```

---

## Testing from Mobile Device

### Prerequisites
1. ✅ Mac and mobile device on same WiFi network
2. ✅ Backend running: `pnpm dev:backend`
3. ✅ Frontend running: `pnpm dev:frontend` (with `--host` flag)
4. ✅ Mac firewall allows incoming connections on ports 3000 and 5173

### Step 1: Verify Servers are Running

On Mac terminal, you should see:
```
apps/frontend dev:   ➜  Local:   http://localhost:5173/
apps/frontend dev:   ➜  Network: http://10.0.0.180:5173/
apps/backend dev: Application is running on: http://127.0.0.1:3000
```

### Step 2: Check Mac Firewall Settings

1. Open **System Settings** → **Network** → **Firewall**
2. Ensure firewall allows incoming connections for:
   - Node.js
   - Terminal
   - Or disable firewall temporarily for testing

### Step 3: Test Backend from Mobile Browser

Open mobile browser and navigate to:
```
http://10.0.0.180:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### Step 4: Test Frontend from Mobile Browser

Open mobile browser and navigate to:
```
http://10.0.0.180:5173/login
```

**Expected:**
- Login page loads correctly
- Can enter credentials
- Can click "Iniciar Sesión" button

### Step 5: Login and Test Dashboard

**Credentials:**
- Email: `test@example.com`
- Password: `Test123!`

**Expected after login:**
- Redirects to dashboard at `http://10.0.0.180:5173/`
- Shows real stats: "1" cita hoy, "4" citas esta semana
- Shows upcoming appointments
- No CORS errors in browser console

---

## Troubleshooting

### Issue: "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Possible causes:**
1. Backend not running
2. Mac firewall blocking connections
3. Wrong IP address

**Solutions:**
1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check Mac firewall settings
3. Verify Mac IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Possible causes:**
1. Backend not restarted after CORS changes
2. Wrong origin in CORS configuration

**Solutions:**
1. Restart backend: Stop and run `pnpm dev:backend` again
2. Verify CORS includes your network IP in `apps/backend/src/main.ts`

### Issue: "Cannot connect to WebSocket"

**Possible causes:**
1. WebSocket port blocked by firewall
2. Backend WebSocket not configured for network access

**Solutions:**
1. Check firewall allows port 3000
2. Verify backend logs show WebSocket initialization

### Issue: "Login button doesn't work on mobile"

**Possible causes:**
1. Frontend trying to connect to wrong API URL
2. CORS blocking the request
3. Network connectivity issue

**Solutions:**
1. Open browser console on mobile (use remote debugging)
2. Check Network tab for failed requests
3. Verify API URL in console: `console.log(env.apiUrl)`

---

## Verification Checklist

Before testing from mobile:

- [ ] Backend running and showing: `Application is running on: http://127.0.0.1:3000`
- [ ] Frontend running and showing: `Network: http://10.0.0.180:5173/`
- [ ] Mac firewall allows Node.js connections
- [ ] Mobile device connected to same WiFi network
- [ ] Can access `http://10.0.0.180:3000/api/health` from mobile browser
- [ ] Can access `http://10.0.0.180:5173/login` from mobile browser
- [ ] No CORS errors in browser console
- [ ] Login works and redirects to dashboard
- [ ] Dashboard shows real data

---

## Network Debugging Commands

### On Mac

```bash
# Get Mac IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Check if backend is listening on all interfaces
lsof -i :3000

# Check if frontend is listening on all interfaces
lsof -i :5173

# Test backend from Mac
curl http://localhost:3000/api/health
curl http://10.0.0.180:3000/api/health

# Test frontend from Mac
curl http://localhost:5173
curl http://10.0.0.180:5173
```

### On Mobile (using browser console)

```javascript
// Check API URL
console.log(window.location.hostname);

// Test API connection
fetch('http://10.0.0.180:3000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## Expected Behavior

### From Localhost (Mac browser)
- Frontend: `http://localhost:5173`
- API calls to: `http://localhost:3000/api`
- WebSocket connects to: `ws://localhost:3000/api/events`

### From Network IP (Mobile browser)
- Frontend: `http://10.0.0.180:5173`
- API calls to: `http://10.0.0.180:3000/api`
- WebSocket connects to: `ws://10.0.0.180:3000/api/events`

---

## Security Notes

⚠️ **Development Only**

This configuration is for development and testing only. For production:

1. Use proper domain names (not IP addresses)
2. Enable HTTPS/WSS
3. Restrict CORS to specific domains
4. Use environment variables for configuration
5. Enable firewall with specific port rules
6. Consider using a reverse proxy (nginx)

---

## Additional Resources

- [Vite Network Access](https://vitejs.dev/config/server-options.html#server-host)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
- [Socket.IO CORS](https://socket.io/docs/v4/handling-cors/)
- [Mac Firewall Settings](https://support.apple.com/guide/mac-help/block-connections-to-your-mac-with-a-firewall-mh34041/)

---

**Last Updated:** December 18, 2024  
**Branch:** `feature/endpoint-appointments-upcoming-frontend-backend`

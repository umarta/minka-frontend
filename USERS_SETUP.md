# WhatsApp Admin CS - Default Users Setup

This document explains how to set up default users for the WhatsApp Admin Customer Service system.

## 🚀 Quick Setup

### Prerequisites
- Backend server running on `http://localhost:8080`
- Frontend server running on `http://localhost:3002`
- `curl` and `jq` installed (for the setup script)

### Automatic Setup (Recommended)

Run the automated setup script:

```bash
cd frontend
./setup-users.sh
```

This script will:
- ✅ Check if the backend is running
- ✅ Create default admin and agent users
- ✅ Test login functionality for both users
- ✅ Display a summary of created users

### Manual Setup

If you prefer to create users manually, use these API calls:

#### Create Admin User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin",
    "full_name": "System Administrator"
  }'
```

#### Create Agent User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "agent",
    "password": "agent123",
    "role": "admin",
    "full_name": "Customer Service Agent"
  }'
```

## 👥 Default Users

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `admin123` | Administrator | System administrator with full access |
| `agent` | `agent123` | Agent | Customer service agent |

> **Note**: In the current demo version, both users have admin-level access in the backend, but they are conceptually different roles.

## 🔐 Testing Login

### Via Frontend
1. Open `http://localhost:3002`
2. You'll be redirected to the login page
3. Use any of the credentials above
4. You should be redirected to the dashboard upon successful login

### Via API
Test admin login:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Test agent login:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "agent", "password": "agent123"}'
```

Both should return a JWT token and user information.

## 🛠️ Troubleshooting

### Backend Not Running
If you get connection errors:
```bash
# Check if backend is running
lsof -i :8080

# If not running, start the backend from the backend directory
cd ../backend
go run main.go
```

### Users Already Exist
If you get "Internal server error" when creating users, they likely already exist. You can still test login functionality.

### Invalid Credentials
If login fails with "Invalid credentials":
1. Ensure you're using the exact usernames and passwords listed above
2. Check if the users were created successfully
3. Verify the backend is responding to API calls

### Port Conflicts
If you're running on different ports:
1. Update the `API_URL` in `setup-users.sh`
2. Update the frontend URL in your browser
3. Ensure the backend API base URL is correct in the frontend configuration

## 🔄 Resetting Users

To reset or recreate users, you would typically need to:
1. Clear the database (method depends on your database setup)
2. Restart the backend
3. Run the setup script again

## 📝 Adding More Users

To add additional users, modify the `setup-users.sh` script or use the manual API calls with different usernames and credentials.

Example for creating a viewer user:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viewer",
    "password": "viewer123",
    "role": "admin",
    "full_name": "System Viewer"
  }'
```

## 🌐 URLs

- **Frontend**: `http://localhost:3002`
- **Backend API**: `http://localhost:8080/api`
- **Login Page**: `http://localhost:3002/login`
- **Dashboard**: `http://localhost:3002/dashboard` (requires login)

---

For more information about the WhatsApp Admin CS system, check the main README file. 
## Plan to Fix Login Error

**Problem**: Login fails with 404 Not Found because the frontend is requesting the wrong URL.

**Root Cause**: The `frontend/.env.local` file sets `NEXT_PUBLIC_API_URL=http://localhost:8989` (missing `/api/v1`), causing the login request to go to `http://localhost:8989/auth/login` instead of the correct `http://localhost:8989/api/v1/auth/login`.

**Solution**: Update `frontend/.env.local` to use the correct API base URL with `/api/v1` prefix.

**Steps**:
1. Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` from `http://localhost:8989` to `http://localhost:8989/api/v1`
2. Verify the backend server is running on port 8989
3. Test login functionality

**Files to modify**:
- `frontend/.env.local` - Update NEXT_PUBLIC_API_URL value
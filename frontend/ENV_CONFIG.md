# Configuration

This project uses environment variables for configuration.

## Environment Variables

Create a `.env` file in the frontend directory:

```bash
cd frontend
cp .env.example .env
```

## Available Variables

### `VITE_API_URL`
The URL of the backend API.

**Default:** `http://localhost:3001/api/trpc`

**Examples:**
```bash
# Development
VITE_API_URL=http://localhost:3001/api/trpc

# Production
VITE_API_URL=https://api.yourenglishhub.com/api/trpc

# Different port
VITE_API_URL=http://localhost:8080/api/trpc
```

## Important Notes

1. **Vite Environment Variables:** All environment variables must start with `VITE_` to be accessible in the frontend code.

2. **Changing Variables:** After modifying `.env`, you need to restart the development server:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   bun run dev
   ```

3. **Production:** Make sure to set the correct `VITE_API_URL` for your production environment.

## Backend Server

The backend should be running on port 3001 (or whatever you set in VITE_API_URL):

```bash
cd backend
bun run dev
```

Default backend URL: `http://localhost:3001`

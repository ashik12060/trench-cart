# Digitrench Shift Tracker

React + Vite frontend with a local Express API using MongoDB and Cloudinary.

## Stack
- Frontend: React, Vite (`/src`)
- Backend: Express, Mongoose (`/server/src`)
- Database: MongoDB
- Image storage: Cloudinary

## Local setup
1. Install frontend dependencies:
```bash
npm install
```
2. Install backend dependencies:
```bash
cd server
npm install
```
3. Configure frontend env (copy `.env.example` to `.env` before running `npm run dev`):
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_APP_NAME=MegaMart Commerce
```
4. Configure backend env:
```bash
cp server/.env.example server/.env
```
Set at least:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/trenchcart
JWT_SECRET=replace-with-strong-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
TRUST_PROXY=true
# DEFAULT_VISITOR_COUNTRY=BD
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
5. Start backend (port `4000`):
```bash
cd server
npm run dev
```
6. Start frontend (port `5173`):
```bash
npm run dev
```

## API endpoints
- `POST /api/auth/admin/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/admin/products` (admin auth required)
- `GET/POST/PUT/DELETE /api/admin/categories` (admin auth required)
- `GET/POST/PUT/DELETE /api/admin/orders` (admin auth required)
- `GET /api/products`
- `GET /api/categories`
- `GET /api/visitor-context`
- `POST /api/orders/checkout`
- `GET /api/orders/my?customer_email=...`
- `POST /api/uploads/image` (multipart form field: `file`)
- `GET /api/health`

## Notes
- Vite proxies `/api` to `http://localhost:4000`.
- Admin login page: `/admin/login`.
- Image upload requires valid Cloudinary env values.
- Products can be targeted to Bangladesh, United States, or both. The backend resolves visitor country from trusted proxy headers or local GeoIP before returning public products.

# Backend Deployment Checklist

## Required Environment Variables

- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment mode (production/development)
- `DATABASE_URL`: MySQL connection string

## Deployment Commands

```bash
npm install
npm run prisma:migrate
npm run seed
pm2 start src/index.js --name ogc-backend
pm2 save
```

## Important Notes

- Production `.env` file lives only on the VPS and must not be committed to version control
- Use `backend/.env.example` as a template for environment variable structure
- Update `DATABASE_URL` with the actual production credentials on the VPS


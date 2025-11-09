# Deployment Guide

## Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose (for local development)
- PostgreSQL database
- MinIO or S3-compatible storage
- Resend API key (for email notifications)

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required Variables

- `NODE_ENV`: Set to `production` for production deployments
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong secret key for JWT tokens (minimum 32 characters recommended)
- `ADMIN_PASSWORD`: Password for htpasswd authentication
- `RESEND_API_KEY`: Your Resend API key for email
- `FROM_EMAIL`: Email address for sending emails

### Optional Variables

- `BASE_URL`: Base URL of your application
- `BASE_URL_OTHER_PORT`: Alternative port URL if needed

### MinIO Configuration

- `MINIO_ROOT_USER`: MinIO admin username
- `MINIO_ROOT_PASSWORD`: MinIO admin password
- `MINIO_BUCKET_NAME`: Name of the bucket for file storage

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start Docker services (PostgreSQL, Redis, MinIO):
   ```bash
   cd docker
   docker compose up -d
   ```

3. Run database migrations:
   ```bash
   pnpm db:push
   ```

4. Start development server:
   ```bash
   pnpm dev
   ```

## Production Deployment

### Step 1: Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### Step 2: Configure Environment

Ensure all environment variables are properly set in `.env` or your hosting platform's environment configuration.

**Security Note:** Never commit `.env` files to version control. Use environment variable management provided by your hosting platform.

### Step 3: Run Database Migrations

```bash
pnpm db:migrate
```

### Step 4: Build Application

```bash
pnpm build
```

### Step 5: Start Production Server

```bash
pnpm start
```

## Known Issues & Fixes

### Issue 1: TypeScript Compilation Errors

The application currently has TypeScript errors that need to be resolved before production deployment. These include:

- Type mismatches in tRPC procedures
- Missing properties in component props
- Unsafe type assignments

**Status:** Under investigation and fixing

### Issue 2: ESLint Warnings

There are ~1457 ESLint warnings related to `@typescript-eslint/no-unsafe-*` rules. These are primarily related to type safety and should be addressed for production code quality.

**Recommendation:** Run `pnpm lint` before deploying to identify and fix critical issues.

## Docker Deployment

The application includes Docker configuration for containerized deployment:

1. Build the Docker image:
   ```bash
   docker build -f docker/Dockerfile -t bleu-app .
   ```

2. Use Docker Compose for full stack:
   ```bash
   cd docker
   docker compose up -d
   ```

## Database Schema

The application uses Prisma ORM with PostgreSQL. The schema includes:

- Company management with multi-workspace support
- Role-based access control
- Show and scene management
- Timer functionality for production tracking
- Messaging and announcements

## Security Considerations

1. **JWT Secret**: Use a strong, randomly generated secret (32+ characters)
2. **Database URL**: Never hardcode database credentials in schema.prisma
3. **Admin Password**: Use strong passwords for administrative access
4. **API Keys**: Store all API keys in environment variables
5. **HTTPS**: Always use HTTPS in production
6. **Database Backups**: Implement regular backup strategy

## Performance Optimization

- Enable database connection pooling
- Use Redis for session management (already configured in Docker)
- Consider CDN for static assets
- Implement proper caching strategies

## Monitoring

Consider implementing:
- Application performance monitoring (APM)
- Error tracking (e.g., Sentry)
- Log aggregation
- Database query monitoring

## Support

For issues or questions, please check:
- README.md for feature documentation
- GitHub Issues for known problems
- Docker Compose logs: `docker compose logs -f`

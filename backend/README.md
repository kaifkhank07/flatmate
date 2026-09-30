# Flatmate Marketplace Backend

Clean, minimal, and properly typed backend foundation for the Flatmate Marketplace Platform built with Node.js, Express, TypeScript, MongoDB, AWS S3, and Nodemailer.

## Tech Stack

* Node.js
* Express.js
* TypeScript
* MongoDB & Mongoose
* AWS S3 (@aws-sdk/client-s3)
* Nodemailer
* dotenv & cors
* tsx

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── aws.ts
│   │   ├── db.ts
│   │   ├── email.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── otp.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── session.controller.ts
│   │   └── user.controller.ts
│   ├── models/
│   │   ├── admin.model.ts
│   │   ├── adminSession.model.ts
│   │   ├── otp.model.ts
│   │   ├── user.model.ts
│   │   ├── userProfile.model.ts
│   │   └── userSession.model.ts
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── index.ts
│   │   ├── otp.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── session.routes.ts
│   │   └── user.routes.ts
│   ├── services/
│   │   ├── aws/
│   │   └── email/
│   ├── middlewares/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── .env
├── .env.example
├── package.json
└── README.md
```

## Environment Variables & Configuration

Copy `.env.example` to `.env` and fill in required values:

```env
# Application Mode (development | production | test)
NODE_MODE=development
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB (Single URI connection with dynamic database selection)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=

# AWS S3 Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_CLOUDFRONT_URL=

# Email / SMTP Service
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Twilio SMS Verification Service
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid

# JWT Authentication
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

### Environment-Based Database Selection

A single `MONGODB_URI` connection string is used across environments. Mongoose connects using dynamic database names selected by `NODE_MODE`:
* `development` → Database `flatmate_dev`
* `test` → Database `flatmate_test`
* `production` → Database `flatmate_production`

Alternatively, set `MONGODB_DB_NAME` in `.env` to override the database name.

## Installation

```bash
npm install
```

## Development

Run the development server with live reload:

```bash
npm run dev
```

## Seed Initial Super Admin

```bash
npm run seed:super-admin
```

## Type Checking

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

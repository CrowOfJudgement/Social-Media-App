# Social Media App Backend

A TypeScript + Express backend for a social media application. It includes authentication, user profiles, posts, comments, real-time one-to-one chat, GraphQL user queries, file uploads, Redis socket tracking, and Firebase push notifications.

## Features

- Email/password authentication with OTP email confirmation
- Google signup and login
- Forget/reset password and update password flows
- JWT authentication with Redis-backed token/socket utilities
- Role-based authorization for admin routes
- User profile management
- Post CRUD with visibility support
- Comment CRUD
- One-to-one chat REST APIs
- Real-time chat with Socket.IO
- MongoDB persistence using Mongoose models and repositories
- GraphQL endpoint for user data
- AWS S3 upload and file streaming support
- Firebase Cloud Messaging notification endpoint
- Security middleware with `helmet`, `cors`, and rate limiting
- Request validation with `zod`

## Tech Stack

- Node.js
- TypeScript
- Express
- MongoDB + Mongoose
- Socket.IO
- Redis
- GraphQL
- AWS S3
- Firebase Admin SDK
- Zod

## Project Structure

```text
src/
  app.controller.ts
  main.ts
  realtime/
    socket.gateway.ts
  common/
    middleware/
    service/
    utils/
  confing/
    config.service.ts
  DB/
    models/
    repositories/
    connectionDb.ts
  modules/
    auth/
    chat/
    comments/
    graphql/
    posts/
    user/
```

> Note: The folder name `confing` is currently used by imports in the project. Do not rename it unless you also update all imports.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create a `.env` file in the project root. The app also loads environment-specific files:

- `.env.development` when `NODE_ENV=development`
- `.env.production` when `NODE_ENV=production`

You can start from `.env.example`.

### 3. Environment variables

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/social-app

EMAIL=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Social Media App

GOOGLE_CLIENT_ID=your-google-client-id

REDIS_URL=redis://default:password@host:port
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_HOST=your-redis-host
REDIS_PORT=13066

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
ENCRYPTION_KEY=replace-with-a-long-random-encryption-key

AWS_REGION=your-aws-region
AWS_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 4. Firebase credentials

Firebase push notifications require a Firebase Admin service account JSON file.

Expected local paths:

```text
src/confing/social-media-app-1dbca-firebase-adminsdk-fbsvc-0462369b19.json
dist/confing/social-media-app-1dbca-firebase-adminsdk-fbsvc-0462369b19.json
```

Do not commit real Firebase credentials to GitHub.

### 5. Run the app

Development:

```bash
npm run start:dev
```

Production mode:

```bash
npm run start:prod
```

Default base URL:

```text
http://localhost:3000
```

## Available Scripts

- `npm run start:dev` compiles TypeScript in watch mode and runs the compiled app with `NODE_ENV=development`
- `npm run start:prod` compiles TypeScript in watch mode and runs the compiled app with `NODE_ENV=production`

## API Overview

Most protected routes require:

```http
Authorization: Bearer <access-token>
```

### Root

- `GET /` welcome message
- `GET /upload/*path` stream uploaded files from S3
- `POST /send-notification` send a Firebase push notification

### Auth

- `POST /auth/signup`
- `POST /auth/confirm-email`
- `POST /auth/signin`
- `POST /auth/resend-otp`
- `POST /auth/signup-google`
- `POST /auth/login-google`
- `POST /auth/forget-password`
- `POST /auth/reset-password`
- `PATCH /auth/update-password`
- `POST /auth/logout`
- `POST /auth/upload`

### Users

- `GET /users`
- `GET /users/profile`
- `PATCH /users/profile`
- `DELETE /users/profile`
- `GET /users/admin-only`
- `GET /users/:id`

### Posts

- `POST /posts`
- `GET /posts`
- `GET /posts/:id`
- `PATCH /posts/:id`
- `DELETE /posts/:id`

### Comments

- `POST /comments`
- `GET /comments/post/:postId`
- `GET /comments/:id`
- `PATCH /comments/:id`
- `DELETE /comments/:id`

### Chat REST

- `GET /chat` health/check endpoint for the chat module
- `GET /chat/:userId` get a one-to-one chat between the authenticated user and another user

## Real-Time Chat

Socket.IO is initialized on the same HTTP server as Express.

### Connection auth

Send the JWT token in Socket.IO auth:

```js
const socket = io('http://localhost:3000', {
  auth: {
    authorization: 'Bearer <access-token>',
  },
})
```

You can also send:

```js
auth: {
  token: '<access-token>',
}
```

### Events

#### `sendMessage`

Client emits:

```js
socket.emit('sendMessage', {
  sendTo: '<receiver-user-id>',
  content: 'Hello!',
})
```

Server behavior:

- Validates the authenticated sender
- Checks that the receiver exists
- Finds the existing one-to-one chat
- Creates the chat if it does not exist
- Pushes the new message into `messages`
- Emits `receiveMessage` to the receiver sockets and sender socket

#### `receiveMessage`

Server emits:

```js
socket.on('receiveMessage', payload => {
  console.log(payload)
})
```

#### `socketError`

Server emits validation/runtime socket errors:

```js
socket.on('socketError', error => {
  console.log(error.message)
})
```

## GraphQL

GraphQL endpoint:

```text
POST /graphql
```

Some GraphQL fields require the same Bearer token authorization header used by REST routes.

## Database Models

- `User`
- `Post`
- `Comment`
- `Chat`

The `Chat` model stores:

- `createdBy`
- `participants`
- `messages`
- `group`
- `groupImage`
- `roomId`

## GitHub Notes

Before pushing:

- Keep `.env` files out of GitHub
- Keep Firebase service account JSON files out of GitHub
- Commit `.env.example` only with fake placeholder values
- Run TypeScript validation before pushing:

```bash
npx tsc --noEmit
```

## Notes

- The project currently has no dedicated test script in `package.json`
- Redis is optional at startup if Redis environment variables are not configured, but socket tracking depends on Redis when connected

# CampusOps

Operations management platform for university student societies, built with React, Node.js/Express and MySQL.

## Features

- Login and authentication
- Event planning and calendar
- Task management with comments
- Budget tracking
- Notes and member management
- Dashboard summary

## Tech stack

- Frontend: React
- Backend: Node.js, Express
- Database: MySQL

## Setup

### 1. Database

Create a MySQL database (for example `campusops`) and import `database/schema.sql`.

### 2. Backend

```
cd campusops-backend
npm install
cp .env.example .env
```

Open `.env` and fill in your database details and a JWT secret. Then start the server:

```
npm start
```

### 3. Frontend

In a second terminal:

```
cd campusops-frontend
npm install
npm start
```

## Status

Work in progress. Automated tests and deployment are planned.
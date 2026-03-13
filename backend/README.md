# Learning Center Management System - Backend

A complete backend API for the Learning Center Management System built with Bun, Express, tRPC, and Drizzle ORM.

## Technology Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **API**: tRPC (type-safe RPC)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod

## Features

- ✅ Type-safe API with tRPC
- ✅ JWT authentication with role-based access control
- ✅ Complete CRUD operations for:
  - Students
  - Teachers
  - Courses & Levels
  - Classes & Sessions
  - Payments (Student & Teacher)
  - Expenses
- ✅ Financial reports and analytics
- ✅ Dashboard statistics
- ✅ PostgreSQL with dual ID system (SERIAL + UUID)
- ✅ Comprehensive Postman collection

## Project Structure

```
backend/
├── db/
│   ├── schema/
│   │   └── index.ts          # Drizzle ORM schema definitions
│   ├── migrations/           # Database migrations
│   ├── index.ts             # Database connection
│   └── seed.ts              # Database seeding script
├── routers/
│   ├── auth.ts              # Authentication routes
│   ├── students.ts          # Student management routes
│   ├── teachers.ts          # Teacher management routes
│   ├── courses.ts           # Course management routes
│   ├── classes.ts           # Class management routes
│   ├── payments.ts          # Payment management routes
│   └── reports.ts           # Report generation routes
├── services/
│   ├── auth.ts              # Authentication service
│   ├── students.ts          # Student service
│   ├── teachers.ts          # Teacher service
│   ├── courses.ts           # Course service
│   ├── classes.ts           # Class service
│   ├── payments.ts          # Payment service
│   └── reports.ts           # Report service
├── trpc/
│   ├── context.ts           # tRPC context & middleware
│   └── router.ts            # Main tRPC router
├── utils/
│   ├── auth.ts              # JWT & password utilities
│   └── logger.ts            # Winston logger
├── types/
│   └── index.ts             # TypeScript types
├── index.ts                 # Main server entry
├── drizzle.config.ts        # Drizzle configuration
└── .env.example             # Environment variables template
```

## Getting Started

### Prerequisites

- Bun installed (https://bun.sh)
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:
```bash
bun run db:push
```

4. Seed the database:
```bash
bun run db:seed
```

5. Start the development server:
```bash
bun run dev
```

The server will start on `http://localhost:3001`

### Default Login Credentials

After seeding, you can login with:

- **Admin**: username `admin`, password `admin123`
- **Assistant**: username `assistant`, password `assistant123`

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:seed` - Seed database with sample data
- `bun run lint` - Run TypeScript type checking
- `bun run build` - Build for production

## API Endpoints

All endpoints are prefixed with `/api/trpc`

### Authentication
- `auth.login` - Login user
- `auth.me` - Get current user
- `auth.changePassword` - Change password
- `auth.createUser` - Create new user (Admin only)

### Students
- `students.getAll` - Get all students (with pagination)
- `students.getById` - Get student by ID
- `students.create` - Create new student
- `students.update` - Update student
- `students.delete` - Delete student (Admin only)
- `students.enrollInCourse` - Enroll student in course
- `students.changeClass` - Change student class
- `students.advanceLevel` - Advance student to next level

### Teachers
- `teachers.getAll` - Get all teachers
- `teachers.getById` - Get teacher by ID
- `teachers.create` - Create new teacher
- `teachers.update` - Update teacher
- `teachers.delete` - Delete teacher (Admin only)
- `teachers.assignToClass` - Assign teacher to class

### Courses
- `courses.getAll` - Get all courses
- `courses.getById` - Get course by ID
- `courses.create` - Create new course (Admin only)
- `courses.update` - Update course (Admin only)
- `courses.delete` - Delete course (Admin only)
- `courses.addLevel` - Add level to course (Admin only)
- `courses.setPrerequisites` - Set level prerequisites (Admin only)

### Classes
- `classes.getAll` - Get all classes
- `classes.getById` - Get class by ID
- `classes.create` - Create new class
- `classes.update` - Update class
- `classes.delete` - Delete class (Admin only)
- `classes.enrollStudents` - Enroll students in class
- `classes.removeStudent` - Remove student from class
- `classes.createSession` - Create class session
- `classes.markSessionComplete` - Mark session as complete

### Payments
- `payments.getStudentPayments` - Get student payments
- `payments.recordStudentPayment` - Record student payment
- `payments.getPendingStudentPayments` - Get pending payments
- `payments.getTeacherPayments` - Get teacher payments (Admin only)
- `payments.recordTeacherPayment` - Record teacher payment (Admin only)
- `payments.getExpenses` - Get expenses (Admin only)
- `payments.recordExpense` - Record expense (Admin only)
- `payments.deleteExpense` - Delete expense (Admin only)

### Reports
- `reports.getDashboardStats` - Get dashboard statistics
- `reports.getFinancialReport` - Get financial report (Admin only)
- `reports.getStudentPaymentReport` - Get student payment report
- `reports.getTeacherPaymentSchedule` - Get teacher payment schedule (Admin only)
- `reports.getEnrollmentReport` - Get enrollment report

## Testing with Postman

A complete Postman collection is included: `Learning_Center_API.postman_collection.json`

To use:
1. Import the collection into Postman
2. Set the `base_url` variable (default: `http://localhost:3001`)
3. Call `auth.login` to get a token
4. The token will be automatically used for authenticated requests

## Database Schema

The database uses a dual ID system:
- **id**: Auto-increment SERIAL (internal use, fast joins)
- **public_id**: UUID (external API use, prevents enumeration attacks)

### Main Tables
- `users` - System users (admin, assistant)
- `students` - Student information
- `teachers` - Teacher information
- `courses` - Course definitions
- `course_levels` - Levels within courses
- `books` - Books required for each level
- `level_prerequisites` - Level prerequisite relationships
- `classes` - Class instances
- `class_teacher_payments` - Teacher payment configuration per class
- `sessions` - Class session tracking
- `student_enrollments` - Student course enrollments
- `student_payments` - Student payment records
- `teacher_payments` - Teacher payment records
- `expenses` - General expenses
- `audit_logs` - Audit trail

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/learning_center

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

## Security Features

- JWT authentication with configurable expiration
- Role-based access control (Admin/Assistant)
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js for security headers
- CORS protection
- Input validation with Zod
- SQL injection protection via Drizzle ORM

## License

MIT

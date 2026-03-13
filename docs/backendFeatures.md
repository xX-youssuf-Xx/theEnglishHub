# Backend Features - Learning Center Management System

## Technology Stack
- Node.js with Express.js
- TypeScript
- Bun as runtime and package manager
- PostgreSQL with node-postgres (pg)
- JWT for authentication
- bcrypt for password hashing
- express-validator for request validation
- winston for logging
- node-cron for scheduled tasks
- multer for file uploads (future)
- helmet for security headers
- cors for cross-origin requests
- compression for response compression
- rate-limiter-flexible for rate limiting

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection
│   │   ├── jwt.ts               # JWT configuration
│   │   └── env.ts               # Environment variables
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── student.controller.ts
│   │   ├── teacher.controller.ts
│   │   ├── course.controller.ts
│   │   ├── class.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── report.controller.ts
│   │   ├── user.controller.ts
│   │   └── settings.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── student.service.ts
│   │   ├── teacher.service.ts
│   │   ├── course.service.ts
│   │   ├── class.service.ts
│   │   ├── payment.service.ts
│   │   ├── report.service.ts
│   │   ├── calculation.service.ts
│   │   ├── invoice.service.ts
│   │   └── export.service.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── student.model.ts
│   │   ├── teacher.model.ts
│   │   ├── course.model.ts
│   │   ├── class.model.ts
│   │   ├── session.model.ts
│   │   └── payment.model.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logging.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── student.routes.ts
│   │   ├── teacher.routes.ts
│   │   ├── course.routes.ts
│   │   ├── class.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── report.routes.ts
│   │   ├── user.routes.ts
│   │   └── settings.routes.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   ├── helpers.ts
│   │   ├── constants.ts
│   │   └── enums.ts
│   ├── jobs/
│   │   ├── payment-reminder.job.ts
│   │   ├── backup.job.ts
│   │   └── report-generation.job.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   ├── api.types.ts
│   │   └── models.types.ts
│   └── app.ts
├── tests/
├── db/
│   └── migrations/
├── logs/
└── package.json
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`
**Description:** Authenticate user and return JWT token
**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "rememberMe": "boolean"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "username": "string",
      "role": "admin|assistant",
      "permissions": ["string"]
    }
  }
}
```

#### POST `/api/auth/logout`
**Description:** Invalidate user token
**Auth Required:** Yes
**Response:** Success message

#### POST `/api/auth/refresh`
**Description:** Refresh access token
**Auth Required:** Yes
**Response:** New token

#### GET `/api/auth/me`
**Description:** Get current user info
**Auth Required:** Yes
**Response:** User object

#### POST `/api/auth/change-password`
**Description:** Change user password
**Auth Required:** Yes
**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

### Student Routes (`/api/students`)

#### GET `/api/students`
**Description:** Get all students with pagination and filters
**Auth Required:** Yes
**Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `search`: string (search by name, phone, parent)
- `classId`: uuid
- `courseId`: uuid
- `paymentStatus`: 'paid' | 'pending' | 'overdue'
- `sortBy`: string
- `sortOrder`: 'asc' | 'desc'

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### GET `/api/students/:id`
**Description:** Get student by ID with full details
**Auth Required:** Yes
**Response:** Student object with enrollments, payments, classes

#### POST `/api/students`
**Description:** Create new student
**Auth Required:** Yes
**Permissions:** Can create students
**Request Body:**
```json
{
  "fullName": "string",
  "age": "number",
  "parentName": "string",
  "address": "string",
  "phoneNumbers": ["string"],
  "emergencyContact": "string",
  "classId": "uuid",
  "enrollments": [
    {
      "courseId": "uuid",
      "currentLevel": "number"
    }
  ],
  "initialPayment": {
    "bookFees": "number",
    "tuitionSessions": "number"
  }
}
```

#### PUT `/api/students/:id`
**Description:** Update student information
**Auth Required:** Yes
**Permissions:** Can edit students
**Request Body:** Partial student object

#### DELETE `/api/students/:id`
**Description:** Delete student (soft delete)
**Auth Required:** Yes
**Permissions:** Admin only

#### GET `/api/students/:id/payments`
**Description:** Get student payment history
**Auth Required:** Yes
**Query Params:** `type`, `from`, `to`

#### POST `/api/students/:id/enroll`
**Description:** Enroll student in additional courses
**Auth Required:** Yes
**Request Body:**
```json
{
  "courseId": "uuid",
  "level": "number",
  "classId": "uuid"
}
```

#### POST `/api/students/:id/change-class`
**Description:** Move student to different class
**Auth Required:** Yes
**Request Body:**
```json
{
  "newClassId": "uuid",
  "reason": "string"
}
```

#### POST `/api/students/:id/advance-level`
**Description:** Advance student to next level in a course
**Auth Required:** Yes
**Request Body:**
```json
{
  "courseId": "uuid",
  "newLevel": "number"
}
```

---

### Teacher Routes (`/api/teachers`)

#### GET `/api/teachers`
**Description:** Get all teachers
**Auth Required:** Yes
**Query Params:** Pagination, search, filters

#### GET `/api/teachers/:id`
**Description:** Get teacher by ID with details
**Auth Required:** Yes

#### POST `/api/teachers`
**Description:** Create new teacher
**Auth Required:** Yes
**Permissions:** Can create teachers
**Request Body:**
```json
{
  "fullName": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "classAssignments": [
    {
      "classId": "uuid",
      "paymentAmount": "number",
      "paymentCycle": 4 | 8
    }
  ]
}
```

#### PUT `/api/teachers/:id`
**Description:** Update teacher information
**Auth Required:** Yes
**Permissions:** Can edit teachers

#### DELETE `/api/teachers/:id`
**Description:** Delete teacher
**Auth Required:** Yes
**Permissions:** Admin only

#### GET `/api/teachers/:id/classes`
**Description:** Get classes taught by teacher
**Auth Required:** Yes

#### GET `/api/teachers/:id/payments`
**Description:** Get teacher payment history
**Auth Required:** Yes

#### GET `/api/teachers/:id/upcoming-payments`
**Description:** Calculate upcoming payments for teacher
**Auth Required:** Yes
**Permissions:** Admin or teacher's classes
**Response:**
```json
{
  "upcomingPayments": [
    {
      "classId": "uuid",
      "className": "string",
      "amount": "number",
      "sessionsCompleted": "number",
      "sessionsRequired": "number",
      "estimatedDate": "date"
    }
  ]
}
```

---

### Course Routes (`/api/courses`)

#### GET `/api/courses`
**Description:** Get all courses
**Auth Required:** Yes

#### GET `/api/courses/:id`
**Description:** Get course by ID with levels
**Auth Required:** Yes

#### POST `/api/courses`
**Description:** Create new course
**Auth Required:** Yes
**Permissions:** Admin only
**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "syllabus": "string",
  "levels": [
    {
      "levelNumber": "number",
      "duration": "number",
      "books": [
        {
          "name": "string",
          "price": "number"
        }
      ]
    }
  ]
}
```

#### PUT `/api/courses/:id`
**Description:** Update course
**Auth Required:** Yes
**Permissions:** Admin only

#### DELETE `/api/courses/:id`
**Description:** Delete course
**Auth Required:** Yes
**Permissions:** Admin only

#### POST `/api/courses/:id/levels`
**Description:** Add level to course
**Auth Required:** Yes
**Permissions:** Admin only

#### PUT `/api/courses/:id/levels/:levelId`
**Description:** Update level details
**Auth Required:** Yes
**Permissions:** Admin only

#### POST `/api/courses/:id/prerequisites`
**Description:** Set prerequisites for a level
**Auth Required:** Yes
**Permissions:** Admin only
**Request Body:**
```json
{
  "levelId": "uuid",
  "prerequisiteLevelIds": ["uuid"]
}
```

---

### Class Routes (`/api/classes`)

#### GET `/api/classes`
**Description:** Get all classes
**Auth Required:** Yes
**Query Params:** teacherId, studentId, schedule

#### GET `/api/classes/:id`
**Description:** Get class by ID with details
**Auth Required:** Yes
**Response:** Class with students, teacher, schedule, sessions

#### POST `/api/classes`
**Description:** Create new class
**Auth Required:** Yes
**Permissions:** Can modify classes
**Request Body:**
```json
{
  "name": "string",
  "teacherId": "uuid",
  "schedule": {
    "dayOfWeek": "number",
    "startTime": "string",
    "endTime": "string"
  },
  "teacherPayment": {
    "amount": "number",
    "cycle": 4 | 8
  },
  "studentIds": ["uuid"]
}
```

#### PUT `/api/classes/:id`
**Description:** Update class
**Auth Required:** Yes
**Permissions:** Can modify classes

#### DELETE `/api/classes/:id`
**Description:** Delete class
**Auth Required:** Yes
**Permissions:** Admin only

#### POST `/api/classes/:id/students`
**Description:** Enroll students in class
**Auth Required:** Yes
**Request Body:**
```json
{
  "studentIds": ["uuid"]
}
```

#### DELETE `/api/classes/:id/students/:studentId`
**Description:** Remove student from class
**Auth Required:** Yes

#### GET `/api/classes/:id/sessions`
**Description:** Get all sessions for class
**Auth Required:** Yes

#### POST `/api/classes/:id/sessions`
**Description:** Create new session
**Auth Required:** Yes
**Request Body:**
```json
{
  "sessionDate": "date",
  "notes": "string"
}
```

#### PUT `/api/classes/:id/sessions/:sessionId`
**Description:** Update session (mark complete)
**Auth Required:** Yes
**Request Body:**
```json
{
  "completed": "boolean",
  "notes": "string"
}
```

#### DELETE `/api/classes/:id/sessions/:sessionId`
**Description:** Delete session
**Auth Required:** Yes
**Permissions:** Admin only

---

### Payment Routes (`/api/payments`)

#### Student Payments (`/api/payments/students`)

##### GET `/api/payments/students`
**Description:** Get all student payments
**Auth Required:** Yes
**Query Params:** studentId, classId, type, status, dateRange

##### POST `/api/payments/students`
**Description:** Record student payment
**Auth Required:** Yes
**Request Body:**
```json
{
  "studentId": "uuid",
  "classId": "uuid",
  "courseId": "uuid",
  "type": "tuition" | "books",
  "amount": "number",
  "sessionsCovered": "number",
  "paymentDate": "date",
  "notes": "string",
  "generateInvoice": "boolean"
}
```

##### GET `/api/payments/students/pending`
**Description:** Get students with pending/overdue payments
**Auth Required:** Yes
**Query Params:** daysOverdue, classId

##### GET `/api/payments/students/:paymentId/invoice`
**Description:** Generate invoice for payment
**Auth Required:** Yes
**Response:** PDF stream or download URL

#### Teacher Payments (`/api/payments/teachers`)

##### GET `/api/payments/teachers`
**Description:** Get all teacher payments
**Auth Required:** Yes
**Permissions:** Admin only

##### POST `/api/payments/teachers`
**Description:** Record teacher payment
**Auth Required:** Yes
**Permissions:** Admin only
**Request Body:**
```json
{
  "teacherId": "uuid",
  "classId": "uuid",
  "amount": "number",
  "sessionsCovered": "number",
  "paymentDate": "date",
  "notes": "string"
}
```

##### GET `/api/payments/teachers/upcoming`
**Description:** Get all upcoming teacher payments
**Auth Required:** Yes
**Permissions:** Admin only

#### Expenses (`/api/payments/expenses`)

##### GET `/api/payments/expenses`
**Description:** Get all expenses
**Auth Required:** Yes
**Permissions:** Admin only

##### POST `/api/payments/expenses`
**Description:** Record expense
**Auth Required:** Yes
**Permissions:** Admin only
**Request Body:**
```json
{
  "category": "string",
  "amount": "number",
  "expenseDate": "date",
  "description": "string"
}
```

##### PUT `/api/payments/expenses/:id`
**Description:** Update expense
**Auth Required:** Yes
**Permissions:** Admin only

##### DELETE `/api/payments/expenses/:id`
**Description:** Delete expense
**Auth Required:** Yes
**Permissions:** Admin only

##### GET `/api/payments/expenses/categories`
**Description:** Get expense categories
**Auth Required:** Yes

##### POST `/api/payments/expenses/categories`
**Description:** Create expense category
**Auth Required:** Yes
**Permissions:** Admin only

---

### Report Routes (`/api/reports`)

#### GET `/api/reports/financial`
**Description:** Get financial report
**Auth Required:** Yes
**Permissions:** Admin only
**Query Params:**
- `startDate`: date
- `endDate`: date
- `type`: 'monthly' | 'custom'

**Response:**
```json
{
  "income": {
    "tuition": "number",
    "books": "number",
    "total": "number"
  },
  "expenses": {
    "teacherPayments": "number",
    "other": "number",
    "total": "number"
  },
  "netProfit": "number",
  "chartData": {...}
}
```

#### GET `/api/reports/payments/students`
**Description:** Get student payment report
**Auth Required:** Yes
**Query Params:** classId, courseId, status, dateRange

#### GET `/api/reports/payments/teachers`
**Description:** Get teacher payment schedule report
**Auth Required:** Yes
**Permissions:** Admin only

#### GET `/api/reports/enrollment`
**Description:** Get enrollment statistics
**Auth Required:** Yes
**Query Params:** courseId, classId, dateRange

#### GET `/api/reports/export`
**Description:** Export report to Excel/PDF
**Auth Required:** Yes
**Query Params:** reportType, format, dateRange

---

### User Routes (`/api/users`)

#### GET `/api/users`
**Description:** Get all users
**Auth Required:** Yes
**Permissions:** Admin only

#### GET `/api/users/:id`
**Description:** Get user by ID
**Auth Required:** Yes
**Permissions:** Admin or self

#### POST `/api/users`
**Description:** Create new user
**Auth Required:** Yes
**Permissions:** Admin only
**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "admin" | "assistant",
  "permissions": ["string"]
}
```

#### PUT `/api/users/:id`
**Description:** Update user
**Auth Required:** Yes
**Permissions:** Admin only

#### DELETE `/api/users/:id`
**Description:** Delete user
**Auth Required:** Yes
**Permissions:** Admin only

#### POST `/api/users/:id/reset-password`
**Description:** Reset user password
**Auth Required:** Yes
**Permissions:** Admin only

---

### Settings Routes (`/api/settings`)

#### GET `/api/settings/permissions`
**Description:** Get assistant permissions configuration
**Auth Required:** Yes
**Permissions:** Admin only

#### PUT `/api/settings/permissions`
**Description:** Update assistant permissions
**Auth Required:** Yes
**Permissions:** Admin only

#### GET `/api/settings/system`
**Description:** Get system settings
**Auth Required:** Yes
**Permissions:** Admin only

#### PUT `/api/settings/system`
**Description:** Update system settings
**Auth Required:** Yes
**Permissions:** Admin only

#### POST `/api/settings/backup`
**Description:** Trigger manual backup
**Auth Required:** Yes
**Permissions:** Admin only

---

## Services

### AuthService
**Methods:**
- `login(credentials): Promise<AuthResponse>`
- `logout(token): Promise<void>`
- `refreshToken(token): Promise<string>`
- `changePassword(userId, data): Promise<void>`
- `hashPassword(password): Promise<string>`
- `verifyPassword(password, hash): Promise<boolean>`
- `generateToken(user): string`
- `verifyToken(token): Promise<TokenPayload>`

### StudentService
**Methods:**
- `getAll(filters, pagination): Promise<PaginatedStudents>`
- `getById(id): Promise<Student>`
- `create(data): Promise<Student>`
- `update(id, data): Promise<Student>`
- `delete(id): Promise<void>`
- `enrollInCourse(studentId, enrollmentData): Promise<void>`
- `changeClass(studentId, newClassId): Promise<void>`
- `advanceLevel(studentId, courseId, newLevel): Promise<void>`
- `getPaymentHistory(studentId, filters): Promise<Payments[]>`
- `getPendingPayments(): Promise<Student[]>`

### TeacherService
**Methods:**
- `getAll(filters): Promise<Teacher[]>`
- `getById(id): Promise<Teacher>`
- `create(data): Promise<Teacher>`
- `update(id, data): Promise<Teacher>`
- `delete(id): Promise<void>`
- `getClasses(teacherId): Promise<Class[]>`
- `getPaymentHistory(teacherId): Promise<Payments[]>`
- `calculateUpcomingPayments(teacherId): Promise<UpcomingPayment[]>`
- `assignToClass(teacherId, classId, paymentConfig): Promise<void>`

### CourseService
**Methods:**
- `getAll(): Promise<Course[]>`
- `getById(id): Promise<Course>`
- `create(data): Promise<Course>`
- `update(id, data): Promise<Course>`
- `delete(id): Promise<void>`
- `addLevel(courseId, levelData): Promise<Level>`
- `updateLevel(levelId, data): Promise<Level>`
- `setPrerequisites(levelId, prerequisiteIds): Promise<void>`
- `getEnrolledStudents(courseId): Promise<Student[]>`

### ClassService
**Methods:**
- `getAll(filters): Promise<Class[]>`
- `getById(id): Promise<Class>`
- `create(data): Promise<Class>`
- `update(id, data): Promise<Class>`
- `delete(id): Promise<void>`
- `enrollStudents(classId, studentIds): Promise<void>`
- `removeStudent(classId, studentId): Promise<void>`
- `getSessions(classId): Promise<Session[]>`
- `createSession(classId, sessionData): Promise<Session>`
- `markSessionComplete(sessionId, completed): Promise<void>`
- `getCompletedSessionsCount(classId): Promise<number>`

### PaymentService
**Methods:**
- `recordStudentPayment(data): Promise<Payment>`
- `recordTeacherPayment(data): Promise<Payment>`
- `recordExpense(data): Promise<Expense>`
- `getStudentPayments(filters): Promise<Payment[]>`
- `getTeacherPayments(filters): Promise<Payment[]>`
- `getPendingStudentPayments(): Promise<Student[]>`
- `calculateUpcomingTeacherPayments(): Promise<UpcomingPayment[]>`
- `getExpenses(filters): Promise<Expense[]>`
- `updateExpense(id, data): Promise<Expense>`
- `deleteExpense(id): Promise<void>`
- `generateInvoice(paymentId): Promise<Buffer>`

### CalculationService
**Methods:**
- `calculateStudentPaymentDue(studentId): Promise<PaymentDue>`
- `calculateTeacherPaymentDue(teacherId, classId): Promise<PaymentDue>`
- `calculateCompletedSessions(studentId, classId): Promise<number>`
- `calculateTotalIncome(startDate, endDate): Promise<IncomeBreakdown>`
- `calculateTotalExpenses(startDate, endDate): Promise<ExpenseBreakdown>`
- `calculateNetProfit(startDate, endDate): Promise<number>`
- `calculatePaymentCycleProgress(classId, teacherId): Promise<Progress>`

### ReportService
**Methods:**
- `generateFinancialReport(startDate, endDate): Promise<FinancialReport>`
- `generateStudentPaymentReport(filters): Promise<StudentPaymentReport>`
- `generateTeacherPaymentReport(): Promise<TeacherPaymentReport>`
- `generateEnrollmentReport(filters): Promise<EnrollmentReport>`
- `exportToExcel(reportData): Promise<Buffer>`
- `exportToPDF(reportData): Promise<Buffer>`

### InvoiceService
**Methods:**
- `generateStudentInvoice(payment): Promise<Buffer>`
- `generateTeacherReceipt(payment): Promise<Buffer>`
- `generateInvoiceNumber(): string`
- `formatInvoiceData(payment): InvoiceData`

### ExportService
**Methods:**
- `exportStudentsToExcel(filters): Promise<Buffer>`
- `exportPaymentsToExcel(filters): Promise<Buffer>`
- `exportReportToPDF(reportData): Promise<Buffer>`
- `createExcelBuffer(data, columns): Promise<Buffer>`
- `createPDFBuffer(htmlContent): Promise<Buffer>`

---

## Scheduled Jobs (Cron Jobs)

### Payment Reminder Job
**Schedule:** Daily at 9:00 AM
**Description:** Check for upcoming and overdue payments
**Tasks:**
- Identify students with overdue payments (8+ sessions completed, no payment)
- Identify upcoming teacher payments (1 session away from payment cycle)
- Log reminders for dashboard alerts
- Future: Send notifications

**Code:**
```typescript
// src/jobs/payment-reminder.job.ts
cron.schedule('0 9 * * *', async () => {
  logger.info('Running payment reminder job...');
  
  // Check overdue student payments
  const overdueStudents = await paymentService.getOverdueStudents();
  
  // Check upcoming teacher payments
  const upcomingTeacherPayments = await paymentService.getUpcomingTeacherPayments(1);
  
  // Create dashboard alerts
  for (const student of overdueStudents) {
    await alertService.createAlert({
      type: 'OVERDUE_PAYMENT',
      entityType: 'STUDENT',
      entityId: student.id,
      message: `Student ${student.fullName} has overdue payment`,
      severity: 'HIGH'
    });
  }
  
  logger.info(`Created ${overdueStudents.length} overdue alerts`);
});
```

### Database Backup Job
**Schedule:** Daily at 2:00 AM
**Description:** Create database backup
**Tasks:**
- Export database to SQL file
- Compress backup file
- Store in backup directory
- Keep only last 30 backups
- Log backup status

**Code:**
```typescript
// src/jobs/backup.job.ts
cron.schedule('0 2 * * *', async () => {
  logger.info('Running database backup job...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.sql`;
  const backupPath = path.join(__dirname, '../../backups', backupFileName);
  
  try {
    // Run pg_dump
    await execAsync(`pg_dump ${databaseUrl} > ${backupPath}`);
    
    // Compress backup
    await execAsync(`gzip ${backupPath}`);
    
    // Clean old backups (keep last 30)
    await cleanOldBackups(30);
    
    logger.info(`Backup completed: ${backupFileName}.gz`);
  } catch (error) {
    logger.error('Backup failed:', error);
  }
});
```

### Monthly Report Generation Job
**Schedule:** 1st of every month at 3:00 AM
**Description:** Generate monthly financial report
**Tasks:**
- Calculate previous month's income and expenses
- Generate report PDF
- Store report in archive
- Create summary for dashboard

**Code:**
```typescript
// src/jobs/report-generation.job.ts
cron.schedule('0 3 1 * *', async () => {
  logger.info('Running monthly report generation...');
  
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  
  try {
    // Generate report
    const report = await reportService.generateFinancialReport(startDate, endDate);
    
    // Export to PDF
    const pdfBuffer = await reportService.exportToPDF(report);
    
    // Save to archive
    const fileName = `monthly-report-${lastMonth.toISOString().slice(0, 7)}.pdf`;
    const filePath = path.join(__dirname, '../../reports', fileName);
    await fs.writeFile(filePath, pdfBuffer);
    
    // Store summary in database for dashboard
    await reportService.storeMonthlySummary(report);
    
    logger.info(`Monthly report generated: ${fileName}`);
  } catch (error) {
    logger.error('Report generation failed:', error);
  }
});
```

---

## Middleware

### Authentication Middleware
**File:** `src/middleware/auth.middleware.ts`
**Purpose:** Verify JWT token and attach user to request
```typescript
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Role Middleware
**File:** `src/middleware/role.middleware.ts`
**Purpose:** Check if user has required role
```typescript
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Permission Middleware
**File:** `src/middleware/permission.middleware.ts`
**Purpose:** Check if user has specific permissions
```typescript
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Missing required permissions' });
    }
    next();
  };
};
```

### Validation Middleware
**File:** `src/middleware/validation.middleware.ts`
**Purpose:** Validate request body/query/params
```typescript
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};
```

### Error Handling Middleware
**File:** `src/middleware/error.middleware.ts`
**Purpose:** Global error handler
```typescript
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  
  return res.status(500).json({ error: 'Internal server error' });
};
```

### Rate Limiting Middleware
**File:** `src/middleware/rate-limit.middleware.ts`
**Purpose:** Prevent brute force attacks
```typescript
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // 100 requests per 15 minutes
});
```

### Logging Middleware
**File:** `src/middleware/logging.middleware.ts`
**Purpose:** Log all incoming requests
```typescript
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
};
```

---

## Database Integration

### Connection Pool
**File:** `src/config/database.ts`
```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query helper
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};
```

### Transaction Helper
```typescript
export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

---

## Error Handling

### Custom Error Classes
```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}
```

---

## Logging

### Logger Configuration
**File:** `src/utils/logger.ts`
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'learning-center-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
```

---

## Security Measures

- **Helmet:** Security headers
- **CORS:** Cross-origin request handling
- **Rate Limiting:** Prevent brute force
- **Input Validation:** Sanitize all inputs
- **SQL Injection Prevention:** Parameterized queries
- **XSS Protection:** Output encoding
- **Password Hashing:** bcrypt with salt rounds
- **JWT Security:** Secure token storage, expiration
- **HTTPS:** Enforce in production

---

## Testing Strategy

### Unit Tests
- Service methods
- Utility functions
- Validation logic

### Integration Tests
- API endpoints
- Database queries
- Authentication flow

### E2E Tests
- Critical user workflows
- Payment processing
- Report generation

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=learning_center
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info

# Backup
BACKUP_RETENTION_DAYS=30
```

---

## Performance Optimizations

- Database connection pooling
- Query optimization with indexes
- Response compression
- Pagination for large datasets
- Caching for frequently accessed data
- Lazy loading for related entities
- Batch operations for bulk updates

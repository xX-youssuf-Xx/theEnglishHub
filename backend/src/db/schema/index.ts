import { 
  pgTable, 
  serial, 
  uuid, 
  varchar, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  decimal,
  date,
  time,
  inet,
  jsonb,
  primaryKey,
  unique,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'assistant']);
export const paymentTypeEnum = pgEnum('payment_type', ['tuition', 'books']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue', 'cancelled']);
export const teacherPaymentCycleEnum = pgEnum('teacher_payment_cycle', ['4', '8']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'dropped']);
export const sessionStatusEnum = pgEnum('session_status', ['scheduled', 'completed', 'cancelled']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('assistant'),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Permissions table
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionKey: varchar('permission_key', { length: 100 }).notNull(),
  granted: boolean('granted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserPermission: unique().on(table.userId, table.permissionKey),
}));

// Courses table
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  syllabus: text('syllabus'),
  sessionsPerMonth: integer('sessions_per_month').notNull().default(4),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Course Prerequisites table
export const coursePrerequisites = pgTable('course_prerequisites', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  prerequisiteCourseId: integer('prerequisite_course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueCoursePrerequisite: unique().on(table.courseId, table.prerequisiteCourseId),
}));

// Course Levels table
export const courseLevels = pgTable('course_levels', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  levelNumber: integer('level_number').notNull(),
  durationMonths: integer('duration_months').notNull().default(4),
  pricePerMonth: decimal('price_per_month', { precision: 10, scale: 2 }).notNull().default('0'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueCourseLevel: unique().on(table.courseId, table.levelNumber),
}));

// Books table
export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  levelId: integer('level_id').notNull().references(() => courseLevels.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Level Prerequisites table
export const levelPrerequisites = pgTable('level_prerequisites', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  levelId: integer('level_id').notNull().references(() => courseLevels.id, { onDelete: 'cascade' }),
  prerequisiteLevelId: integer('prerequisite_level_id').notNull().references(() => courseLevels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniquePrerequisite: unique().on(table.courseId, table.levelId, table.prerequisiteLevelId),
}));

// Teachers table
export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Classes table
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  levelId: integer('level_id').notNull().references(() => courseLevels.id, { onDelete: 'cascade' }),
  teacherId: integer('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  startDate: date('start_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Class Schedules table - supports multiple schedules per class
export const classSchedules = pgTable('class_schedules', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Class Teacher Payments table
export const classTeacherPayments = pgTable('class_teacher_payments', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  teacherId: integer('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }).notNull(),
  paymentCycle: teacherPaymentCycleEnum('payment_cycle').notNull().default('4'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueClassTeacher: unique().on(table.classId, table.teacherId),
}));

// Students table
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  age: integer('age'),
  parentName: varchar('parent_name', { length: 255 }).notNull(),
  parentPhone: varchar('parent_phone', { length: 20 }).notNull(),
  address: text('address').notNull(),
  emergencyContact: varchar('emergency_contact', { length: 20 }).notNull(),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Student Enrollments table - tracks active enrollment (only one per student)
export const studentEnrollments = pgTable('student_enrollments', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  currentLevelId: integer('current_level_id').notNull().references(() => courseLevels.id),
  enrollmentDate: date('enrollment_date').notNull().defaultNow(),
  completionDate: date('completion_date'),
  status: enrollmentStatusEnum('status').notNull().default('active'),
  finalGrade: varchar('final_grade', { length: 10 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueActiveStudent: unique().on(table.studentId, table.status), // Only one active enrollment per student
}));

// Sessions table
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  sessionDate: date('session_date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  status: sessionStatusEnum('status').notNull().default('scheduled'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: integer('completed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Student Session Attendance table - tracks which students attended which sessions
export const studentSessionAttendance = pgTable('student_session_attendance', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sessionId: integer('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  attended: boolean('attended').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueStudentSession: unique().on(table.studentId, table.sessionId),
}));

// Student Payments table
export const studentPayments = pgTable('student_payments', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'set null' }),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  sessionsCovered: integer('sessions_covered'),
  paymentDate: date('payment_date').notNull().defaultNow(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  invoiceNumber: varchar('invoice_number', { length: 50 }),
  autoGenerated: boolean('auto_generated').notNull().default(false),
  cycleNumber: integer('cycle_number').default(1),
  notes: text('notes'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Teacher Payments table
export const teacherPayments = pgTable('teacher_payments', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  teacherId: integer('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  sessionsCovered: integer('sessions_covered').notNull(),
  paymentDate: date('payment_date').notNull().defaultNow(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  autoGenerated: boolean('auto_generated').notNull().default(false),
  cycleNumber: integer('cycle_number').default(1),
  notes: text('notes'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  category: varchar('category', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  expenseDate: date('expense_date').notNull().defaultNow(),
  description: text('description'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Expense Categories table
export const expenseCategories = pgTable('expense_categories', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').unique().notNull().defaultRandom(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Invoice number sequence
export const invoiceNumberSeq = pgTable('invoice_number_seq', {
  id: serial('id').primaryKey(),
  lastValue: integer('last_value').notNull().default(0),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(permissions),
  studentPaymentsRecorded: many(studentPayments, { relationName: 'recordedBy' }),
  teacherPaymentsRecorded: many(teacherPayments, { relationName: 'recordedBy' }),
  expensesRecorded: many(expenses, { relationName: 'recordedBy' }),
  auditLogs: many(auditLogs),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  user: one(users, {
    fields: [permissions.userId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  levels: many(courseLevels),
  classes: many(classes),
  prerequisites: many(coursePrerequisites, { relationName: 'coursePrerequisites' }),
  prerequisiteFor: many(coursePrerequisites, { relationName: 'prerequisiteCourse' }),
  levelPrerequisites: many(levelPrerequisites),
  enrollments: many(studentEnrollments),
  studentPayments: many(studentPayments),
}));

export const courseLevelsRelations = relations(courseLevels, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseLevels.courseId],
    references: [courses.id],
  }),
  books: many(books),
  prerequisites: many(levelPrerequisites, { relationName: 'level' }),
  prerequisiteFor: many(levelPrerequisites, { relationName: 'prerequisiteLevel' }),
  enrollments: many(studentEnrollments),
  classes: many(classes),
}));

export const booksRelations = relations(books, ({ one }) => ({
  level: one(courseLevels, {
    fields: [books.levelId],
    references: [courseLevels.id],
  }),
}));

export const levelPrerequisitesRelations = relations(levelPrerequisites, ({ one }) => ({
  course: one(courses, {
    fields: [levelPrerequisites.courseId],
    references: [courses.id],
  }),
  level: one(courseLevels, {
    fields: [levelPrerequisites.levelId],
    references: [courseLevels.id],
    relationName: 'level',
  }),
  prerequisiteLevel: one(courseLevels, {
    fields: [levelPrerequisites.prerequisiteLevelId],
    references: [courseLevels.id],
    relationName: 'prerequisiteLevel',
  }),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  classes: many(classes),
  classPayments: many(classTeacherPayments),
  payments: many(teacherPayments),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  course: one(courses, {
    fields: [classes.courseId],
    references: [courses.id],
  }),
  level: one(courseLevels, {
    fields: [classes.levelId],
    references: [courseLevels.id],
  }),
  teacher: one(teachers, {
    fields: [classes.teacherId],
    references: [teachers.id],
  }),
  schedules: many(classSchedules),
  teacherPayments: many(classTeacherPayments),
  sessions: many(sessions),
  students: many(students),
  studentPayments: many(studentPayments),
  teacherPaymentRecords: many(teacherPayments),
}));

export const classTeacherPaymentsRelations = relations(classTeacherPayments, ({ one }) => ({
  class: one(classes, {
    fields: [classTeacherPayments.classId],
    references: [classes.id],
  }),
  teacher: one(teachers, {
    fields: [classTeacherPayments.teacherId],
    references: [teachers.id],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  enrollments: many(studentEnrollments),
  payments: many(studentPayments),
}));

export const studentEnrollmentsRelations = relations(studentEnrollments, ({ one }) => ({
  student: one(students, {
    fields: [studentEnrollments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [studentEnrollments.courseId],
    references: [courses.id],
  }),
  class: one(classes, {
    fields: [studentEnrollments.classId],
    references: [classes.id],
  }),
  currentLevel: one(courseLevels, {
    fields: [studentEnrollments.currentLevelId],
    references: [courseLevels.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  class: one(classes, {
    fields: [sessions.classId],
    references: [classes.id],
  }),
  attendance: many(studentSessionAttendance),
  completedByUser: one(users, {
    fields: [sessions.completedBy],
    references: [users.id],
  }),
}));

export const studentSessionAttendanceRelations = relations(studentSessionAttendance, ({ one }) => ({
  student: one(students, {
    fields: [studentSessionAttendance.studentId],
    references: [students.id],
  }),
  session: one(sessions, {
    fields: [studentSessionAttendance.sessionId],
    references: [sessions.id],
  }),
}));

export const studentPaymentsRelations = relations(studentPayments, ({ one }) => ({
  student: one(students, {
    fields: [studentPayments.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [studentPayments.classId],
    references: [classes.id],
  }),
  course: one(courses, {
    fields: [studentPayments.courseId],
    references: [courses.id],
  }),
  recordedBy: one(users, {
    fields: [studentPayments.recordedBy],
    references: [users.id],
    relationName: 'recordedBy',
  }),
}));

export const teacherPaymentsRelations = relations(teacherPayments, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherPayments.teacherId],
    references: [teachers.id],
  }),
  class: one(classes, {
    fields: [teacherPayments.classId],
    references: [classes.id],
  }),
  recordedBy: one(users, {
    fields: [teacherPayments.recordedBy],
    references: [users.id],
    relationName: 'recordedBy',
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  recordedBy: one(users, {
    fields: [expenses.recordedBy],
    references: [users.id],
    relationName: 'recordedBy',
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const classSchedulesRelations = relations(classSchedules, ({ one }) => ({
  class: one(classes, {
    fields: [classSchedules.classId],
    references: [classes.id],
  }),
}));

export const coursePrerequisitesRelations = relations(coursePrerequisites, ({ one }) => ({
  course: one(courses, {
    fields: [coursePrerequisites.courseId],
    references: [courses.id],
    relationName: 'coursePrerequisites',
  }),
  prerequisiteCourse: one(courses, {
    fields: [coursePrerequisites.prerequisiteCourseId],
    references: [courses.id],
    relationName: 'prerequisiteCourse',
  }),
}));

import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL!;

async function resetDatabase() {
  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Drop all tables in reverse order of dependencies
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS 
        audit_logs,
        student_session_attendance,
        student_payments,
        teacher_payments,
        student_enrollments,
        sessions,
        class_teacher_payments,
        class_schedules,
        expenses,
        level_prerequisites,
        books,
        students,
        classes,
        course_levels,
        course_prerequisites,
        courses,
        teachers,
        permissions,
        users,
        expense_categories,
        invoice_number_seq
      CASCADE;
    `);

    // Drop types
    console.log('Dropping existing types...');
    await client.query(`
      DROP TYPE IF EXISTS 
        enrollment_status,
        session_status,
        payment_status,
        payment_type,
        teacher_payment_cycle,
        user_role
      CASCADE;
    `);

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();

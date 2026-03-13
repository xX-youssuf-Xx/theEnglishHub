const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Add sessions_per_month column to courses if not exists
    await pool.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS sessions_per_month INTEGER DEFAULT 4;
    `);
    
    // Create course_prerequisites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_prerequisites (
        id SERIAL PRIMARY KEY,
        public_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        prerequisite_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        CONSTRAINT unique_course_prerequisite UNIQUE(course_id, prerequisite_course_id)
      );
    `);
    
    // Add course_id and level_id to classes (allow null temporarily)
    await pool.query(`
      ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS level_id INTEGER REFERENCES course_levels(id) ON DELETE CASCADE;
    `);
    
    // Create class_schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_schedules (
        id SERIAL PRIMARY KEY,
        public_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    
    // Add class_id to student_enrollments
    await pool.query(`
      ALTER TABLE student_enrollments 
      ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE;
    `);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  await pool.end();
}

main();

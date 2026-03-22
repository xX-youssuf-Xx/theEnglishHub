import * as dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const dbUrl = process.env.DATABASE_URL!;

async function createTestSessions() {
	const client = new Client({
		connectionString: dbUrl,
	});

	try {
		await client.connect();
		console.log("Connected to database");

		// Get classes with their schedules
		const classesResult = await client.query(`
      SELECT c.id, c.public_id, c.name, cs.day_of_week, cs.start_time, cs.end_time
      FROM classes c
      JOIN class_schedules cs ON cs.class_id = c.id
      WHERE c.is_active = true AND cs.is_active = true
    `);

		console.log(`Found ${classesResult.rows.length} class schedules`);

		// Get current week dates
		const today = new Date();
		const startOfWeek = new Date(today);
		startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
		startOfWeek.setHours(0, 0, 0, 0);

		// Create sessions for this week based on schedules
		let sessionsCreated = 0;

		for (const schedule of classesResult.rows) {
			const sessionDate = new Date(startOfWeek);
			sessionDate.setDate(startOfWeek.getDate() + schedule.day_of_week);

			// Format date as YYYY-MM-DD
			const dateStr = sessionDate.toISOString().split("T")[0];

			// Check if session already exists
			const existingSession = await client.query(
				"SELECT id FROM sessions WHERE class_id = $1 AND session_date = $2",
				[schedule.id, dateStr],
			);

			if (existingSession.rows.length === 0) {
				await client.query(
					`INSERT INTO sessions (class_id, session_date, start_time, end_time, status)
           VALUES ($1, $2, $3, $4, 'scheduled')`,
					[schedule.id, dateStr, schedule.start_time, schedule.end_time],
				);
				sessionsCreated++;
				console.log(
					`Created session: ${schedule.name} on ${dateStr} at ${schedule.start_time}`,
				);
			}
		}

		console.log(`\n✅ Created ${sessionsCreated} test sessions`);

		// Also create some students and enrollments for testing
		console.log("\n--- Creating test students ---");

		// Get first class
		const classResult = await client.query(
			"SELECT id, public_id, course_id FROM classes WHERE is_active = true LIMIT 1",
		);

		if (classResult.rows.length > 0) {
			const testClass = classResult.rows[0];

			// Get course levels
			const levelsResult = await client.query(
				"SELECT id FROM course_levels WHERE course_id = $1 ORDER BY level_number LIMIT 1",
				[testClass.course_id],
			);

			if (levelsResult.rows.length > 0) {
				const levelId = levelsResult.rows[0].id;

				// Create test students
				const testStudents = [
					{ name: "أحمد محمد", parent: "محمد أحمد", phone: "0123456789" },
					{ name: "سارة علي", parent: "علي سارة", phone: "0123456790" },
					{ name: "خالد محمود", parent: "محمود خالد", phone: "0123456791" },
				];

				for (const studentData of testStudents) {
					// Check if student exists
					const existingStudent = await client.query(
						"SELECT id FROM students WHERE full_name = $1",
						[studentData.name],
					);

					if (existingStudent.rows.length === 0) {
						const studentResult = await client.query(
							`INSERT INTO students (full_name, parent_name, parent_phone, address, emergency_contact, class_id)
               VALUES ($1, $2, $3, 'Test Address', $3, $4)
               RETURNING id`,
							[
								studentData.name,
								studentData.parent,
								studentData.phone,
								testClass.id,
							],
						);

						const studentId = studentResult.rows[0].id;

						// Create enrollment
						await client.query(
							`INSERT INTO student_enrollments (student_id, course_id, class_id, current_level_id, status)
               VALUES ($1, $2, $3, $4, 'active')`,
							[studentId, testClass.course_id, testClass.id, levelId],
						);

						console.log(`Created student: ${studentData.name}`);
					}
				}

				// Create attendance records for existing sessions
				const sessionsResult = await client.query(
					"SELECT id FROM sessions WHERE status = $1",
					["scheduled"],
				);

				const studentsResult = await client.query(
					"SELECT id FROM students WHERE class_id = $1",
					[testClass.id],
				);

				for (const session of sessionsResult.rows) {
					for (const student of studentsResult.rows) {
						// Check if attendance record exists
						const existingAttendance = await client.query(
							"SELECT id FROM student_session_attendance WHERE session_id = $1 AND student_id = $2",
							[session.id, student.id],
						);

						if (existingAttendance.rows.length === 0) {
							await client.query(
								`INSERT INTO student_session_attendance (session_id, student_id, attended)
                 VALUES ($1, $2, false)`,
								[session.id, student.id],
							);
						}
					}
				}

				console.log(
					`Created attendance records for ${sessionsResult.rows.length} sessions`,
				);
			}
		}

		console.log("\n✅ Test data created successfully!");
	} catch (error) {
		console.error("Error creating test data:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

createTestSessions();

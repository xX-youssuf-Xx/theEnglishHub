import { hashPassword } from "../utils/auth";
import { db } from "./index";
import {
	books,
	classes,
	classSchedules,
	courseLevels,
	courses,
	expenseCategories,
	teachers,
	users,
} from "./schema";

async function seed() {
	console.log("Seeding database...");

	// Create admin user
	const adminPassword = await hashPassword("admin123");
	const [admin] = await db
		.insert(users)
		.values({
			username: "admin",
			passwordHash: adminPassword,
			role: "admin",
		})
		.returning();

	console.log("Created admin user:", admin.username);

	// Create assistant user
	const assistantPassword = await hashPassword("assistant123");
	const [assistant] = await db
		.insert(users)
		.values({
			username: "assistant",
			passwordHash: assistantPassword,
			role: "assistant",
		})
		.returning();

	console.log("Created assistant user:", assistant.username);

	// Create expense categories
	await db.insert(expenseCategories).values([
		{
			name: "Office Supplies",
			description: "General office supplies and materials",
		},
		{ name: "Rent", description: "Facility rent and utilities" },
		{ name: "Maintenance", description: "Building and equipment maintenance" },
		{ name: "Marketing", description: "Advertising and promotional materials" },
		{
			name: "Transportation",
			description: "Transportation and logistics costs",
		},
		{ name: "Other", description: "Miscellaneous expenses" },
	]);

	console.log("Created expense categories");

	// Create sample teachers
	const [teacher1] = await db
		.insert(teachers)
		.values({
			fullName: "Ahmed Hassan",
			phone: "+20123456789",
			email: "ahmed@example.com",
			address: "123 Teacher St, Cairo",
		})
		.returning();

	const [teacher2] = await db
		.insert(teachers)
		.values({
			fullName: "Sarah Johnson",
			phone: "+20987654321",
			email: "sarah@example.com",
			address: "456 Instructor Ave, Cairo",
		})
		.returning();

	console.log("Created sample teachers");

	// Create sample course
	const [course] = await db
		.insert(courses)
		.values({
			name: "English Language Course",
			description: "Comprehensive English language learning program",
			syllabus: "Grammar, Vocabulary, Speaking, Listening, Reading, Writing",
		})
		.returning();

	// Create course levels
	const [level1] = await db
		.insert(courseLevels)
		.values({
			courseId: course.id,
			levelNumber: 1,
			durationMonths: 4,
			description: "Beginner level - Basic English fundamentals",
		})
		.returning();

	const [level2] = await db
		.insert(courseLevels)
		.values({
			courseId: course.id,
			levelNumber: 2,
			durationMonths: 4,
			description: "Elementary level - Building on basics",
		})
		.returning();

	const [level3] = await db
		.insert(courseLevels)
		.values({
			courseId: course.id,
			levelNumber: 3,
			durationMonths: 4,
			description: "Intermediate level - Expanding knowledge",
		})
		.returning();

	console.log("Created course levels");

	// Create books for levels
	await db.insert(books).values([
		{ levelId: level1.id, name: "English Basics Book 1", price: "150.00" },
		{ levelId: level1.id, name: "English Workbook 1", price: "75.00" },
		{ levelId: level2.id, name: "English Elementary Book", price: "175.00" },
		{ levelId: level2.id, name: "English Workbook 2", price: "85.00" },
		{ levelId: level3.id, name: "English Intermediate Book", price: "200.00" },
		{ levelId: level3.id, name: "English Workbook 3", price: "100.00" },
	]);

	console.log("Created books");

	// Create sample classes
	const [class1] = await db
		.insert(classes)
		.values({
			name: "Class A - Morning (Sat/Mon)",
			courseId: course.id,
			levelId: level1.id,
			teacherId: teacher1.id,
			startDate: new Date().toISOString().split("T")[0],
		})
		.returning();

	const [class2] = await db
		.insert(classes)
		.values({
			name: "Class B - Evening (Sun/Tue)",
			courseId: course.id,
			levelId: level2.id,
			teacherId: teacher2.id,
			startDate: new Date().toISOString().split("T")[0],
		})
		.returning();

	console.log("Created sample classes");

	// Create class schedules
	await db.insert(classSchedules).values([
		{
			classId: class1.id,
			dayOfWeek: 6, // Saturday
			startTime: "09:00",
			endTime: "11:00",
		},
		{
			classId: class1.id,
			dayOfWeek: 1, // Monday
			startTime: "09:00",
			endTime: "11:00",
		},
		{
			classId: class2.id,
			dayOfWeek: 0, // Sunday
			startTime: "17:00",
			endTime: "19:00",
		},
		{
			classId: class2.id,
			dayOfWeek: 2, // Tuesday
			startTime: "17:00",
			endTime: "19:00",
		},
	]);

	console.log("Created class schedules");

	console.log("Database seeding completed successfully!");
	console.log("\nLogin credentials:");
	console.log("Admin - Username: admin, Password: admin123");
	console.log("Assistant - Username: assistant, Password: assistant123");
}

seed()
	.catch((error) => {
		console.error("Error seeding database:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});

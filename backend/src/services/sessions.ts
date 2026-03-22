import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db";
import {
	classes,
	classTeacherPayments,
	courses,
	sessions,
	studentEnrollments,
	studentPayments,
	studentSessionAttendance,
	students,
	teacherPayments,
} from "../db/schema";
import { logger } from "../utils/logger";

export class SessionService {
	async getWeeklySchedule(startDate: Date, endDate: Date) {
		try {
			const startDateStr = startDate.toISOString().split("T")[0];
			const endDateStr = endDate.toISOString().split("T")[0];

			// Get all sessions in the date range
			const sessionsData = await db.query.sessions.findMany({
				where: and(
					gte(sessions.sessionDate, startDateStr),
					lte(sessions.sessionDate, endDateStr),
				),
				with: {
					class: {
						with: {
							course: true,
							level: true,
							teacherPayments: {
								with: {
									teacher: true,
								},
							},
						},
					},
					attendance: {
						with: {
							student: true,
						},
					},
				},
				orderBy: [sessions.sessionDate, sessions.startTime],
			});

			const classIds = Array.from(
				new Set(sessionsData.map((session) => session.classId)),
			);
			const monthStart = new Date(
				startDate.getFullYear(),
				startDate.getMonth(),
				1,
			);
			const monthEnd = new Date(
				startDate.getFullYear(),
				startDate.getMonth() + 1,
				0,
			);
			const monthStartStr = monthStart.toISOString().split("T")[0];
			const monthEndStr = monthEnd.toISOString().split("T")[0];

			const monthlySessions = classIds.length
				? await db.query.sessions.findMany({
						where: and(
							inArray(sessions.classId, classIds),
							gte(sessions.sessionDate, monthStartStr),
							lte(sessions.sessionDate, monthEndStr),
						),
					})
				: [];

			const monthlyByClass = new Map<
				number,
				{ total: number; completed: number }
			>();
			for (const monthlySession of monthlySessions) {
				const current = monthlyByClass.get(monthlySession.classId) || {
					total: 0,
					completed: 0,
				};
				current.total += 1;
				if (monthlySession.status === "completed") {
					current.completed += 1;
				}
				monthlyByClass.set(monthlySession.classId, current);
			}

			// Group by day of week
			const scheduleByDay = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
				dayOfWeek: day,
				sessions: [] as any[],
			}));

			sessionsData.forEach((session) => {
				const dayOfWeek = new Date(session.sessionDate).getDay();
				scheduleByDay[dayOfWeek].sessions.push({
					id: session.publicId,
					date: session.sessionDate,
					startTime: session.startTime,
					endTime: session.endTime,
					status: session.status,
					class: {
						id: session.class.publicId,
						name: session.class.name,
						course: session.class.course?.name,
						level: session.class.level?.levelNumber,
					},
					teacher: session.class.teacherPayments?.[0]?.teacher
						? {
								id: session.class.teacherPayments[0].teacher.publicId,
								fullName: session.class.teacherPayments[0].teacher.fullName,
							}
						: null,
					attendanceCount:
						session.attendance?.filter((a) => a.attended).length || 0,
					totalStudents: session.attendance?.length || 0,
					monthlyStats: monthlyByClass.get(session.classId) || {
						total: 0,
						completed: 0,
					},
				});
			});

			return scheduleByDay;
		} catch (error) {
			logger.error("Get weekly schedule error:", error);
			throw error;
		}
	}

	async markSessionComplete(sessionPublicId: string, userId: number) {
		try {
			const session = await db.query.sessions.findFirst({
				where: eq(sessions.publicId, sessionPublicId),
				with: {
					class: {
						with: {
							course: true,
							level: true,
							teacherPayments: {
								with: {
									teacher: true,
								},
							},
							students: {
								where: eq(students.isActive, true),
							},
						},
					},
					attendance: true,
				},
			});

			if (!session) {
				throw new Error("Session not found");
			}

			if (session.status === "completed") {
				throw new Error("Session is already marked as completed");
			}

			// Mark session as completed
			await db
				.update(sessions)
				.set({
					status: "completed",
					completedAt: new Date(),
					completedBy: userId,
					updatedAt: new Date(),
				})
				.where(eq(sessions.id, session.id));

			// Update attendance for all students
			if (session.attendance && session.attendance.length > 0) {
				for (const attendance of session.attendance) {
					await db
						.update(studentSessionAttendance)
						.set({
							attended: true,
							updatedAt: new Date(),
						})
						.where(eq(studentSessionAttendance.id, attendance.id));
				}
			}

			// Calculate financial impact
			const course = session.class.course;
			const level = session.class.level;
			const sessionsPerMonth = course?.sessionsPerMonth || 4;

			// Check if this session completes a payment cycle for students
			const completedSessions = await db
				.select({ count: sql`count(*)`.as("count") })
				.from(sessions)
				.where(
					and(
						eq(sessions.classId, session.class.id),
						eq(sessions.status, "completed"),
					),
				);

			const totalCompletedSessions = Number(completedSessions[0]?.count) || 0;
			const isPaymentCycleComplete =
				totalCompletedSessions % sessionsPerMonth === 0;
			const cycleNumber = Math.ceil(totalCompletedSessions / sessionsPerMonth);

			const autoGeneratedPayments = {
				students: 0,
				teachers: 0,
			};

			// If payment cycle is complete, create pending payment records
			if (isPaymentCycleComplete) {
				// Create pending payments for all students in the class
				if (
					session.class.students &&
					session.class.students.length > 0 &&
					level
				) {
					const pricePerMonth = level.pricePerMonth || "0";

					for (const student of session.class.students) {
						// Check if pending payment already exists for this cycle
						const existingPayment = await db.query.studentPayments.findFirst({
							where: and(
								eq(studentPayments.studentId, student.id),
								eq(studentPayments.classId, session.class.id),
								eq(studentPayments.cycleNumber, cycleNumber),
								eq(studentPayments.autoGenerated, true),
							),
						});

						if (!existingPayment) {
							await db.insert(studentPayments).values({
								studentId: student.id,
								classId: session.class.id,
								courseId: session.class.courseId,
								paymentType: "tuition",
								amount: pricePerMonth,
								sessionsCovered: sessionsPerMonth,
								status: "pending",
								autoGenerated: true,
								cycleNumber: cycleNumber,
								notes: `دفعة شهرية تلقائية - دورة ${cycleNumber}`,
							});
							autoGeneratedPayments.students++;
						}
					}
				}

				// Create pending payment for teacher
				if (
					session.class.teacherPayments &&
					session.class.teacherPayments.length > 0
				) {
					for (const teacherPayment of session.class.teacherPayments) {
						if (teacherPayment.teacherId && teacherPayment.isActive) {
							// Skip if payment amount is 0 or not set
							const paymentAmount = parseFloat(
								teacherPayment.paymentAmount || "0",
							);
							if (paymentAmount <= 0) {
								throw new Error(
									`Teacher payment configuration error: Teacher ${teacherPayment.teacherId} in class ${session.class.name} (ID: ${session.class.publicId}) has payment amount of ${paymentAmount}. ` +
										`Please configure the teacher payment amount in class settings.`,
								);
							}

							// Check if pending payment already exists for this cycle
							const existingTeacherPayment =
								await db.query.teacherPayments.findFirst({
									where: and(
										eq(teacherPayments.teacherId, teacherPayment.teacherId),
										eq(teacherPayments.classId, session.class.id),
										eq(teacherPayments.cycleNumber, cycleNumber),
										eq(teacherPayments.autoGenerated, true),
									),
								});

							if (!existingTeacherPayment) {
								await db.insert(teacherPayments).values({
									teacherId: teacherPayment.teacherId,
									classId: session.class.id,
									amount: teacherPayment.paymentAmount,
									sessionsCovered: sessionsPerMonth,
									status: "pending",
									autoGenerated: true,
									cycleNumber: cycleNumber,
									notes: `دفعة شهرية تلقائية - دورة ${cycleNumber} (${teacherPayment.paymentCycle} حصص)`,
								});
								autoGeneratedPayments.teachers++;
							}
						}
					}
				}
			}

			return {
				message: "Session marked as completed",
				sessionId: session.publicId,
				isPaymentCycleComplete,
				sessionsCompletedInCycle:
					totalCompletedSessions % sessionsPerMonth || sessionsPerMonth,
				autoGeneratedPayments,
			};
		} catch (error) {
			logger.error("Mark session complete error:", error);
			throw error;
		}
	}

	async markStudentAttendance(
		sessionPublicId: string,
		studentPublicId: string,
		attended: boolean,
	) {
		try {
			const session = await db.query.sessions.findFirst({
				where: eq(sessions.publicId, sessionPublicId),
			});

			if (!session) {
				throw new Error("Session not found");
			}

			const student = await db.query.students.findFirst({
				where: eq(students.publicId, studentPublicId),
			});

			if (!student) {
				throw new Error("Student not found");
			}

			// Check if attendance record exists
			const existingAttendance =
				await db.query.studentSessionAttendance.findFirst({
					where: and(
						eq(studentSessionAttendance.sessionId, session.id),
						eq(studentSessionAttendance.studentId, student.id),
					),
				});

			if (existingAttendance) {
				await db
					.update(studentSessionAttendance)
					.set({
						attended,
						updatedAt: new Date(),
					})
					.where(eq(studentSessionAttendance.id, existingAttendance.id));
			} else {
				await db.insert(studentSessionAttendance).values({
					sessionId: session.id,
					studentId: student.id,
					attended,
				});
			}

			return { message: "Attendance marked successfully" };
		} catch (error) {
			logger.error("Mark attendance error:", error);
			throw error;
		}
	}

	async createSessionsForClass(
		classPublicId: string,
		startDate: Date,
		numberOfSessions: number,
	) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, classPublicId),
				with: {
					schedules: true,
				},
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			if (!classData.schedules || classData.schedules.length === 0) {
				throw new Error("Class has no schedules defined");
			}

			const sessionsToCreate = [];
			const currentDate = new Date(startDate);
			let sessionsCreated = 0;

			while (sessionsCreated < numberOfSessions) {
				const dayOfWeek = currentDate.getDay();

				// Find if there's a schedule for this day
				const schedule = classData.schedules.find(
					(s) => s.dayOfWeek === dayOfWeek && s.isActive,
				);

				if (schedule) {
					sessionsToCreate.push({
						classId: classData.id,
						sessionDate: new Date(currentDate),
						startTime: schedule.startTime,
						endTime: schedule.endTime,
						status: "scheduled",
					});
					sessionsCreated++;
				}

				// Move to next day
				currentDate.setDate(currentDate.getDate() + 1);
			}

			if (sessionsToCreate.length > 0) {
				await db.insert(sessions).values(sessionsToCreate);
			}

			return {
				message: `Created ${sessionsToCreate.length} sessions`,
				sessionsCreated: sessionsToCreate.length,
			};
		} catch (error) {
			logger.error("Create sessions error:", error);
			throw error;
		}
	}

	async getStudentProgressInCourse(
		studentPublicId: string,
		coursePublicId: string,
	) {
		try {
			const student = await db.query.students.findFirst({
				where: eq(students.publicId, studentPublicId),
			});

			if (!student) {
				throw new Error("Student not found");
			}

			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, coursePublicId),
			});

			if (!course) {
				throw new Error("Course not found");
			}

			const enrollment = await db.query.studentEnrollments.findFirst({
				where: and(
					eq(studentEnrollments.studentId, student.id),
					eq(studentEnrollments.courseId, course.id),
				),
				with: {
					class: {
						with: {
							sessions: {
								with: {
									attendance: {
										where: eq(studentSessionAttendance.studentId, student.id),
									},
								},
							},
						},
					},
				},
			});

			if (!enrollment) {
				throw new Error("Student not enrolled in this course");
			}

			const totalSessions = enrollment.class?.sessions?.length || 0;
			const completedSessions =
				enrollment.class?.sessions?.filter((s) => s.status === "completed")
					.length || 0;
			const attendedSessions =
				enrollment.class?.sessions?.filter((s) =>
					s.attendance?.some((a) => a.attended),
				).length || 0;

			return {
				studentId: student.publicId,
				courseId: course.publicId,
				enrollmentId: enrollment.publicId,
				status: enrollment.status,
				progress: {
					totalSessions,
					completedSessions,
					attendedSessions,
					attendanceRate:
						totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0,
					completionRate:
						totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
				},
			};
		} catch (error) {
			logger.error("Get student progress error:", error);
			throw error;
		}
	}

	async generateSessionsForAllClasses() {
		try {
			// Get all active classes with their schedules
			const allClasses = await db.query.classes.findMany({
				where: eq(classes.isActive, true),
				with: {
					schedules: true,
					course: true,
				},
			});

			const now = new Date();
			const currentYear = now.getFullYear();
			const currentMonth = now.getMonth();

			// Calculate start and end of current month
			const monthStart = new Date(currentYear, currentMonth, 1);
			const monthEnd = new Date(currentYear, currentMonth + 1, 0); // Last day of month

			let totalSessionsCreated = 0;
			const results = [];

			for (const classData of allClasses) {
				if (!classData.schedules || classData.schedules.length === 0) {
					continue;
				}

				const sessionsToCreate = [];
				const currentDate = new Date(monthStart);

				// Generate sessions for every day in the current month
				while (currentDate <= monthEnd) {
					const dayOfWeek = currentDate.getDay();

					// Find if there's a schedule for this day
					const schedule = classData.schedules.find(
						(s) => s.dayOfWeek === dayOfWeek && s.isActive,
					);

					if (schedule) {
						const dateStr = currentDate.toISOString().split("T")[0];

						// Check if session already exists for this date (preserves completed sessions)
						const existingSession = await db.query.sessions.findFirst({
							where: and(
								eq(sessions.classId, classData.id),
								eq(sessions.sessionDate, dateStr),
							),
						});

						// Only create if no session exists (regardless of status)
						if (!existingSession) {
							sessionsToCreate.push({
								classId: classData.id,
								sessionDate: dateStr,
								startTime: schedule.startTime,
								endTime: schedule.endTime,
								status: "scheduled",
							});
						}
					}

					// Move to next day
					currentDate.setDate(currentDate.getDate() + 1);
				}

				if (sessionsToCreate.length > 0) {
					await db.insert(sessions).values(sessionsToCreate);
					totalSessionsCreated += sessionsToCreate.length;
					results.push({
						classId: classData.publicId,
						className: classData.name,
						sessionsCreated: sessionsToCreate.length,
					});
				}
			}

			return {
				message: `Generated ${totalSessionsCreated} sessions for ${results.length} classes for ${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
				totalSessionsCreated,
				classesProcessed: results.length,
				month: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
				details: results,
			};
		} catch (error) {
			logger.error("Generate sessions for all classes error:", error);
			throw error;
		}
	}

	async getSessionDetails(sessionPublicId: string) {
		try {
			const session = await db.query.sessions.findFirst({
				where: eq(sessions.publicId, sessionPublicId),
				with: {
					class: {
						with: {
							course: true,
							level: true,
							teacherPayments: {
								with: {
									teacher: true,
								},
							},
							students: {
								where: eq(students.isActive, true),
							},
						},
					},
					attendance: {
						with: {
							student: true,
						},
					},
				},
			});

			if (!session) {
				throw new Error("Session not found");
			}

			return {
				id: session.publicId,
				sessionDate: session.sessionDate,
				startTime: session.startTime,
				endTime: session.endTime,
				status: session.status,
				completedAt: session.completedAt,
				notes: session.notes,
				class: {
					id: session.class.publicId,
					name: session.class.name,
					course: session.class.course?.name,
					level: session.class.level?.levelNumber,
					teacher: session.class.teacherPayments?.[0]?.teacher
						? {
								id: session.class.teacherPayments[0].teacher.publicId,
								fullName: session.class.teacherPayments[0].teacher.fullName,
							}
						: null,
					totalStudents: session.class.students?.length || 0,
				},
				attendance:
					session.attendance?.map((a) => ({
						studentId: a.student.publicId,
						studentName: a.student.fullName,
						attended: a.attended,
						notes: a.notes,
					})) || [],
				attendanceStats: {
					total: session.attendance?.length || 0,
					attended: session.attendance?.filter((a) => a.attended).length || 0,
					absent: session.attendance?.filter((a) => !a.attended).length || 0,
				},
			};
		} catch (error) {
			logger.error("Get session details error:", error);
			throw error;
		}
	}

	async generateMissingPendingPayments() {
		try {
			logger.info("Starting generation of missing pending payments...");

			// Get all active classes with their info
			const allClasses = await db.query.classes.findMany({
				where: eq(classes.isActive, true),
				with: {
					course: true,
					level: true,
					students: {
						where: eq(students.isActive, true),
					},
					teacherPayments: {
						where: eq(classTeacherPayments.isActive, true),
						with: {
							teacher: true,
						},
					},
				},
			});

			let studentPaymentsCreated = 0;
			let teacherPaymentsCreated = 0;
			const results = [];

			for (const classData of allClasses) {
				if (!classData.course || !classData.level) {
					continue;
				}

				const sessionsPerMonth = classData.course.sessionsPerMonth || 4;
				const pricePerMonth = classData.level.pricePerMonth || "0";

				// Get completed sessions count for this class
				const completedSessionsResult = await db
					.select({ count: sql`count(*)`.as("count") })
					.from(sessions)
					.where(
						and(
							eq(sessions.classId, classData.id),
							eq(sessions.status, "completed"),
						),
					);

				const totalCompletedSessions =
					Number(completedSessionsResult[0]?.count) || 0;

				if (totalCompletedSessions === 0) {
					continue;
				}

				// Calculate how many payment cycles should exist
				const expectedCycles = Math.floor(
					totalCompletedSessions / sessionsPerMonth,
				);

				if (expectedCycles === 0) {
					continue;
				}

				const classResults = {
					classId: classData.publicId,
					className: classData.name,
					completedSessions: totalCompletedSessions,
					expectedCycles,
					studentPaymentsCreated: 0,
					teacherPaymentsCreated: 0,
				};

				// Generate missing payments for each cycle
				for (
					let cycleNumber = 1;
					cycleNumber <= expectedCycles;
					cycleNumber++
				) {
					// Student payments
					if (classData.students && classData.students.length > 0) {
						for (const student of classData.students) {
							// Check if payment already exists for this cycle
							const existingPayment = await db.query.studentPayments.findFirst({
								where: and(
									eq(studentPayments.studentId, student.id),
									eq(studentPayments.classId, classData.id),
									eq(studentPayments.courseId, classData.courseId),
									eq(studentPayments.cycleNumber, cycleNumber),
									eq(studentPayments.autoGenerated, true),
								),
							});

							if (!existingPayment) {
								await db.insert(studentPayments).values({
									studentId: student.id,
									classId: classData.id,
									courseId: classData.courseId,
									paymentType: "tuition",
									amount: pricePerMonth,
									sessionsCovered: sessionsPerMonth,
									status: "pending",
									autoGenerated: true,
									cycleNumber: cycleNumber,
									notes: `دفعة شهرية تلقائية - دورة ${cycleNumber}`,
								});
								studentPaymentsCreated++;
								classResults.studentPaymentsCreated++;
							}
						}
					}

					// Teacher payments
					if (
						classData.teacherPayments &&
						classData.teacherPayments.length > 0
					) {
						for (const teacherPayment of classData.teacherPayments) {
							if (teacherPayment.teacherId) {
								// Check if payment already exists for this cycle
								const existingTeacherPayment =
									await db.query.teacherPayments.findFirst({
										where: and(
											eq(teacherPayments.teacherId, teacherPayment.teacherId),
											eq(teacherPayments.classId, classData.id),
											eq(teacherPayments.cycleNumber, cycleNumber),
											eq(teacherPayments.autoGenerated, true),
										),
									});

								if (!existingTeacherPayment) {
									await db.insert(teacherPayments).values({
										teacherId: teacherPayment.teacherId,
										classId: classData.id,
										amount: teacherPayment.paymentAmount,
										sessionsCovered: sessionsPerMonth,
										status: "pending",
										autoGenerated: true,
										cycleNumber: cycleNumber,
										notes: `دفعة شهرية تلقائية - دورة ${cycleNumber}`,
									});
									teacherPaymentsCreated++;
									classResults.teacherPaymentsCreated++;
								}
							}
						}
					}
				}

				if (
					classResults.studentPaymentsCreated > 0 ||
					classResults.teacherPaymentsCreated > 0
				) {
					results.push(classResults);
				}
			}

			logger.info(
				`Generated ${studentPaymentsCreated} student payments and ${teacherPaymentsCreated} teacher payments`,
			);

			return {
				message: `Generated ${studentPaymentsCreated} student payments and ${teacherPaymentsCreated} teacher payments`,
				studentPaymentsCreated,
				teacherPaymentsCreated,
				classesProcessed: results.length,
				details: results,
			};
		} catch (error) {
			logger.error("Generate missing pending payments error:", error);
			throw error;
		}
	}
}

export const sessionService = new SessionService();

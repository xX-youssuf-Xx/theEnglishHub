import { db } from '../db';
import { studentPayments, teacherPayments, expenses, students, teachers, classes, sessions, courses, studentEnrollments, classTeacherPayments } from '../db/schema';
import { eq, and, gte, lte, sql, sum, count, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class ReportService {
  async getFinancialReport(startDate: Date, endDate: Date) {
    try {
      // Convert dates to ISO strings for PostgreSQL
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Income
      const incomeResult = await db.select({
        tuition: sql`SUM(CASE WHEN payment_type = 'tuition' THEN amount ELSE 0 END)`,
        books: sql`SUM(CASE WHEN payment_type = 'books' THEN amount ELSE 0 END)`,
        total: sum(studentPayments.amount),
      })
      .from(studentPayments)
      .where(and(
        eq(studentPayments.status, 'paid'),
        gte(studentPayments.paymentDate, startDateStr),
        lte(studentPayments.paymentDate, endDateStr)
      ));

      // Teacher payments
      const teacherPaymentsResult = await db.select({
        total: sum(teacherPayments.amount),
      })
      .from(teacherPayments)
      .where(and(
        gte(teacherPayments.paymentDate, startDateStr),
        lte(teacherPayments.paymentDate, endDateStr)
      ));

      // Other expenses
      const expensesResult = await db.select({
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(and(
        gte(expenses.expenseDate, startDateStr),
        lte(expenses.expenseDate, endDateStr)
      ));

      const income = {
        tuition: parseFloat(incomeResult[0]?.tuition || '0'),
        books: parseFloat(incomeResult[0]?.books || '0'),
        total: parseFloat(incomeResult[0]?.total || '0'),
      };

      const teacherPaymentsTotal = parseFloat(teacherPaymentsResult[0]?.total || '0');
      const otherExpensesTotal = parseFloat(expensesResult[0]?.total || '0');

      const expensesData = {
        teacherPayments: teacherPaymentsTotal,
        other: otherExpensesTotal,
        total: teacherPaymentsTotal + otherExpensesTotal,
      };

      const netProfit = income.total - expensesData.total;

      // Get daily breakdown for charts
      const dailyIncome = await db.execute(sql`
        SELECT 
          payment_date as date,
          SUM(CASE WHEN payment_type = 'tuition' THEN amount ELSE 0 END) as tuition,
          SUM(CASE WHEN payment_type = 'books' THEN amount ELSE 0 END) as books,
          SUM(amount) as total
        FROM student_payments
        WHERE status = 'paid'
          AND payment_date BETWEEN ${startDate} AND ${endDate}
        GROUP BY payment_date
        ORDER BY payment_date
      `);

      return {
        period: { startDate, endDate },
        income,
        expenses: expensesData,
        netProfit,
        chartData: {
          dailyIncome: dailyIncome.rows,
        },
      };
    } catch (error) {
      logger.error('Get financial report error:', error);
      throw error;
    }
  }

  async getStudentPaymentReport(params: {
    classId?: number;
    courseId?: number;
    status?: 'paid' | 'pending' | 'overdue';
  }) {
    try {
      let query = sql`
        SELECT 
          s.public_id as student_id,
          s.full_name,
          c.name as class_name,
          co.name as course_name,
          COUNT(DISTINCT ses.id) as sessions_completed,
          COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) as sessions_paid,
          COUNT(DISTINCT ses.id) - COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) as sessions_due,
          CASE 
            WHEN COUNT(DISTINCT ses.id) - COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) >= 8 THEN 'overdue'
            WHEN COUNT(DISTINCT ses.id) - COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) > 0 THEN 'pending'
            ELSE 'paid'
          END as payment_status
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_active = true
        LEFT JOIN courses co ON se.course_id = co.id
        LEFT JOIN sessions ses ON s.class_id = ses.class_id AND ses.completed = true
        LEFT JOIN student_payments sp ON s.id = sp.student_id AND se.course_id = sp.course_id AND sp.status = 'paid'
        WHERE s.is_active = true
      `;

      if (params.classId) {
        query = sql`${query} AND s.class_id = ${params.classId}`;
      }

      if (params.courseId) {
        query = sql`${query} AND se.course_id = ${params.courseId}`;
      }

      query = sql`${query} 
        GROUP BY s.id, s.public_id, s.full_name, c.name, co.name
        ORDER BY sessions_due DESC
      `;

      const result = await db.execute(query);

      let data = result.rows;

      if (params.status) {
        data = data.filter((row: any) => row.payment_status === params.status);
      }

      return {
        data: data.map((row: any) => ({
          studentId: row.student_id,
          fullName: row.full_name,
          className: row.class_name,
          courseName: row.course_name,
          sessionsCompleted: parseInt(row.sessions_completed),
          sessionsPaid: parseInt(row.sessions_paid),
          sessionsDue: parseInt(row.sessions_due),
          status: row.payment_status,
        })),
        summary: {
          total: data.length,
          paid: data.filter((r: any) => r.payment_status === 'paid').length,
          pending: data.filter((r: any) => r.payment_status === 'pending').length,
          overdue: data.filter((r: any) => r.payment_status === 'overdue').length,
        },
      };
    } catch (error) {
      logger.error('Get student payment report error:', error);
      throw error;
    }
  }

  async getTeacherPaymentSchedule() {
    try {
      // Get all active teacher-class assignments with payment info
      const teacherAssignments = await db.query.classTeacherPayments.findMany({
        where: eq(classTeacherPayments.isActive, true),
        with: {
          teacher: true,
          class: true,
        },
      });

      // Calculate payment schedules for each assignment
      const paymentSchedules = await Promise.all(
        teacherAssignments.map(async (assignment) => {
          // Get completed sessions count for this class
          const completedSessions = await db.select({ count: count() })
            .from(sessions)
            .where(and(
              eq(sessions.classId, assignment.classId),
              eq(sessions.completed, true)
            ));

          const sessionsCompleted = completedSessions[0]?.count || 0;
          const cycleSize = parseInt(assignment.paymentCycle);
          const cyclesCompleted = Math.floor(sessionsCompleted / cycleSize);
          const sessionsInCurrentCycle = sessionsCompleted % cycleSize;
          const sessionsUntilNextPayment = cycleSize - sessionsInCurrentCycle;

          // Get total paid to this teacher for this class
          const teacherPaymentsResult = await db.select({
            total: sum(teacherPayments.amount),
          })
          .from(teacherPayments)
          .where(and(
            eq(teacherPayments.teacherId, assignment.teacherId),
            eq(teacherPayments.classId, assignment.classId)
          ));

          const totalEarned = cyclesCompleted * parseFloat(assignment.paymentAmount);
          const totalPaid = parseFloat(teacherPaymentsResult[0]?.total || '0');
          const balanceDue = totalEarned - totalPaid;

          return {
            teacherId: assignment.teacher.publicId,
            teacherName: assignment.teacher.fullName,
            classId: assignment.class.publicId,
            className: assignment.class.name,
            paymentAmount: assignment.paymentAmount,
            paymentCycle: assignment.paymentCycle,
            sessionsCompleted,
            cyclesCompleted,
            sessionsInCurrentCycle,
            sessionsUntilNextPayment,
            totalEarned,
            totalPaid,
            balanceDue,
          };
        })
      );

      // Sort by sessions until next payment
      paymentSchedules.sort((a, b) => a.sessionsUntilNextPayment - b.sessionsUntilNextPayment);

      return {
        data: paymentSchedules,
      };
    } catch (error) {
      logger.error('Get teacher payment schedule error:', error);
      throw error;
    }
  }

  async getEnrollmentReport(params: {
    courseId?: number;
    classId?: number;
  }) {
    try {
      // Enrollment by course
      const courseEnrollments = await db.select({
        courseId: courses.publicId,
        courseName: courses.name,
        count: count(studentEnrollments.id),
      })
      .from(courses)
      .leftJoin(studentEnrollments, eq(courses.id, studentEnrollments.courseId))
      .where(and(
        eq(courses.isActive, true),
        eq(studentEnrollments.isActive, true)
      ))
      .groupBy(courses.id, courses.publicId, courses.name);

      // Enrollment by class
      const classEnrollments = await db.select({
        classId: classes.publicId,
        className: classes.name,
        count: count(students.id),
      })
      .from(classes)
      .leftJoin(students, eq(classes.id, students.classId))
      .where(and(
        eq(classes.isActive, true),
        eq(students.isActive, true)
      ))
      .groupBy(classes.id, classes.publicId, classes.name);

      // Total stats
      const totalStudents = await db.select({ count: count() }).from(students).where(eq(students.isActive, true));
      const totalCourses = await db.select({ count: count() }).from(courses).where(eq(courses.isActive, true));
      const totalClasses = await db.select({ count: count() }).from(classes).where(eq(classes.isActive, true));
      const totalTeachers = await db.select({ count: count() }).from(teachers).where(eq(teachers.isActive, true));

      return {
        summary: {
          totalStudents: totalStudents[0]?.count || 0,
          totalCourses: totalCourses[0]?.count || 0,
          totalClasses: totalClasses[0]?.count || 0,
          totalTeachers: totalTeachers[0]?.count || 0,
        },
        courseEnrollments,
        classEnrollments,
      };
    } catch (error) {
      logger.error('Get enrollment report error:', error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Active students
      const activeStudents = await db.select({ count: count() }).from(students).where(eq(students.isActive, true));

      // Active teachers
      const activeTeachers = await db.select({ count: count() }).from(teachers).where(eq(teachers.isActive, true));

      // Monthly income
      const monthlyIncome = await db.select({
        total: sum(studentPayments.amount),
      })
      .from(studentPayments)
      .where(and(
        eq(studentPayments.status, 'paid'),
        gte(studentPayments.paymentDate, firstDayOfMonth),
        lte(studentPayments.paymentDate, lastDayOfMonth)
      ));

      // Pending payments count
      const pendingPaymentsResult = await db.execute(sql`
        SELECT COUNT(DISTINCT s.id) as count
        FROM students s
        LEFT JOIN sessions ses ON s.class_id = ses.class_id AND ses.completed = true
        LEFT JOIN student_payments sp ON s.id = sp.student_id AND sp.status = 'paid'
        WHERE s.is_active = true
        GROUP BY s.id
        HAVING COUNT(DISTINCT ses.id) - COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) >= 8
      `);

      return {
        totalActiveStudents: activeStudents[0]?.count || 0,
        totalActiveTeachers: activeTeachers[0]?.count || 0,
        monthlyIncome: parseFloat(monthlyIncome[0]?.total || '0'),
        pendingPaymentsCount: pendingPaymentsResult.rowCount || 0,
      };
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();

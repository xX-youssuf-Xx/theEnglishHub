import { db } from '../db';
import { studentPayments, teacherPayments, expenses, students, classes, courses, teachers, sessions } from '../db/schema';
import { eq, and, desc, gte, lte, sql, sum, count } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { generateInvoiceNumber } from '../utils/auth';

export class PaymentService {
  // Student Payments
  async getStudentPayments(params: {
    page?: number;
    limit?: number;
    studentId?: number;
    classId?: number;
    type?: 'tuition' | 'books';
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      let whereClause = undefined;

      if (params.studentId) {
        whereClause = eq(studentPayments.studentId, params.studentId);
      }

      if (params.classId) {
        whereClause = whereClause 
          ? and(whereClause, eq(studentPayments.classId, params.classId))
          : eq(studentPayments.classId, params.classId);
      }

      if (params.type) {
        whereClause = whereClause
          ? and(whereClause, eq(studentPayments.paymentType, params.type))
          : eq(studentPayments.paymentType, params.type);
      }

      const [data, totalResult] = await Promise.all([
        db.query.studentPayments.findMany({
          where: whereClause,
          with: {
            student: true,
            class: true,
            course: true,
          },
          limit,
          offset,
          orderBy: desc(studentPayments.paymentDate),
        }),
        db.select({ count: count() }).from(studentPayments).where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        data: data.map(p => ({
          id: p.publicId,
          student: p.student ? { id: p.student.publicId, fullName: p.student.fullName } : null,
          class: p.class ? { id: p.class.publicId, name: p.class.name } : null,
          course: p.course ? { id: p.course.publicId, name: p.course.name } : null,
          type: p.paymentType,
          amount: p.amount,
          sessionsCovered: p.sessionsCovered,
          paymentDate: p.paymentDate,
          status: p.status,
          invoiceNumber: p.invoiceNumber,
          notes: p.notes,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get student payments error:', error);
      throw error;
    }
  }

  async recordStudentPayment(data: {
    studentId: number;
    classId: number;
    courseId: number;
    type: 'tuition' | 'books';
    amount: number;
    sessionsCovered?: number;
    paymentDate?: Date;
    notes?: string;
    recordedBy?: number;
  }) {
    try {
      // Validate required associations
      if (!data.classId || !data.courseId) {
        throw new Error('Class ID and Course ID are required for payments');
      }

      // Get next invoice number
      const invoiceResult = await db.select({ maxInvoice: sql`MAX(CAST(SUBSTRING(invoice_number FROM 14) AS INTEGER))` })
        .from(studentPayments);
      const nextSequence = (invoiceResult[0]?.maxInvoice || 0) + 1;
      const invoiceNumber = generateInvoiceNumber(nextSequence);

      const [payment] = await db.insert(studentPayments)
        .values({
          studentId: data.studentId,
          classId: data.classId,
          courseId: data.courseId,
          paymentType: data.type,
          amount: data.amount.toString(),
          sessionsCovered: data.sessionsCovered || null,
          paymentDate: data.paymentDate ? data.paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: data.notes || null,
          recordedBy: data.recordedBy || null,
          invoiceNumber,
        })
        .returning();

      return {
        id: payment.publicId,
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        message: 'Payment recorded successfully',
      };
    } catch (error) {
      logger.error('Record student payment error:', error);
      throw error;
    }
  }

  async getPendingStudentPayments() {
    try {
      // Get students with overdue payments (8+ sessions completed, no payment)
      const result = await db.execute(sql`
        SELECT 
          s.id as student_id,
          s.public_id as student_public_id,
          s.full_name,
          s.parent_name,
          s.parent_phone,
          s.class_id,
          c.name as class_name,
          COUNT(DISTINCT ses.id) as sessions_completed,
          COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) as sessions_paid,
          COUNT(DISTINCT ses.id) - COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) as sessions_due
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sessions ses ON s.class_id = ses.class_id AND ses.completed = true
        LEFT JOIN student_payments sp ON s.id = sp.student_id AND sp.status = 'paid'
        WHERE s.is_active = true
        GROUP BY s.id, s.public_id, s.full_name, s.parent_name, s.parent_phone, s.class_id, c.name
        HAVING COUNT(DISTINCT ses.id) - COALESCE(SUM(CASE WHEN sp.payment_type = 'tuition' THEN sp.sessions_covered ELSE 0 END), 0) >= 8
      `);

      return {
        data: result.rows.map((row: any) => ({
          studentId: row.student_public_id,
          fullName: row.full_name,
          parentName: row.parent_name,
          parentPhone: row.parent_phone,
          className: row.class_name,
          sessionsCompleted: parseInt(row.sessions_completed),
          sessionsPaid: parseInt(row.sessions_paid),
          sessionsDue: parseInt(row.sessions_due),
        })),
      };
    } catch (error) {
      logger.error('Get pending payments error:', error);
      throw error;
    }
  }

  // Teacher Payments
  async getTeacherPayments(params: {
    page?: number;
    limit?: number;
    teacherId?: number;
    classId?: number;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      let whereClause = undefined;

      if (params.teacherId) {
        whereClause = eq(teacherPayments.teacherId, params.teacherId);
      }

      if (params.classId) {
        whereClause = whereClause
          ? and(whereClause, eq(teacherPayments.classId, params.classId))
          : eq(teacherPayments.classId, params.classId);
      }

      const [data, totalResult] = await Promise.all([
        db.query.teacherPayments.findMany({
          where: whereClause,
          with: {
            teacher: true,
            class: true,
          },
          limit,
          offset,
          orderBy: desc(teacherPayments.paymentDate),
        }),
        db.select({ count: count() }).from(teacherPayments).where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        data: data.map(p => ({
          id: p.publicId,
          teacher: p.teacher ? { id: p.teacher.publicId, fullName: p.teacher.fullName } : null,
          class: p.class ? { id: p.class.publicId, name: p.class.name } : null,
          amount: p.amount,
          sessionsCovered: p.sessionsCovered,
          paymentDate: p.paymentDate,
          notes: p.notes,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get teacher payments error:', error);
      throw error;
    }
  }

  async recordTeacherPayment(data: {
    teacherId: number;
    classId: number;
    amount: number;
    sessionsCovered: number;
    paymentDate?: Date;
    notes?: string;
    recordedBy?: number;
  }) {
    try {
      const [payment] = await db.insert(teacherPayments)
        .values({
          teacherId: data.teacherId,
          classId: data.classId,
          amount: data.amount.toString(),
          sessionsCovered: data.sessionsCovered,
          paymentDate: data.paymentDate ? data.paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: data.notes || null,
          recordedBy: data.recordedBy || null,
        })
        .returning();

      return {
        id: payment.publicId,
        amount: payment.amount,
        message: 'Teacher payment recorded successfully',
      };
    } catch (error) {
      logger.error('Record teacher payment error:', error);
      throw error;
    }
  }

  // Expenses
  async getExpenses(params: {
    page?: number;
    limit?: number;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      let whereClause = undefined;

      if (params.category) {
        whereClause = eq(expenses.category, params.category);
      }

      if (params.startDate) {
        const startDateStr = params.startDate.toISOString().split('T')[0];
        whereClause = whereClause
          ? and(whereClause, gte(expenses.expenseDate, startDateStr))
          : gte(expenses.expenseDate, startDateStr);
      }

      if (params.endDate) {
        const endDateStr = params.endDate.toISOString().split('T')[0];
        whereClause = whereClause
          ? and(whereClause, lte(expenses.expenseDate, endDateStr))
          : lte(expenses.expenseDate, endDateStr);
      }

      const [data, totalResult] = await Promise.all([
        db.query.expenses.findMany({
          where: whereClause,
          limit,
          offset,
          orderBy: desc(expenses.expenseDate),
        }),
        db.select({ count: count() }).from(expenses).where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        data: data.map(e => ({
          id: e.publicId,
          category: e.category,
          amount: e.amount,
          expenseDate: e.expenseDate,
          description: e.description,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get expenses error:', error);
      throw error;
    }
  }

  async recordExpense(data: {
    category: string;
    amount: number;
    expenseDate?: Date;
    description?: string;
    recordedBy?: number;
  }) {
    try {
      const [expense] = await db.insert(expenses)
        .values({
          category: data.category,
          amount: data.amount.toString(),
          expenseDate: data.expenseDate ? data.expenseDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          description: data.description || null,
          recordedBy: data.recordedBy || null,
        })
        .returning();

      return {
        id: expense.publicId,
        amount: expense.amount,
        message: 'Expense recorded successfully',
      };
    } catch (error) {
      logger.error('Record expense error:', error);
      throw error;
    }
  }

  async deleteExpense(publicId: string) {
    try {
      await db.delete(expenses)
        .where(eq(expenses.publicId, publicId));

      return { message: 'Expense deleted successfully' };
    } catch (error) {
      logger.error('Delete expense error:', error);
      throw error;
    }
  }

  // Settle pending student payment
  async settleStudentPayment(data: {
    paymentPublicId: string;
    recordedBy?: number;
    notes?: string;
  }) {
    try {
      const payment = await db.query.studentPayments.findFirst({
        where: eq(studentPayments.publicId, data.paymentPublicId),
        with: {
          student: true,
          class: true,
          course: true,
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();

      // Update payment status to paid
      const [updated] = await db.update(studentPayments)
        .set({
          status: 'paid',
          invoiceNumber,
          recordedBy: data.recordedBy || null,
          notes: data.notes 
            ? `${payment.notes || ''}\nSettlement: ${data.notes}`.trim()
            : payment.notes,
          updatedAt: new Date(),
        })
        .where(eq(studentPayments.id, payment.id))
        .returning();

      return {
        id: updated.publicId,
        invoiceNumber: updated.invoiceNumber,
        amount: updated.amount,
        student: payment.student?.fullName,
        message: 'Payment settled successfully',
      };
    } catch (error) {
      logger.error('Settle student payment error:', error);
      throw error;
    }
  }

  // Settle pending teacher payment
  async settleTeacherPayment(data: {
    paymentPublicId: string;
    recordedBy?: number;
    notes?: string;
  }) {
    try {
      const payment = await db.query.teacherPayments.findFirst({
        where: eq(teacherPayments.publicId, data.paymentPublicId),
        with: {
          teacher: true,
          class: true,
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      // Update payment status to paid
      const [updated] = await db.update(teacherPayments)
        .set({
          status: 'paid',
          recordedBy: data.recordedBy || null,
          notes: data.notes
            ? `${payment.notes || ''}\nSettlement: ${data.notes}`.trim()
            : payment.notes,
          updatedAt: new Date(),
        })
        .where(eq(teacherPayments.id, payment.id))
        .returning();

      return {
        id: updated.publicId,
        amount: updated.amount,
        teacher: payment.teacher?.fullName,
        class: payment.class?.name,
        message: 'Teacher payment settled successfully',
      };
    } catch (error) {
      logger.error('Settle teacher payment error:', error);
      throw error;
    }
  }

  // Get pending student payments (for the payments page)
  async getPendingStudentPayments() {
    try {
      const pendingPayments = await db.query.studentPayments.findMany({
        where: eq(studentPayments.status, 'pending'),
        with: {
          student: true,
          class: true,
          course: true,
        },
        orderBy: [desc(studentPayments.createdAt)],
      });

      return {
        data: pendingPayments.map(p => ({
          id: p.publicId,
          student: p.student ? { id: p.student.publicId, fullName: p.student.fullName } : null,
          class: p.class ? { id: p.class.publicId, name: p.class.name } : null,
          course: p.course ? { id: p.course.publicId, name: p.course.name } : null,
          type: p.paymentType,
          amount: p.amount,
          sessionsCovered: p.sessionsCovered,
          autoGenerated: p.autoGenerated,
          cycleNumber: p.cycleNumber,
          createdAt: p.createdAt,
          notes: p.notes,
        })),
      };
    } catch (error) {
      logger.error('Get pending student payments error:', error);
      throw error;
    }
  }

  // Get pending teacher payments
  async getPendingTeacherPayments() {
    try {
      const pendingPayments = await db.query.teacherPayments.findMany({
        where: eq(teacherPayments.status, 'pending'),
        with: {
          teacher: true,
          class: true,
        },
        orderBy: [desc(teacherPayments.createdAt)],
      });

      return {
        data: pendingPayments.map(p => ({
          id: p.publicId,
          teacher: p.teacher ? { id: p.teacher.publicId, fullName: p.teacher.fullName } : null,
          class: p.class ? { id: p.class.publicId, name: p.class.name } : null,
          amount: p.amount,
          sessionsCovered: p.sessionsCovered,
          autoGenerated: p.autoGenerated,
          cycleNumber: p.cycleNumber,
          createdAt: p.createdAt,
          notes: p.notes,
        })),
      };
    } catch (error) {
      logger.error('Get pending teacher payments error:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();

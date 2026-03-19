import { db } from '../db';
import { students, studentEnrollments, studentPayments, classes, courses, courseLevels, sessions, books, enrollmentHistory } from '../db/schema';
import { eq, and, like, desc, sql, count } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class StudentService {
  async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: number;
    courseId?: number;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      let whereClause = eq(students.isActive, true);

      if (params.search) {
        whereClause = and(
          whereClause,
          like(students.fullName, `%${params.search}%`)
        ) as any;
      }

      if (params.classId) {
        whereClause = and(whereClause, eq(students.classId, params.classId)) as any;
      }

      const [data, totalResult] = await Promise.all([
        db.query.students.findMany({
          where: whereClause,
          with: {
            class: true,
            enrollments: {
              with: {
                course: true,
                currentLevel: true,
              },
            },
            payments: {
              orderBy: desc(studentPayments.paymentDate),
              limit: 1,
            },
          },
          limit,
          offset,
          orderBy: desc(students.createdAt),
        }),
        db.select({ count: count() }).from(students).where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      // Calculate payment status for each student
      const calculatePaymentStatus = (student: any): 'paid' | 'pending' | 'overdue' => {
        const latestPayment = student.payments?.[0];
        
        if (!latestPayment) {
          return 'pending';
        }

        if (latestPayment.status === 'overdue') {
          return 'overdue';
        }

        // Check if sessions covered are exhausted
        const now = new Date();
        const paymentDate = new Date(latestPayment.paymentDate);
        const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Rough estimation: if 7 days have passed per session covered
        const sessionsConsumed = Math.floor(daysSincePayment / 7);
        const remainingSessions = latestPayment.sessionsCovered - sessionsConsumed;

        if (remainingSessions <= 0) {
          return 'pending';
        }

        return 'paid';
      };

      return {
        data: data.map(s => ({
          id: s.publicId,
          fullName: s.fullName,
          age: s.age,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          address: s.address,
          emergencyContact: s.emergencyContact,
          class: s.class ? {
            id: s.class.publicId,
            name: s.class.name,
          } : null,
          course: s.enrollments?.[0]?.course ? {
            id: s.enrollments[0].course.publicId,
            name: s.enrollments[0].course.name,
          } : null,
          currentLevel: s.enrollments?.[0]?.currentLevel ? {
            id: s.enrollments[0].currentLevel.publicId,
            levelNumber: s.enrollments[0].currentLevel.levelNumber,
          } : null,
          enrollments: s.enrollments?.map(e => ({
            id: e.publicId,
            courseId: e.courseId,
            status: e.status,
          })) || [],
          paymentStatus: calculatePaymentStatus(s),
          createdAt: s.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all students error:', error);
      throw error;
    }
  }

  async getById(publicId: string) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, publicId),
        with: {
          class: {
            with: {
              teacher: true,
            },
          },
          enrollments: {
            with: {
              course: true,
              currentLevel: {
                with: {
                  books: true,
                },
              },
            },
          },
          payments: {
            orderBy: desc(studentPayments.paymentDate),
          },
        },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      return {
        id: student.publicId,
        fullName: student.fullName,
        age: student.age,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        address: student.address,
        emergencyContact: student.emergencyContact,
        class: student.class ? {
          id: student.class.publicId,
          name: student.class.name,
          teacher: student.class.teacher ? {
            id: student.class.teacher.publicId,
            fullName: student.class.teacher.fullName,
          } : null,
        } : null,
        enrollments: student.enrollments?.map(e => ({
          id: e.publicId,
          course: { 
            id: e.course.publicId, 
            name: e.course.name,
            sessionsPerMonth: e.course.sessionsPerMonth,
          },
          currentLevel: {
            id: e.currentLevel.publicId,
            number: e.currentLevel.levelNumber,
            books: e.currentLevel.books?.map(b => ({
              id: b.publicId,
              name: b.name,
              price: b.price,
            })),
          },
        })),
        payments: student.payments?.map(p => ({
          id: p.publicId,
          type: p.paymentType,
          amount: p.amount,
          sessionsCovered: p.sessionsCovered,
          paymentDate: p.paymentDate,
          status: p.status,
          invoiceNumber: p.invoiceNumber,
        })),
        isActive: student.isActive,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };
    } catch (error) {
      logger.error('Get student by id error:', error);
      throw error;
    }
  }

  async create(data: {
    fullName: string;
    age?: number;
    parentName: string;
    parentPhone: string;
    address: string;
    emergencyContact: string;
    classId?: number;
    enrollments?: { courseId: number; levelId: number }[];
  }) {
    try {
      const [student] = await db.insert(students)
        .values({
          fullName: data.fullName,
          age: data.age || null,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          address: data.address,
          emergencyContact: data.emergencyContact,
          classId: data.classId || null,
        })
        .returning();

      // Create enrollments if provided
      if (data.enrollments && data.enrollments.length > 0) {
        await db.insert(studentEnrollments).values(
          data.enrollments.map(e => ({
            studentId: student.id,
            courseId: e.courseId,
            currentLevelId: e.levelId,
          }))
        );
      }

      return {
        id: student.publicId,
        fullName: student.fullName,
        message: 'Student created successfully',
      };
    } catch (error) {
      logger.error('Create student error:', error);
      throw error;
    }
  }

  async update(publicId: string, data: Partial<{
    fullName: string;
    age: number;
    parentName: string;
    parentPhone: string;
    address: string;
    emergencyContact: string;
    classId: number;
  }>) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, publicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const [updated] = await db.update(students)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(students.id, student.id))
        .returning();

      return {
        id: updated.publicId,
        fullName: updated.fullName,
        message: 'Student updated successfully',
      };
    } catch (error) {
      logger.error('Update student error:', error);
      throw error;
    }
  }

  async delete(publicId: string) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, publicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      await db.update(students)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(students.id, student.id));

      return { message: 'Student deleted successfully' };
    } catch (error) {
      logger.error('Delete student error:', error);
      throw error;
    }
  }

  async enrollInCourse(studentPublicId: string, data: {
    courseId: number;
    levelId: number;
    classId: number;
  }) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, studentPublicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student already has an active enrollment
      const existingActiveEnrollment = await db.query.studentEnrollments.findFirst({
        where: and(
          eq(studentEnrollments.studentId, student.id),
          eq(studentEnrollments.status, 'active')
        ),
      });

      if (existingActiveEnrollment) {
        throw new Error('Student is already enrolled in a course. Please complete or drop the current course before enrolling in a new one.');
      }

      // Verify the class exists and belongs to the course/level
      const classData = await db.query.classes.findFirst({
        where: eq(classes.id, data.classId),
      });

      if (!classData) {
        throw new Error(`Class with ID ${data.classId} not found`);
      }

      if (classData.courseId !== data.courseId || classData.levelId !== data.levelId) {
        throw new Error('Class does not match the specified course and level');
      }

      // Check if student has already completed this course
      const previousEnrollment = await db.query.studentEnrollments.findFirst({
        where: and(
          eq(studentEnrollments.studentId, student.id),
          eq(studentEnrollments.courseId, data.courseId),
          eq(studentEnrollments.status, 'completed')
        ),
      });

      if (previousEnrollment) {
        throw new Error('Student has already completed this course');
      }

      const enrollment = await db.transaction(async (tx) => {
        // Update student's current class
        await tx.update(students)
          .set({ classId: data.classId, updatedAt: new Date() })
          .where(eq(students.id, student.id));

        // Create new enrollment
        const [newEnrollment] = await tx.insert(studentEnrollments).values({
          studentId: student.id,
          courseId: data.courseId,
          classId: data.classId,
          currentLevelId: data.levelId,
          status: 'active',
          enrollmentDate: new Date(),
        }).returning();

        if (!newEnrollment) {
          throw new Error('Failed to create enrollment');
        }

        // Generate book fee payment if books exist for this level
        const levelBooks = await tx.query.books.findMany({
          where: eq(books.levelId, data.levelId),
        });

        if (levelBooks && levelBooks.length > 0) {
          const totalBookPrice = levelBooks.reduce((sum, book) => {
            return sum + parseFloat(book.price || '0');
          }, 0);

          if (totalBookPrice > 0) {
            await tx.insert(studentPayments).values({
              studentId: student.id,
              classId: data.classId,
              courseId: data.courseId,
              paymentType: 'books',
              amount: totalBookPrice.toString(),
              status: 'pending',
              autoGenerated: true,
              notes: `رسوم كتب المستوى - ${levelBooks.map(b => b.name).join(', ')}`,
            });
            logger.info(`Generated book fee payment of ${totalBookPrice} for student ${student.id}, level ${data.levelId}`);
          }
        }

        return newEnrollment;
      });

      // Track initial enrollment in history (non-blocking)
      try {
        await db.insert(enrollmentHistory).values({
          enrollmentId: enrollment.id,
          previousClassId: null,
          newClassId: data.classId,
          previousLevelId: null,
          newLevelId: data.levelId,
          changeType: 'initial_enrollment',
          changeDate: new Date().toISOString().split('T')[0],
          notes: 'التسجيل الأولي في الكورس',
        });
      } catch (historyError) {
        logger.error('Failed to insert enrollment history record:', historyError);
      }

      return { 
        message: 'Enrolled successfully in course and class',
        enrollmentId: enrollment.publicId
      };
    } catch (error: any) {
      logger.error('Enroll student error:', error);
      throw error;
    }
  }

  async completeCourse(studentPublicId: string, enrollmentPublicId: string, data: {
    finalGrade?: string;
    notes?: string;
  }) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, studentPublicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const enrollment = await db.query.studentEnrollments.findFirst({
        where: eq(studentEnrollments.publicId, enrollmentPublicId),
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      if (enrollment.studentId !== student.id) {
        throw new Error('Enrollment does not belong to this student');
      }

      if (enrollment.status !== 'active') {
        throw new Error('Only active enrollments can be completed');
      }

      // Update enrollment to completed
      await db.update(studentEnrollments)
        .set({
          status: 'completed',
          completionDate: new Date(),
          finalGrade: data.finalGrade || null,
          notes: data.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(studentEnrollments.id, enrollment.id));

      // Clear student's current class
      await db.update(students)
        .set({ classId: null, updatedAt: new Date() })
        .where(eq(students.id, student.id));

      return { message: 'Course completed successfully' };
    } catch (error) {
      logger.error('Complete course error:', error);
      throw error;
    }
  }

  async dropCourse(studentPublicId: string, enrollmentPublicId: string, reason?: string) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, studentPublicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const enrollment = await db.query.studentEnrollments.findFirst({
        where: eq(studentEnrollments.publicId, enrollmentPublicId),
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      if (enrollment.studentId !== student.id) {
        throw new Error('Enrollment does not belong to this student');
      }

      if (enrollment.status !== 'active') {
        throw new Error('Only active enrollments can be dropped');
      }

      // Update enrollment to dropped
      await db.update(studentEnrollments)
        .set({
          status: 'dropped',
          notes: reason || 'Course dropped by student/admin',
          updatedAt: new Date(),
        })
        .where(eq(studentEnrollments.id, enrollment.id));

      // Clear student's current class
      await db.update(students)
        .set({ classId: null, updatedAt: new Date() })
        .where(eq(students.id, student.id));

      return { message: 'Course dropped successfully' };
    } catch (error) {
      logger.error('Drop course error:', error);
      throw error;
    }
  }

  async getCourseHistory(studentPublicId: string) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, studentPublicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const enrollments = await db.query.studentEnrollments.findMany({
        where: eq(studentEnrollments.studentId, student.id),
        with: {
          course: true,
          class: true,
          currentLevel: true,
          history: {
            with: {
              previousClass: true,
              newClass: true,
              previousLevel: true,
              newLevel: true,
            },
            orderBy: desc(enrollmentHistory.changeDate),
          },
        },
        orderBy: desc(studentEnrollments.createdAt),
      });

      return {
        studentId: student.publicId,
        studentName: student.fullName,
        history: enrollments.map(e => ({
          id: e.publicId,
          course: {
            id: e.course.publicId,
            name: e.course.name,
          },
          class: {
            id: e.class.publicId,
            name: e.class.name,
          },
          level: {
            id: e.currentLevel.publicId,
            levelNumber: e.currentLevel.levelNumber,
          },
          status: e.status,
          enrollmentDate: e.enrollmentDate,
          completionDate: e.completionDate,
          finalGrade: e.finalGrade,
          notes: e.notes,
          changes: e.history?.map(h => ({
            id: h.publicId,
            changeType: h.changeType,
            changeDate: h.changeDate,
            previousClass: h.previousClass ? {
              id: h.previousClass.publicId,
              name: h.previousClass.name,
            } : null,
            newClass: {
              id: h.newClass.publicId,
              name: h.newClass.name,
            },
            previousLevel: h.previousLevel ? {
              id: h.previousLevel.publicId,
              levelNumber: h.previousLevel.levelNumber,
            } : null,
            newLevel: {
              id: h.newLevel.publicId,
              levelNumber: h.newLevel.levelNumber,
            },
            notes: h.notes,
          })) || [],
        })),
      };
    } catch (error) {
      logger.error('Get course history error:', error);
      throw error;
    }
  }

  async changeClass(studentPublicId: string, enrollmentPublicId: string, newClassId: number, notes?: string) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, studentPublicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const enrollment = await db.query.studentEnrollments.findFirst({
        where: and(
          eq(studentEnrollments.publicId, enrollmentPublicId),
          eq(studentEnrollments.studentId, student.id),
          eq(studentEnrollments.status, 'active')
        ),
      });

      if (!enrollment) {
        throw new Error('Active enrollment not found');
      }

      const newClass = await db.query.classes.findFirst({
        where: eq(classes.id, newClassId),
      });

      if (!newClass) {
        throw new Error('New class not found');
      }

      // Update student's class
      await db.update(students)
        .set({ classId: newClassId, updatedAt: new Date() })
        .where(eq(students.id, student.id));

      // Update enrollment's class
      await db.update(studentEnrollments)
        .set({ classId: newClassId, updatedAt: new Date() })
        .where(eq(studentEnrollments.id, enrollment.id));

      // Track change in history
      await db.insert(enrollmentHistory).values({
        enrollmentId: enrollment.id,
        previousClassId: enrollment.classId,
        newClassId: newClassId,
        previousLevelId: enrollment.currentLevelId,
        newLevelId: enrollment.currentLevelId, // Same level, different class
        changeType: 'class_change',
        changeDate: new Date().toISOString().split('T')[0],
        notes: notes || 'تغيير الكلاس',
      });

      return { message: 'Class changed successfully' };
    } catch (error) {
      logger.error('Change class error:', error);
      throw error;
    }
  }

  async advanceLevel(studentPublicId: string, enrollmentPublicId: string, newLevelId: number, newClassId?: number, notes?: string) {
    try {
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, studentPublicId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const enrollment = await db.query.studentEnrollments.findFirst({
        where: and(
          eq(studentEnrollments.publicId, enrollmentPublicId),
          eq(studentEnrollments.studentId, student.id),
          eq(studentEnrollments.status, 'active')
        ),
      });

      if (!enrollment) {
        throw new Error('Active enrollment not found');
      }

      const previousLevelId = enrollment.currentLevelId;
      const previousClassId = enrollment.classId;
      const targetClassId = newClassId || enrollment.classId;

      // Verify new class belongs to the new level if provided
      if (newClassId) {
        const newClass = await db.query.classes.findFirst({
          where: eq(classes.id, newClassId),
        });
        if (!newClass || newClass.levelId !== newLevelId) {
          throw new Error('New class does not match the specified level');
        }
      }

      // Update student's class
      await db.update(students)
        .set({ classId: targetClassId, updatedAt: new Date() })
        .where(eq(students.id, student.id));

      // Update enrollment's level and class
      await db.update(studentEnrollments)
        .set({ 
          currentLevelId: newLevelId, 
          classId: targetClassId,
          updatedAt: new Date() 
        })
        .where(eq(studentEnrollments.id, enrollment.id));

      // Track change in history
      await db.insert(enrollmentHistory).values({
        enrollmentId: enrollment.id,
        previousClassId: previousClassId,
        newClassId: targetClassId,
        previousLevelId: previousLevelId,
        newLevelId: newLevelId,
        changeType: 'level_promotion',
        changeDate: new Date().toISOString().split('T')[0],
        notes: notes || 'الترقية إلى المستوى التالي',
      });

      // Generate book fee payment for new level
      const levelBooks = await db.query.books.findMany({
        where: eq(books.levelId, newLevelId),
      });

      if (levelBooks && levelBooks.length > 0) {
        const totalBookPrice = levelBooks.reduce((sum, book) => {
          return sum + parseFloat(book.price || '0');
        }, 0);

        if (totalBookPrice > 0) {
          await db.insert(studentPayments).values({
            studentId: student.id,
            classId: targetClassId,
            courseId: enrollment.courseId,
            paymentType: 'books',
            amount: totalBookPrice.toString(),
            status: 'pending',
            autoGenerated: true,
            notes: `رسوم كتب المستوى الجديد - ${levelBooks.map(b => b.name).join(', ')}`,
          });
          logger.info(`Generated book fee payment of ${totalBookPrice} for student ${student.id}, new level ${newLevelId}`);
        }
      }

      return { message: 'Level advanced successfully' };
    } catch (error) {
      logger.error('Advance level error:', error);
      throw error;
    }
  }
}

export const studentService = new StudentService();

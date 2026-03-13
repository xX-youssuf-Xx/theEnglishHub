# Learning Center Management System - Complete Requirements Document

## Overview

A web-based management system for a learning center that handles student enrollment, teacher payments, course management, and financial tracking. The system will be accessible on multiple devices with role-based access for administrators and assistants.

---

## Core Entities

### 1. Courses & Levels

- Each course contains multiple levels
- Each level has a defined duration (e.g., 4 months or 8 months)
- Each level requires its own set of books with defined prices
- Course descriptions and syllabi included
- Prerequisites between levels determined manually by admin

### 2. Students

- **Student information includes:**
    - Full name
    - Age
    - Parent name
    - Address
    - Phone number(s)
    - Emergency contact
    - Enrolled course(s) - can be enrolled in multiple courses simultaneously
    - Current level in each course
    - Assigned class
    - Payment status and history (tuition and books)
- No registration/enrollment fee

### 3. Classes

- A class is a specific instance where teaching occurs
- Students in the same class may be enrolled in different courses
- Each class has:
    - Assigned teacher
    - Enrolled students (unlimited capacity)
    - Session schedule with defined dates
    - Payment rate per teacher payment cycle (varies per class)
    - Session tracking (admin marks when a session occurs)
- Average of 2 sessions per week (but varies)

### 4. Teachers

- **Teacher information includes:**
    - Full name
    - Contact information
    - Classes taught
    - Payment terms per class
- A single teacher can teach multiple classes
- All payments are session-based (no fixed monthly salaries)
- Payment structure varies by class:
    - Some classes: paid every 4 sessions
    - Some classes: paid every 8 sessions
    - Payment amount varies per class
- Teacher gets paid even if session is cancelled

---

## Payment Structure

### Student Payments

- **Tuition:** Students pay every 8 sessions
- **Books:** Paid separately at the beginning of each level (with first tuition payment)
- Payment is based on sessions consumed (admin marks session completion)
- Students pay even if they miss sessions
- Payment method: Cash only (for now)
- No late payment penalties
- No discounts or refund policy
- Payment tracking categorized by:
    - Tuition fees
    - Book fees
    - Date received
    - Student name
    - Class
    - Course

### Teacher Payments

- Paid per payment cycle (not per session)
- Payment amount varies by class
- Payment timing: varies but generally immediate after completing cycle
- Payment frequency depends on the class (every 4 or 8 sessions)
- Teachers teaching multiple classes have staggered payment dates
- No tax/deduction tracking needed

### Book Management

- Center purchases/prints books and sells them to students
- Book costs tracked separately but aggregated in financial reports
- Books paid with first tuition payment of each level
- Only book prices tracked (no supplier tracking)

---

## Financial Management

### Income Tracking

- All student payments recorded and categorized:
    - Tuition fees
    - Book fees (separate tracking)
    - Date received
    - Student name
    - Class
    - Course
- Invoice generation for payments

### Expense Tracking

- Teacher payments (session-based)
- General expenses (various categories to be defined)
- Expense recording with details

### Monthly Profit Calculation

- **Formula:** Total Income (tuition + books) - Total Expenses (teacher payments + other expenses)
- Reports available for:
    - Calendar month view
    - Custom date range
- Visual charts and graphs for financial data
- Book fees aggregated into total income for analytics

---

## User Roles & Access

### Admin (Full Access)

- Complete access to all features
- All CRUD operations
- Full financial visibility
- System configuration

### Assistant (Limited Access)

- **Can perform:**
    - Data entry
    - Limited data lookup
    - Process payments
    - View student payment status (tuition and books)
    - View student schedule, assigned class, assigned teacher
    - Modify student/teacher information (with limitations)
- **Restrictions:**
    - Limited data access
    - Limited modification privileges
    - Cannot access full financial reports (only payment-related data)

### Teachers

- No system access

### Students/Parents

- No system access

---

## Key Features

### 1. Dashboard

- Overview metrics:
    - Total active students
    - Total active teachers
    - Pending payments (students)
    - Upcoming teacher payments
    - Monthly profit summary

### 2. Student Management

- Add/edit/delete students with full information
- View student profile:
    - Personal information (name, age, parent, address, contacts)
    - Enrolled courses (multiple possible)
    - Assigned class
    - Current level in each course
    - Payment history (tuition and books separately)
- Search and filter students
- Track which students paid books for current level

### 3. Teacher Management

- Add/edit/delete teachers
- View teacher profile:
    - Personal information
    - Classes assigned (multiple possible)
    - Payment history
    - Upcoming payment schedule
    - Payment amount per class
- Calculate payments based on completed sessions per class
- Different payment cycles (4 or 8 sessions) per class

### 4. Course & Level Management

- Create and manage courses
- Add course descriptions and syllabi
- Define levels within each course
- Set level duration (in months)
- Assign books to each level with prices
- Manually determine prerequisites between levels

### 5. Class Management

- Create classes
- Assign teachers to classes
- Enroll students in classes (same class, different courses possible)
- Set teacher payment rate per class
- Define teacher payment schedule (4 or 8 sessions) per class
- **Session Management:**
    - Create sessions with defined dates
    - Admin marks session as completed (tick system)
    - Track session count for payment calculations (both student and teacher)
    - Average 2 sessions per week (flexible)

### 6. Payment Management

- **Student Payments:**
    - Record tuition payments (every 8 sessions)
    - Record book payments (start of each level)
    - Mark payments as received/pending
    - Track payment by student, class, course, and date
    - Generate invoices
    - Payment history search and filtering
- **Teacher Payments:**
    - Automatic calculation based on completed sessions
    - Record teacher payments per class
    - Track payment cycles (4 or 8 sessions depending on class)
    - Payment history per teacher
- **General Expenses:**
    - Record other expenses
    - Categorize expenses
    - Expense history

### 7. Reporting & Analytics

- **Financial Reports:**
    - Monthly income vs expenses
    - Calendar month view
    - Custom date range
    - Income breakdown (tuition vs books)
    - Expense breakdown (teachers vs other)
    - Net profit/loss calculation
    - Visual charts and graphs
- **Payment Reports:**
    - Student payment status
    - Overdue payments
    - Teacher payment schedule
- **Enrollment Reports:**
    - Class enrollment
    - Course enrollment
    - Student distribution
- Export capabilities

### 8. System Settings

- User management (admin/assistant accounts)
- Role permissions configuration
- Assistant privilege customization
- Data backup and export
- Arabic language interface (primary)

---

## Student Registration Workflow

1. **Register Student**
    - Enter full student information (name, age, parent, address, contacts)
2. **Assign to Class**
    - Select class for student
3. **Assign Courses**
    - Assign one or multiple courses to student
4. **Initial Payment**
    - Student pays for books (level 1)
    - Student pays first tuition (8 sessions)
5. **Ongoing Cycle**
    - Admin marks sessions as completed
    - After 8 sessions consumed, student pays next tuition
    - When student advances to new level, pays for new books

---

## Technical Requirements

### Platform

- Web-based application
- Responsive design for multiple devices (desktop, tablet, mobile)
- Expected concurrent users: 10 or less (staff and admin only)
- No specific browser compatibility requirements
- No offline functionality needed

### Language & Currency

- Primary language: Arabic
- Possible future: English support
- Currency: Egyptian Pound (EGP) - no multi-currency needed

### Security

- User authentication and authorization
- Role-based access control
- Data backup and recovery
- Secure payment data storage

---

## Suggested Features for Future Phases

The following features have been identified for potential future implementation:

### Student & Academic Management

1. **Attendance Tracking** - Individual session attendance per student
2. **Grade/Assessment Tracking** - Student performance and test scores
3. **Student Performance Reports** - Academic progress reports
4. **Class Capacity Limits** - Maximum students per class enforcement
5. **Waiting List Functionality** - Queue management for full classes

### Teacher Management

6. **Teacher Availability/Scheduling** - Calendar and availability management
7. **Performance Evaluations** - Teacher assessment and ratings

### Financial Enhancements

8. **Discount Structures** - Sibling discounts, early payment bonuses, bulk discounts
9. **Refund Policy Management** - Handle refunds and cancellations
10. **Late Payment Penalties** - Automatic penalty calculation
11. **Multiple Payment Methods** - Bank transfer, credit card tracking
12. **Payment Reminders/Notifications** - Automated SMS/email reminders
13. **Additional Expense Categories** - Rent, utilities, marketing, supplies tracking
14. **Receipt/Invoice Documentation** - Enhanced documentation with attachments
15. **Automated Report Scheduling** - Scheduled report generation and delivery

### System Enhancements

16. **Notification System** - Overdue payment alerts, announcements
17. **Multi-language Support** - Full English language support
18. **Multi-currency Settings** - Support for multiple currencies
19. **Custom Report Formats** - Specialized report templates
20. **Dashboard Metrics** - Additional KPIs and analytics

---

## Summary

This system provides comprehensive management for:

- **Student lifecycle:** Registration → Class/Course assignment → Payment tracking → Level progression
- **Teacher management:** Assignment to classes → Session tracking → Automated payment calculation
- **Financial oversight:** Income tracking (tuition + books) → Expense management → Profit analysis
- **Administrative control:** Role-based access → Data entry → Reporting

The system prioritizes simplicity and core functionality, with a clear Arabic interface suitable for up to 10 concurrent administrative users.
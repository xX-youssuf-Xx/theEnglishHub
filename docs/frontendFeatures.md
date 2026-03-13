# Frontend Features - Learning Center Management System

## Technology Stack
- React with TypeScript
- Bun as package manager and build tool
- React Router for navigation
- Context API for state management
- React Query for server state management
- Recharts for data visualization
- React Hook Form for forms
- Zod for validation
- Tailwind CSS for styling
- i18next for internationalization (Arabic primary)
- Axios for HTTP requests

---

## Pages & Features

### 1. Authentication Pages

#### Login Page (`/login`)
- Features:
  - Username/email input
  - Password input with toggle visibility
  - Login form validation
  - Remember me option
  - Error handling with Arabic messages
  - Redirect to dashboard on success
  - Role-based redirect (admin vs assistant)

---

### 2. Dashboard (`/dashboard`)

**Layout:** Sidebar navigation + main content area

**Features:**
- Overview metrics cards:
  - Total active students (with trend indicator)
  - Total active teachers
  - Pending student payments count
  - Upcoming teacher payments (next 7 days)
  - Monthly profit summary with percentage change
- Quick action buttons:
  - Add new student
  - Record payment
  - Mark session complete
- Recent activity feed:
  - Latest payments received
  - Recent session completions
  - New student registrations
- Charts:
  - Monthly income vs expenses (bar chart)
  - Student enrollment trends (line chart)
  - Payment status distribution (pie chart)
- Alerts section:
  - Overdue payments
  - Upcoming teacher payments

---

### 3. Student Management

#### Student List Page (`/students`)
**Features:**
- Data table with pagination
- Search by name, phone, or parent name
- Filters:
  - By class
  - By course
  - By payment status (paid/pending)
  - By enrollment date range
- Sortable columns
- Export to Excel/PDF
- Bulk actions (for admin only)
- Quick view modal for student details

#### Add/Edit Student Page (`/students/new`, `/students/:id/edit`)
**Features:**
- Multi-step form wizard:
  - Step 1: Personal Information
    - Full name (Arabic)
    - Age
    - Parent/guardian name
    - Address
    - Phone numbers (multiple)
    - Emergency contact
  - Step 2: Enrollment
    - Select class (dropdown)
    - Assign courses (multi-select)
    - Set initial level for each course
  - Step 3: Initial Payment (optional)
    - Book fees for level 1
    - First tuition payment (8 sessions)
- Form validation with real-time feedback
- Auto-save draft functionality
- Confirmation modal before submit

#### Student Profile Page (`/students/:id`)
**Features:**
- Tabbed interface:
  - **Overview Tab:**
    - Personal information display
    - Assigned class and teacher
    - Current enrollment status
  - **Courses Tab:**
    - List of enrolled courses
    - Current level in each course
    - Progress indicators
    - Book payment status per level
  - **Payment History Tab:**
    - Chronological payment list
    - Filter by payment type (tuition/books)
    - Payment details modal
    - Invoice download
  - **Sessions Tab:**
    - Session attendance/completion tracking
    - Sessions completed count
    - Next payment due indicator
- Action buttons:
  - Edit student
  - Record payment
  - Change class
  - Advance to next level
- Print profile option

---

### 4. Teacher Management

#### Teacher List Page (`/teachers`)
**Features:**
- Data table with teacher information
- Search by name or phone
- Filter by assigned classes
- Show total classes per teacher
- Payment status indicator
- Quick stats:
  - Total sessions taught this month
  - Upcoming payment amount

#### Add/Edit Teacher Page (`/teachers/new`, `/teachers/:id/edit`)
**Features:**
- Form fields:
  - Full name
  - Contact information (phone, email)
  - Address (optional)
- Class assignment section:
  - Assign to existing classes
  - Set payment rate per class
  - Set payment cycle per class (4 or 8 sessions)
- Validation and error handling

#### Teacher Profile Page (`/teachers/:id`)
**Features:**
- Tabbed interface:
  - **Overview Tab:**
    - Personal information
    - Contact details
  - **Classes Tab:**
    - List of assigned classes
    - Payment rate per class
    - Payment cycle per class
    - Student count per class
  - **Payment History Tab:**
    - Historical payments list
    - Payment amount and date
    - Related class and session count
  - **Upcoming Payments Tab:**
    - Calculated upcoming payments
    - Sessions completed toward next payment
    - Estimated payment date
- Action buttons:
  - Edit teacher
  - Record payment
  - View class details

---

### 5. Course & Level Management

#### Course List Page (`/courses`)
**Features:**
- Grid or list view of all courses
- Search by course name
- Course cards showing:
  - Course name
  - Number of levels
  - Total enrolled students
  - Description preview
- Add new course button

#### Course Detail Page (`/courses/:id`)
**Features:**
- Course information section:
  - Name and description
  - Syllabus display
  - Total enrollment count
- Levels section:
  - List of all levels
  - Duration per level
  - Books assigned with prices
  - Prerequisites (manual assignment)
  - Student count per level
- Actions:
  - Edit course
  - Add new level
  - Edit level details
  - Manage prerequisites

#### Add/Edit Course Page (`/courses/new`, `/courses/:id/edit`)
**Features:**
- Course form:
  - Course name
  - Description (rich text editor)
  - Syllabus upload/display
- Level management:
  - Add multiple levels
  - Set duration for each level
  - Assign books with prices
  - Define prerequisites between levels
- Drag-and-drop level reordering
- Validation for required fields

---

### 6. Class Management

#### Class List Page (`/classes`)
**Features:**
- Table view of all classes
- Search by class name or teacher
- Filters:
  - By teacher
  - By schedule (day/time)
  - By student count
- Columns:
  - Class name
  - Assigned teacher
  - Student count
  - Schedule summary
  - Session completion rate
- Actions:
  - View details
  - Edit class
  - Manage sessions

#### Add/Edit Class Page (`/classes/new`, `/classes/:id/edit`)
**Features:**
- Form sections:
  - Class name
  - Assigned teacher (dropdown)
  - Teacher payment configuration:
    - Payment amount
    - Payment cycle (4 or 8 sessions)
  - Schedule:
    - Day of week
    - Time slot
    - Start date
- Student enrollment:
  - Multi-select students
  - Show enrolled courses per student
- Validation for teacher assignment conflicts

#### Class Detail Page (`/classes/:id`)
**Features:**
- Tabbed interface:
  - **Overview Tab:**
    - Class information
    - Teacher details
    - Schedule display
    - Payment configuration
  - **Students Tab:**
    - Enrolled students list
    - Course enrollment per student
    - Current level per student
    - Payment status indicators
    - Add/remove students
  - **Sessions Tab:**
    - Session calendar view
    - List view of all sessions
    - Mark session complete (checkbox/toggle)
    - Session notes
    - Auto-calculation of completed sessions
- Action buttons:
  - Edit class
  - Add new session
  - Generate report

---

### 7. Payment Management

#### Student Payments Page (`/payments/students`)
**Features:**
- Two tabs:
  - **Pending Payments:**
    - List of students with overdue payments
    - Filter by class, course, days overdue
    - Quick payment recording
    - Send reminder (future feature)
  - **Payment History:**
    - All student payments
    - Search by student name
    - Filter by date range, payment type, class
    - Export functionality
- Payment recording modal:
  - Select student
  - Payment type (tuition/books)
  - Amount (auto-filled based on course/level)
  - Date received
  - Notes
  - Generate invoice checkbox

#### Teacher Payments Page (`/payments/teachers`)
**Features (Admin Only):**
- Two tabs:
  - **Upcoming Payments:**
    - Calculated payments based on completed sessions
    - Filter by teacher, class
    - Payment amount preview
    - Mark as paid action
  - **Payment History:**
    - All teacher payments
    - Search and filter
    - Payment details
- Payment recording modal:
  - Select teacher
  - Select class
  - Auto-calculated amount
  - Sessions covered
  - Payment date
  - Notes

#### Expenses Page (`/payments/expenses`)
**Features (Admin Only):**
- Expense list with filters
- Add expense modal:
  - Category selection
  - Amount
  - Date
  - Description
  - Receipt upload (future)
- Expense categories management
- Monthly expense summary

---

### 8. Reports & Analytics

#### Financial Reports Page (`/reports/financial`)
**Features (Admin Only):**
- Date range selector
- Report type selection:
  - Monthly summary
  - Custom date range
- Visualizations:
  - Income vs Expenses (line/bar chart)
  - Income breakdown (tuition vs books) (pie chart)
  - Expense breakdown (teachers vs other) (pie chart)
  - Profit/loss trend (line chart)
- Data tables:
  - Detailed income list
  - Detailed expense list
  - Net profit calculation
- Export options:
  - PDF report
  - Excel export

#### Payment Reports Page (`/reports/payments`)
**Features:**
- Student payment status report:
  - Filter by class, course, payment status
  - Overdue payments list
  - Payment completion rate
- Teacher payment schedule:
  - Upcoming payments calendar
  - Payment history by teacher
- Export functionality

#### Enrollment Reports Page (`/reports/enrollment`)
**Features:**
- Enrollment statistics:
  - By course
  - By class
  - By level
- Student distribution charts
- Enrollment trends over time
- Export to Excel

---

### 9. System Settings

#### User Management Page (`/settings/users`)
**Features (Admin Only):**
- User list table:
  - Username
  - Role (admin/assistant)
  - Status (active/inactive)
  - Last login
- Add new user modal:
  - Username
  - Password
  - Role selection
  - Permissions (if custom)
- Edit user:
  - Change role
  - Reset password
  - Activate/deactivate
- Delete user (with confirmation)

#### Assistant Permissions Page (`/settings/permissions`)
**Features (Admin Only):**
- Toggle permissions for assistant role:
  - Can add/edit students
  - Can add/edit teachers
  - Can modify classes
  - Can view financial reports
  - Can record payments
  - Can delete records
- Save and apply changes

#### System Configuration (`/settings/system`)
**Features (Admin Only):**
- Language settings (Arabic/English toggle)
- Currency settings (EGP fixed for now)
- Date format preferences
- Backup settings:
  - Manual backup trigger
  - Auto-backup schedule
- Data export options

---

## Context & State Management

### AuthContext
**Purpose:** Manage authentication state and user session
**State:**
- Current user (id, username, role, permissions)
- Authentication token
- Login status
**Actions:**
- login(credentials)
- logout()
- refreshToken()
- checkPermission(permission)

### ThemeContext
**Purpose:** Manage UI theme and language
**State:**
- Language (ar/en)
- Theme mode (light/dark)
- Direction (RTL for Arabic)
**Actions:**
- setLanguage(lang)
- toggleTheme()

### NotificationContext
**Purpose:** Manage app-wide notifications
**State:**
- Notifications list
- Unread count
**Actions:**
- addNotification(message, type)
- dismissNotification(id)
- clearAll()

### DashboardContext
**Purpose:** Cache dashboard data
**State:**
- Dashboard metrics
- Recent activities
- Alerts
**Actions:**
- refreshDashboard()
- markAlertAsRead(id)

---

## Role-Based Rendering

### ProtectedRoute Component
**Purpose:** Route guard based on authentication and roles
**Props:**
- requiredRole?: 'admin' | 'assistant'
- fallback?: ReactNode

### Permission-Based Components

#### AdminOnly
```tsx
<AdminOnly>
  <SensitiveComponent />
</AdminOnly>
```
Renders children only if user is admin

#### PermissionGate
```tsx
<PermissionGate permissions={['view_financial_reports']}>
  <FinancialReport />
</PermissionGate>
```
Renders children only if user has required permissions

### UI Adaptations by Role

#### Admin View
- Full sidebar navigation
- All action buttons visible
- Delete confirmations with extra warnings
- Financial data fully visible
- Settings access

#### Assistant View
- Limited sidebar (hide sensitive items)
- Read-only or limited-edit modes
- Hide financial totals and reports
- Simplified action menus
- No delete actions
- View-only access to sensitive data

---

## Shared Components

### Layout Components
- **MainLayout:** Sidebar + Header + Content area
- **AuthLayout:** Centered form layout for login
- **PageHeader:** Title + breadcrumbs + action buttons

### Data Display Components
- **DataTable:** Sortable, filterable table with pagination
- **StatCard:** Metric display with trend indicator
- **ChartCard:** Chart wrapper with title and controls
- **StatusBadge:** Color-coded status indicators

### Form Components
- **FormInput:** Text input with validation
- **FormSelect:** Dropdown with search
- **FormMultiSelect:** Multi-selection dropdown
- **FormDatePicker:** Date selection
- **FormTextArea:** Multi-line text
- **FormCheckbox:** Boolean toggle
- **FormFileUpload:** File upload with preview

### Feedback Components
- **Toast:** Success/error notifications
- **Modal:** Dialog boxes for confirmations
- **LoadingSpinner:** Loading states
- **EmptyState:** No data display
- **ErrorBoundary:** Error handling

### Utility Components
- **SearchBar:** Global search input
- **FilterPanel:** Collapsible filter controls
- **ExportButton:** Export dropdown (PDF/Excel)
- **PrintButton:** Print functionality
- **DateRangePicker:** Date range selection

---

## Responsive Design Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md, lg)
- **Desktop:** > 1024px (xl, 2xl)

### Mobile Adaptations
- Collapsible sidebar (hamburger menu)
- Stacked form layouts
- Simplified tables (card view)
- Touch-friendly button sizes
- Bottom navigation for main sections

### Tablet Adaptations
- Condensed sidebar
- Two-column forms
- Horizontal scroll tables
- Optimized touch targets

---

## Forms Validation Rules

### Student Form
- Full name: Required, min 3 chars, Arabic support
- Age: Required, number, 3-100 range
- Parent name: Required, min 3 chars
- Address: Required, min 5 chars
- Phone: Required, valid phone format
- Emergency contact: Required

### Payment Form
- Amount: Required, positive number
- Date: Required, not future date
- Student/Teacher: Required selection
- Type: Required for students

### Class Form
- Name: Required, unique
- Teacher: Required selection
- Payment amount: Required, positive
- Payment cycle: Required (4 or 8)

---

## Internationalization (i18n)

### Supported Languages
- Arabic (ar) - Primary, RTL
- English (en) - Secondary, LTR (future)

### Translation Structure
```
locales/
  ar/
    common.json
    students.json
    teachers.json
    courses.json
    payments.json
    reports.json
    validation.json
  en/
    ...
```

### RTL Support
- CSS direction handling
- Icon flipping where needed
- Calendar and date picker adaptation
- Number formatting (Arabic numerals)

---

## Performance Optimizations

- React.memo for expensive components
- useMemo for calculations
- useCallback for event handlers
- Lazy loading for routes
- Image optimization
- Debounced search inputs
- Virtual scrolling for large lists
- Query caching with React Query

---

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management
- Error announcements
- Form field associations

---

## Future Enhancements

- Progressive Web App (PWA) support
- Offline mode with local storage
- Push notifications
- Dark mode toggle
- Advanced filtering with saved filters
- Bulk operations for all lists
- Advanced charts and visualizations
- Custom report builder
- Mobile app (React Native)

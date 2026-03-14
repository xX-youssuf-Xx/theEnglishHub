import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
} from "react-router-dom";
import { Toaster } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CalendarPage } from "@/pages/CalendarPage";
import { CoursesPage } from "@/pages/courses/CoursesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { PaymentsPage } from "@/pages/payments/PaymentsPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { StudentsPage } from "@/pages/students/StudentsPage";
import { TeachersPage } from "@/pages/teachers/TeachersPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<DashboardPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/students"
				element={
					<ProtectedRoute>
						<StudentsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/teachers"
				element={
					<ProtectedRoute>
						<TeachersPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/courses"
				element={
					<ProtectedRoute>
						<CoursesPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/calendar"
				element={
					<ProtectedRoute>
						<CalendarPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/payments"
				element={
					<ProtectedRoute>
						<PaymentsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/reports"
				element={
					<ProtectedRoute>
						<ReportsPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/settings"
				element={
					<ProtectedRoute>
						<SettingsPage />
					</ProtectedRoute>
				}
			/>
			<Route path="/" element={<Navigate to="/dashboard" replace />} />
			<Route path="*" element={<Navigate to="/dashboard" replace />} />
		</Routes>
	);
}

function App() {
	return (
		<TRPCProvider>
			<ThemeProvider>
				<AuthProvider>
					<Router>
						<AppRoutes />
						<Toaster
							position="top-center"
							richColors
							duration={3000}
							closeButton
						/>
					</Router>
				</AuthProvider>
			</ThemeProvider>
		</TRPCProvider>
	);
}

export default App;

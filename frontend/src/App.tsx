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
import { LogsPage } from "@/pages/logs/LogsPage";
import { PaymentsPage } from "@/pages/payments/PaymentsPage";
import { StudentsPage } from "@/pages/students/StudentsPage";
import { TeachersPage } from "@/pages/teachers/TeachersPage";
import { UsersPage } from "@/pages/users/UsersPage";

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

function AdminRoute({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();

	if (user?.role === "assistant") {
		return <Navigate to="/students" replace />;
	}

	return <>{children}</>;
}

function HomeRedirect() {
	const { user } = useAuth();
	return (
		<Navigate
			to={user?.role === "assistant" ? "/students" : "/dashboard"}
			replace
		/>
	);
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<AdminRoute>
							<DashboardPage />
						</AdminRoute>
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
						<AdminRoute>
							<TeachersPage />
						</AdminRoute>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/courses"
				element={
					<ProtectedRoute>
						<AdminRoute>
							<CoursesPage />
						</AdminRoute>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/calendar"
				element={
					<ProtectedRoute>
						<AdminRoute>
							<CalendarPage />
						</AdminRoute>
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
				path="/users"
				element={
					<ProtectedRoute>
						<AdminRoute>
							<UsersPage />
						</AdminRoute>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/logs"
				element={
					<ProtectedRoute>
						<AdminRoute>
							<LogsPage />
						</AdminRoute>
					</ProtectedRoute>
				}
			/>
			<Route path="/" element={<HomeRedirect />} />
			<Route path="*" element={<HomeRedirect />} />
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

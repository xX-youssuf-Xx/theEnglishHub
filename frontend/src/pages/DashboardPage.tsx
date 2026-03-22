import {
	AlertCircle,
	BarChart3,
	CalendarDays,
	CreditCard,
	DollarSign,
	GraduationCap,
	Loader2,
	Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	isLoading?: boolean;
}

function StatCard({
	title,
	value,
	icon,
	isLoading,
}: StatCardProps) {
	if (isLoading) {
		return (
			<Card className="hover-card-shadow transition-shadow">
				<CardContent className="p-6">
					<div className="flex items-center justify-center h-24">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="hover-card-shadow transition-shadow">
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<p className="text-sm font-medium text-text-muted">{title}</p>
						<p className="text-3xl font-bold text-text-heading">{value}</p>
					</div>
					<div className="p-3 bg-primary/10 rounded-lg">{icon}</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Colors for pie chart
const COLORS = ["#34D399", "#FBBF24", "#F87171"];

export function DashboardPage() {
	const navigate = useNavigate();
	const [selectedMonth, setSelectedMonth] = useState(() => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	});

	const {
		data: stats,
		isLoading: isLoadingStats,
		error,
	} = trpc.reports.getDashboardStats.useQuery({
		month: selectedMonth,
	});
	const { data: monthlyFinancialSummary, isLoading: isLoadingFinancialSummary } =
		trpc.reports.getMonthlyFinancialSummary.useQuery({
			month: selectedMonth,
		});

	const financialBreakdown = useMemo(
		() => [
			{
				name: "دخل الطلاب",
				value: monthlyFinancialSummary?.studentIncome || 0,
				color: "#34D399",
			},
			{
				name: "رواتب المعلمين",
				value: monthlyFinancialSummary?.teacherPaymentsCost || 0,
				color: "#60A5FA",
			},
			{
				name: "مصروفات تشغيلية",
				value: monthlyFinancialSummary?.operationalExpenses || 0,
				color: "#F87171",
			},
		],
		[monthlyFinancialSummary],
	);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-64 space-y-4">
				<AlertCircle className="w-12 h-12 text-error" />
				<p className="text-text-heading font-medium">
					حدث خطأ في تحميل البيانات
				</p>
				<p className="text-text-muted">{error.message}</p>
			</div>
		);
	}

	// Prepare payment status data for chart
	const paymentStatusData = paymentReport?.summary
		? [
				{ name: "مدفوع", value: paymentReport.summary.paid, color: COLORS[0] },
				{
					name: "معلق",
					value: paymentReport.summary.pending,
					color: COLORS[1],
				},
				{
					name: "متأخر",
					value: paymentReport.summary.overdue,
					color: COLORS[2],
				},
			].filter((item) => item.value > 0)
		: [];

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-text-heading">لوحة التحكم</h1>
					<p className="text-text-muted mt-1">نظرة عامة على أداء المركز</p>
				</div>
				<div className="flex gap-2 items-center">
					<div className="relative">
						<CalendarDays className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
						<Input
							type="month"
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(e.target.value)}
							className="pr-10 w-[180px]"
						/>
					</div>
					<Button className="gap-2" onClick={() => navigate("/payments")}>
						<CreditCard className="w-4 h-4" />
						تسجيل دفعة
					</Button>
				</div>
			</div>

			{/* Stats Grid - Connected to Backend */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
				<StatCard
					title="إجمالي الطلاب"
					value={stats?.totalActiveStudents ?? 0}
					isLoading={isLoadingStats}
					icon={<Users className="w-6 h-6 text-primary" />}
				/>
				<StatCard
					title="المعلمين"
					value={stats?.totalActiveTeachers ?? 0}
					isLoading={isLoadingStats}
					icon={<GraduationCap className="w-6 h-6 text-accent-cyan" />}
				/>
				<StatCard
					title="الدفعات المعلقة"
					value={stats?.pendingPaymentsCount ?? 0}
					isLoading={isLoadingStats}
					icon={<AlertCircle className="w-6 h-6 text-warning" />}
				/>
				<StatCard
					title="ملخص مالي"
					value={`${(monthlyFinancialSummary?.netProfit ?? 0).toLocaleString()} ج.م`}
					isLoading={isLoadingFinancialSummary}
					icon={<CreditCard className="w-6 h-6 text-accent-coral" />}
				/>
				<StatCard
					title="الربح الشهري"
					value={`${(monthlyFinancialSummary?.netProfit ?? 0).toLocaleString()} ج.م`}
					isLoading={isLoadingFinancialSummary}
					icon={<DollarSign className="w-6 h-6 text-success" />}
				/>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Payment Status Distribution */}
				<Card>
					<CardHeader>
						<CardTitle>ملخص مالي</CardTitle>
						<CardDescription>توزيع حالات المدفوعات بين الطلاب</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoadingFinancialSummary ? (
							<div className="flex items-center justify-center h-64">
								<Loader2 className="w-8 h-8 animate-spin text-primary" />
							</div>
						) : financialBreakdown.some((item) => item.value > 0) ? (
							<>
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={financialBreakdown.filter((item) => item.value > 0)}
												cx="50%"
												cy="50%"
												innerRadius={60}
												outerRadius={80}
												paddingAngle={5}
												dataKey="value"
											>
												{financialBreakdown
													.filter((item) => item.value > 0)
													.map((entry) => (
														<Cell key={entry.name} fill={entry.color} />
												))}
											</Pie>
											<Tooltip
												contentStyle={{
													backgroundColor: "#fff",
													border: "1px solid #E9E5F5",
													borderRadius: "8px",
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
								<div className="flex justify-center gap-6 mt-4">
									{financialBreakdown
										.filter((item) => item.value > 0)
										.map((item) => (
										<div key={item.name} className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: item.color }}
											/>
											<span className="text-sm text-text-body">
												{item.name} ({item.value})
											</span>
										</div>
									))}
								</div>
							</>
						) : (
							<div className="flex flex-col items-center justify-center h-64 text-text-muted">
								<BarChart3 className="w-12 h-12 mb-2 opacity-50" />
								<p>لا توجد بيانات للعرض</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Enrollment Overview */}
				<Card>
					<CardHeader>
						<CardTitle>ملخص التسجيلات</CardTitle>
						<CardDescription>نظرة عامة على التسجيلات الحالية</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between p-4 bg-background-page/50 rounded-lg">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
										<Users className="w-5 h-5 text-primary" />
									</div>
									<div>
										<p className="font-medium">إجمالي الطلاب النشطين</p>
										<p className="text-sm text-text-muted">طلاب مسجلين حالياً</p>
									</div>
								</div>
								<span className="text-2xl font-bold">
									{stats?.totalActiveStudents ?? 0}
								</span>
							</div>

							<div className="flex items-center justify-between p-4 bg-background-page/50 rounded-lg">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center">
										<GraduationCap className="w-5 h-5 text-accent-cyan" />
									</div>
									<div>
										<p className="font-medium">المعلمين النشطين</p>
										<p className="text-sm text-text-muted">
											معلمين يعملون حالياً
										</p>
									</div>
								</div>
								<span className="text-2xl font-bold">
									{stats?.totalActiveTeachers ?? 0}
								</span>
							</div>

							<div className="flex items-center justify-between p-4 bg-background-page/50 rounded-lg">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
										<DollarSign className="w-5 h-5 text-success" />
									</div>
									<div>
										<p className="font-medium">إجمالي الدخل الشهري</p>
										<p className="text-sm text-text-muted">
											صافي الربح للشهر المحدد
										</p>
									</div>
								</div>
								<span className="text-2xl font-bold">
									{(monthlyFinancialSummary?.netProfit ?? 0).toLocaleString()} ج.م
								</span>
							</div>

							<div className="flex items-center justify-between p-4 bg-background-page/50 rounded-lg">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
										<AlertCircle className="w-5 h-5 text-warning" />
									</div>
									<div>
										<p className="font-medium">الدفعات المعلقة</p>
										<p className="text-sm text-text-muted">
											طلاب لديهم دفعات معلقة
										</p>
									</div>
								</div>
								<span className="text-2xl font-bold">
									{stats?.pendingPaymentsCount ?? 0}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

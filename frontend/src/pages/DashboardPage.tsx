import { AlertCircle, BarChart3, CalendarDays, DollarSign } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";

export function DashboardPage() {
	const [selectedMonth, setSelectedMonth] = useState(() => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	});

	const currentMonth = useMemo(() => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	}, []);

	const monthOptions = useMemo(() => {
		const now = new Date();
		return Array.from({ length: 24 }).map((_, index) => {
			const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
			const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
			const label = date.toLocaleDateString("en-GB", {
				year: "numeric",
				month: "long",
			});
			return { value, label };
		});
	}, []);

	const { data: stats, isLoading: isLoadingStats, error } =
		trpc.reports.getDashboardStats.useQuery({
			month: currentMonth,
		});

	const { data: monthlyFinancialSummary, isLoading: isLoadingFinancialSummary } =
		trpc.reports.getMonthlyFinancialSummary.useQuery({
			month: selectedMonth,
		});

	const { data: pendingByCourse, isLoading: isLoadingPendingByCourse } =
		trpc.payments.getPendingPaymentsByCourse.useQuery();

	const {
		data: currentMonthFinancialSummary,
		isLoading: isLoadingCurrentMonthSummary,
	} = trpc.reports.getMonthlyFinancialSummary.useQuery({
		month: currentMonth,
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

	const totalPendingStudentPayments = useMemo(() => {
		return (pendingByCourse?.data || []).reduce((sum, course) => {
			return sum + (course.paymentCount || 0);
		}, 0);
	}, [pendingByCourse]);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-64 space-y-4">
				<AlertCircle className="w-12 h-12 text-error" />
				<p className="text-text-heading font-medium">حدث خطأ في تحميل البيانات</p>
				<p className="text-text-muted">{error.message}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-text-heading">لوحة التحكم</h1>
				<p className="text-text-muted mt-1">نظرة عامة على أداء المركز</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle>ملخص مالي</CardTitle>
								<CardDescription>
									توزيع مالي للشهر المختار
								</CardDescription>
							</div>
							<div className="relative">
								<CalendarDays className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted z-10" />
								<Select value={selectedMonth} onValueChange={setSelectedMonth}>
									<SelectTrigger className="pr-10 w-[220px]">
										<SelectValue placeholder="اختر الشهر" />
									</SelectTrigger>
									<SelectContent>
										{monthOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingFinancialSummary ? (
							<div className="flex items-center justify-center h-64">
								<BarChart3 className="w-8 h-8 animate-pulse text-primary" />
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

				<Card>
					<CardHeader>
						<CardTitle>إجمالي الدخل الشهري</CardTitle>
						<CardDescription>صافي الربح للشهر الحالي</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between p-4 bg-background-page/50 rounded-lg">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
									<DollarSign className="w-5 h-5 text-success" />
								</div>
								<div>
									<p className="font-medium">صافي الربح للشهر الحالي</p>
									<p className="text-sm text-text-muted">
										يتم احتسابه من الدخل ناقص المصروفات
									</p>
								</div>
							</div>
							<span className="text-2xl font-bold">
								{isLoadingCurrentMonthSummary
									? "..."
									: `${(currentMonthFinancialSummary?.netProfit ?? 0).toLocaleString()} ج.م`}
							</span>
						</div>

						<div className="flex items-center justify-between p-4 bg-background-page/50 rounded-lg mt-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
									<AlertCircle className="w-5 h-5 text-warning" />
								</div>
								<div>
									<p className="font-medium">دفعات طلاب معلقة</p>
									<p className="text-sm text-text-muted">
										عدد الطلاب الذين لديهم دفعات طلاب معلقة فقط
									</p>
								</div>
							</div>
							<span className="text-2xl font-bold">
								{isLoadingPendingByCourse ? "..." : totalPendingStudentPayments}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

import { Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function LogsPage() {
	const { data, isLoading } = trpc.audit.getLogs.useQuery({ page: 1, limit: 50 });

	return (
		<div className="space-y-6" dir="rtl">
			<div>
				<h1 className="text-3xl font-bold text-text-heading">سجل العمليات</h1>
				<p className="text-text-muted mt-1">تتبع إجراءات المدراء والمساعدين</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="w-5 h-5" />
						آخر العمليات
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center h-40">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : (data?.data?.length ?? 0) === 0 ? (
						<div className="text-center py-8 text-text-muted">لا توجد سجلات حالياً</div>
					) : (
						<div className="space-y-3">
							{data?.data.map((log) => (
								<div key={log.id} className="rounded-lg border p-3 bg-muted/30">
									<div className="flex items-center justify-between">
										<p className="font-medium">{log.action}</p>
										<p className="text-xs text-text-muted">
											{new Date(log.createdAt).toLocaleString("ar-EG")}
										</p>
									</div>
									<p className="text-sm text-text-muted mt-1">
										{log.user?.username || "مستخدم غير معروف"} - {log.entityType}
									</p>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

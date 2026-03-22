import { Activity, Laptop, Loader2, ShieldCheck, User2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

function formatAction(action: string) {
	return action
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatDateTimeEnglish(dateLike: string | Date) {
	const date = new Date(dateLike);
	const datePart = date.toLocaleDateString("en-GB", {
		year: "numeric",
		month: "short",
		day: "2-digit",
	});
	const timePart = date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
	return `${datePart} ${timePart}`;
}

export function LogsPage() {
	const [query, setQuery] = useState("");
	const [actionFilter, setActionFilter] = useState("all");

	const { data, isLoading } = trpc.audit.getLogs.useQuery({
		page: 1,
		limit: 100,
		action: actionFilter === "all" ? undefined : actionFilter,
	});

	const logs = useMemo(() => {
		const source = data?.data || [];
		if (!query.trim()) return source;
		const q = query.toLowerCase();
		return source.filter((log) => {
			const haystack = [
				log.action,
				log.entityType,
				log.user?.username,
				log.user?.role,
				JSON.stringify(log.newValues || {}),
				log.ipAddress || "",
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(q);
		});
	}, [data?.data, query]);

	const actions = useMemo(() => {
		const set = new Set<string>();
		for (const item of data?.data || []) {
			set.add(item.action);
		}
		return Array.from(set).sort();
	}, [data?.data]);

	return (
		<div className="space-y-6" dir="rtl">
			<div>
				<h1 className="text-3xl font-bold text-text-heading">سجل العمليات</h1>
				<p className="text-text-muted mt-1">تتبع إجراءات المدراء والمساعدين</p>
			</div>

			<Card>
				<CardContent className="p-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="بحث في اسم المستخدم، الإجراء، التفاصيل، الـ IP..."
						/>
						<Select value={actionFilter} onValueChange={setActionFilter}>
							<SelectTrigger>
								<SelectValue placeholder="فلترة بالإجراء" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">كل الإجراءات</SelectItem>
								{actions.map((action) => (
									<SelectItem key={action} value={action}>
										{formatAction(action)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

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
					) : logs.length === 0 ? (
						<div className="text-center py-8 text-text-muted">لا توجد سجلات حالياً</div>
					) : (
						<div className="space-y-3">
							{logs.map((log) => (
								<div key={log.id} className="rounded-xl border p-4 bg-muted/20">
									<div className="flex items-start justify-between gap-3">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-xs">
													{formatAction(log.action)}
												</Badge>
												<Badge variant="secondary" className="text-xs">
													{log.entityType}
												</Badge>
											</div>
											<p className="text-xs text-text-muted">
												{formatDateTimeEnglish(log.createdAt)}
											</p>
										</div>
										<div className="text-left text-xs text-text-muted">
											ID: {log.id}
										</div>
									</div>

									<div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
										<div className="rounded-lg border p-2 bg-background-card/50 flex items-center gap-2">
											<User2 className="w-4 h-4 text-text-muted" />
											<span>
												{log.user?.username || "Unknown"} ({log.user?.role || "-"})
											</span>
										</div>
										<div className="rounded-lg border p-2 bg-background-card/50 flex items-center gap-2">
											<ShieldCheck className="w-4 h-4 text-text-muted" />
											<span>IP: {log.ipAddress || "-"}</span>
										</div>
										<div className="rounded-lg border p-2 bg-background-card/50 flex items-center gap-2">
											<Laptop className="w-4 h-4 text-text-muted" />
											<span className="truncate">{log.userAgent || "-"}</span>
										</div>
									</div>

									{log.newValues && (
										<pre className="mt-3 rounded-lg bg-background-page border p-2 text-xs overflow-x-auto text-left" dir="ltr">
											{JSON.stringify(log.newValues, null, 2)}
										</pre>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

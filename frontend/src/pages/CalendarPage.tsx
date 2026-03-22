import {
	addDays,
	addHours,
	addWeeks,
	endOfWeek,
	format,
	isSameDay,
	startOfDay,
	startOfWeek,
} from "date-fns";
import { ar } from "date-fns/locale";
import {
	Calendar as CalendarIcon,
	Check,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	Loader2,
	MoreVertical,
	RefreshCw,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

const daysOfWeek = [
	"الأحد",
	"الإثنين",
	"الثلاثاء",
	"الأربعاء",
	"الخميس",
	"الجمعة",
	"السبت",
];
const hours = Array.from({ length: 14 }, (_, i) => i + 8);

interface Session {
	id: string;
	classId: string;
	sessionDate: string;
	startTime: string;
	endTime: string;
	status: "scheduled" | "completed" | "cancelled";
	class?: {
		name: string;
		course: string;
	};
	teacher?: {
		fullName: string;
	};
	attendanceCount: number;
	totalStudents: number;
	monthlyStats?: {
		completed: number;
		total: number;
	};
}

export function CalendarPage() {
	const [currentWeek, setCurrentWeek] = useState(new Date());
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);
	const [selectedSlotSessions, setSelectedSlotSessions] = useState<
		Session[] | null
	>(null);

	const startOfCurrentWeek = startOfWeek(currentWeek, { weekStartsOn: 0 });
	const endOfCurrentWeek = endOfWeek(currentWeek, { weekStartsOn: 0 });

	const utils = trpc.useUtils();

	const { data: schedule, isLoading } =
		trpc.sessions.getWeeklySchedule.useQuery({
			startDate: startOfCurrentWeek.toISOString(),
			endDate: endOfCurrentWeek.toISOString(),
		});

	const { data: sessionDetails, isLoading: isLoadingDetails } =
		trpc.sessions.getSessionDetails.useQuery(selectedSessionId || "", {
			enabled: !!selectedSessionId,
		});

	const markCompleteMutation = trpc.sessions.markComplete.useMutation({
		onSuccess: () => {
			toast.success("تم تحديد الحصة كمكتملة");
			utils.sessions.getWeeklySchedule.invalidate();
			setSelectedSessionId(null);
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const generateSessionsMutation =
		trpc.sessions.generateSessionsForAllClasses.useMutation({
			onSuccess: (data) => {
				toast.success(`تم إنشاء ${data.totalSessionsCreated} حصة جديدة`);
				utils.sessions.getWeeklySchedule.invalidate();
			},
			onError: (err) => {
				toast.error(err.message);
			},
		});

	const handlePreviousWeek = () => {
		setCurrentWeek(addWeeks(currentWeek, -1));
	};

	const handleNextWeek = () => {
		setCurrentWeek(addWeeks(currentWeek, 1));
	};

	const handleToday = () => {
		const today = new Date();
		setCurrentWeek(today);
	};

	const handleMarkComplete = (sessionId: string) => {
		markCompleteMutation.mutate({ sessionId });
	};

	const handleGenerateSessions = () => {
		generateSessionsMutation.mutate();
	};

	const handleSessionClick = (sessionId: string, slotSessions: Session[]) => {
		if (slotSessions.length > 1) {
			setSelectedSlotSessions(slotSessions);
			return;
		}
		setSelectedSessionId(sessionId);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-500 text-white border-green-600";
			case "cancelled":
				return "bg-red-500 text-white border-red-600";
			default:
				return "bg-blue-500 text-white border-blue-600";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "completed":
				return "مكتملة";
			case "cancelled":
				return "ملغاة";
			default:
				return "مجدولة";
		}
	};

	const getSessionsForSlot = (dayIndex: number, hour: number): Session[] => {
		if (!schedule) return [];

		const daySchedule = schedule[dayIndex];
		if (!daySchedule?.sessions) return [];

		return daySchedule.sessions.filter((session: Session) => {
			if (!session.startTime) return false;
			const sessionHour = parseInt(session.startTime.split(":")[0], 10);
			return sessionHour === hour;
		});
	};

	const getMonthlyCompletion = (session: Session) =>
		session.monthlyStats || { completed: 0, total: 0 };

	const getSessionStyle = (session: Session) => {
		if (!session.startTime || !session.endTime) return {};

		const startParts = session.startTime.split(":");
		const endParts = session.endTime.split(":");

		const startHour = parseInt(startParts[0], 10);
		const startMinute = parseInt(startParts[1], 10);
		const endHour = parseInt(endParts[0], 10);
		const endMinute = parseInt(endParts[1], 10);

		const durationMinutes =
			(endHour - startHour) * 60 + (endMinute - startMinute);
		const topOffset = (startMinute / 60) * 100;
		const height = (durationMinutes / 60) * 100;

		return {
			top: `${topOffset}%`,
			height: `${height}%`,
		};
	};

	const weekDays = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
	}, [startOfCurrentWeek]);

	return (
		<div className="space-y-4" dir="rtl">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
				<div className="flex items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">التقويم</h1>
						<p className="text-gray-500 text-sm">جدول الحصص الأسبوعي</p>
					</div>
					<Button variant="outline" onClick={handleToday} className="gap-2">
						اليوم
					</Button>
				</div>

				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={handleGenerateSessions}
						disabled={generateSessionsMutation.isPending}
						className="gap-2"
					>
						{generateSessionsMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<RefreshCw className="w-4 h-4" />
						)}
						إنشاء حصص هذا الشهر
					</Button>

					<Button variant="outline" size="icon" onClick={handleNextWeek}>
						<ChevronRight className="w-4 h-4" />
					</Button>
					<div className="text-lg font-semibold min-w-[200px] text-center">
						{format(startOfCurrentWeek, "MMMM yyyy", { locale: ar })}
					</div>
					<Button variant="outline" size="icon" onClick={handlePreviousWeek}>
						<ChevronLeft className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* Calendar Grid */}
			<Card className="overflow-hidden">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center h-96">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="flex flex-col">
							{/* Days Header */}
							<div className="grid grid-cols-8 border-b bg-gray-50">
								<div className="p-3 text-center text-sm font-medium text-gray-500 border-l">
									GMT+2
								</div>
								{weekDays.map((day, index) => {
									const isToday = isSameDay(day, new Date());
									return (
										<div
											key={index}
											className={`p-3 text-center border-l last:border-l-0 ${
												isToday ? "bg-blue-50" : ""
											}`}
										>
											<div
												className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-600"}`}
											>
												{daysOfWeek[index]}
											</div>
											<div
												className={`text-lg font-bold mt-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}
											>
												{format(day, "d", { locale: ar })}
											</div>
										</div>
									);
								})}
							</div>

							{/* Time Grid */}
							<div
								className="overflow-auto"
								style={{ maxHeight: "calc(100vh - 300px)" }}
							>
								<div className="grid grid-cols-8 min-w-[800px]">
									{/* Time Column */}
									<div className="border-l bg-gray-50">
										{hours.map((hour) => (
											<div
												key={hour}
												className="h-16 border-b flex items-start justify-center pt-2 text-xs text-gray-500"
											>
												{format(addHours(startOfDay(new Date()), hour), "h a", {
													locale: ar,
												})}
											</div>
										))}
									</div>

									{/* Days Columns */}
									{weekDays.map((day, dayIndex) => {
										const isToday = isSameDay(day, new Date());
										return (
											<div
												key={dayIndex}
												className={`border-l last:border-l-0 relative ${isToday ? "bg-blue-50/30" : ""}`}
											>
												{hours.map((hour) => (
													<div
														key={hour}
														className="h-16 border-b relative group hover:bg-gray-50 transition-colors"
													>
														{(() => {
															const slotSessions = getSessionsForSlot(
																dayIndex,
																hour,
															);
															if (slotSessions.length === 0) return null;
															if (slotSessions.length > 1) {
																return (
																	<div
																		className="absolute inset-x-1 inset-y-1 rounded-md p-2 text-xs border shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-violet-500 text-white border-violet-600"
																		onClick={() =>
																			setSelectedSlotSessions(slotSessions)
																		}
																	>
																		<div className="font-semibold">
																			{slotSessions.length} حصص متداخلة
																		</div>
																		<div className="opacity-90">
																			اضغط لعرض التفاصيل
																		</div>
																	</div>
																);
															}

															return slotSessions.map((session: Session) => (
																<div
																	key={session.id}
																	onClick={() =>
																		handleSessionClick(session.id, slotSessions)
																	}
																	className={`absolute inset-x-1 rounded-md p-2 text-xs border shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${getStatusColor(session.status)}`}
																	style={getSessionStyle(session)}
																>
																	<div className="font-semibold truncate">
																		{session.class?.course}
																	</div>
																	<div className="truncate opacity-90">
																		{session.class?.name}
																	</div>
																	<div className="flex items-center gap-1 mt-1 opacity-80">
																		<Clock className="w-3 h-3" />
																		{session.startTime?.slice(0, 5)} -{" "}
																		{session.endTime?.slice(0, 5)}
																	</div>
																	{session.teacher && (
																		<div className="flex items-center gap-1 mt-1 opacity-80">
																			<Users className="w-3 h-3" />
																			{session.teacher.fullName}
																		</div>
																	)}
																	<div className="flex items-center gap-1 mt-1 opacity-80">
																		<CheckCircle className="w-3 h-3" />
																		{(() => {
																			const monthly =
																				getMonthlyCompletion(session);
																			return `${monthly.completed}/${monthly.total}`;
																		})()}
																	</div>

																	{session.status === "scheduled" && (
																		<DropdownMenu>
																			<DropdownMenuTrigger
																				asChild
																				onClick={(e) => e.stopPropagation()}
																			>
																				<Button
																					size="sm"
																					variant="ghost"
																					className="absolute top-1 left-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
																				>
																					<MoreVertical className="w-3 h-3" />
																				</Button>
																			</DropdownMenuTrigger>
																			<DropdownMenuContent
																				align="start"
																				side="bottom"
																				sideOffset={8}
																				className="min-w-[160px]"
																			>
																				<DropdownMenuItem
																					onClick={(e) => {
																						e.stopPropagation();
																						handleMarkComplete(session.id);
																					}}
																					className="flex justify-end gap-1.5"
																				>
																					<span>تحديد كمكتملة</span>
																					<CheckCircle className="w-4 h-4" />
																				</DropdownMenuItem>
																			</DropdownMenuContent>
																		</DropdownMenu>
																	)}
																</div>
															));
														})()}
													</div>
												))}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Legend */}
			<div className="flex items-center gap-4 text-sm bg-white p-3 rounded-lg shadow-sm border">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded bg-blue-500"></div>
					<span>مجدولة</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded bg-green-500"></div>
					<span>مكتملة</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded bg-red-500"></div>
					<span>ملغاة</span>
				</div>
			</div>

			{/* Session Details Dialog */}
			<Dialog
				open={!!selectedSessionId}
				onOpenChange={() => setSelectedSessionId(null)}
			>
				<DialogContent className="max-w-2xl" dir="rtl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<CalendarIcon className="w-5 h-5" />
							تفاصيل الحصة
						</DialogTitle>
						<DialogDescription>معلومات الحصة</DialogDescription>
					</DialogHeader>

					{isLoadingDetails ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : sessionDetails ? (
						<div className="space-y-6">
							{/* Session Info */}
							<div className="grid grid-cols-2 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">معلومات الحصة</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex justify-between">
											<span className="text-gray-500">التاريخ:</span>
											<span>
												{new Date(
													sessionDetails.sessionDate,
												).toLocaleDateString("ar-EG")}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">الوقت:</span>
											<span>
												{sessionDetails.startTime?.slice(0, 5)} -{" "}
												{sessionDetails.endTime?.slice(0, 5)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">الحالة:</span>
											<Badge className={getStatusColor(sessionDetails.status)}>
												{getStatusText(sessionDetails.status)}
											</Badge>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">معلومات الكلاس</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex justify-between">
											<span className="text-gray-500">الكلاس:</span>
											<span>{sessionDetails.class?.name}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">المستوى:</span>
											<span>مستوى {sessionDetails.class?.level}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">المعلم:</span>
											<span>
												{sessionDetails.class?.teacher?.fullName || "غير محدد"}
											</span>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Actions */}
							{sessionDetails.status === "scheduled" && (
								<Button
									onClick={() => handleMarkComplete(sessionDetails.id)}
									disabled={markCompleteMutation.isPending}
									className="w-full gap-2"
								>
									{markCompleteMutation.isPending ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<CheckCircle className="w-4 h-4" />
									)}
									تحديد كمكتملة
								</Button>
							)}
						</div>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!selectedSlotSessions}
				onOpenChange={() => setSelectedSlotSessions(null)}
			>
				<DialogContent className="max-w-xl" dir="rtl">
					<DialogHeader>
						<DialogTitle>الحصص في نفس التوقيت</DialogTitle>
						<DialogDescription>
							يمكنك فتح أي حصة أو تحديدها كمكتملة مباشرة
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 max-h-[60vh] overflow-y-auto">
						{selectedSlotSessions?.map((session) => (
							<div
								key={session.id}
								className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between gap-3"
							>
								<div>
									<p className="font-medium">
										{session.class?.course} - {session.class?.name}
									</p>
									<p className="text-sm text-text-muted">
										{session.startTime?.slice(0, 5)} -{" "}
										{session.endTime?.slice(0, 5)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSelectedSlotSessions(null);
											setSelectedSessionId(session.id);
										}}
									>
										عرض
									</Button>
									{session.status === "scheduled" && (
										<Button
											size="sm"
											onClick={() => handleMarkComplete(session.id)}
											disabled={markCompleteMutation.isPending}
											className="gap-1"
										>
											<Check className="w-3 h-3" />
											مكتملة
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

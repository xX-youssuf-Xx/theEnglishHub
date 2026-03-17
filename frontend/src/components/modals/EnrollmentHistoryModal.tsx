import { BookOpen, Calendar, GraduationCap, History, Loader2, MapPin, MoveRight, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";

interface EnrollmentHistoryModalProps {
	studentId: string | null;
	studentName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const changeTypeLabels: Record<string, string> = {
	initial_enrollment: "التسجيل الأولي",
	class_change: "تغيير الكلاس",
	level_promotion: "الترقية للمستوى التالي",
};

const changeTypeColors: Record<string, string> = {
	initial_enrollment: "bg-primary/10 text-primary",
	class_change: "bg-info/10 text-info",
	level_promotion: "bg-success/10 text-success",
};

const statusLabels: Record<string, string> = {
	active: "نشط",
	completed: "مكتمل",
	dropped: "منسحب",
};

const statusColors: Record<string, string> = {
	active: "bg-success/10 text-success",
	completed: "bg-primary/10 text-primary",
	dropped: "bg-destructive/10 text-destructive",
};

export function EnrollmentHistoryModal({
	studentId,
	studentName,
	open,
	onOpenChange,
}: EnrollmentHistoryModalProps) {
	const { data, isLoading } = trpc.students.getCourseHistory.useQuery(studentId || "", {
		enabled: !!studentId && open,
	});

	const history = data?.history || [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px] max-h-[80vh]" dir="rtl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<History className="w-6 h-6 text-primary" />
						سجل التسجيل - {studentName}
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center h-64">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : history.length === 0 ? (
					<div className="text-center py-8 text-text-muted">
						لا يوجد سجل تسجيل
					</div>
				) : (
					<ScrollArea className="h-[60vh] pr-4">
						<div className="space-y-6">
							{history.map((enrollment, index) => (
								<div
									key={enrollment.id}
									className="border rounded-lg p-4 space-y-4"
								>
									{/* Enrollment Header */}
									<div className="flex items-center justify-between border-b pb-3">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
												<BookOpen className="w-5 h-5 text-primary" />
											</div>
											<div>
												<h3 className="font-bold text-lg">
													{enrollment.course.name}
												</h3>
												<div className="flex items-center gap-2 text-sm text-text-muted">
													<Calendar className="w-4 h-4" />
													{new Date(enrollment.enrollmentDate).toLocaleDateString(
														"ar-EG"
													)}
												</div>
											</div>
										</div>
										<Badge className={statusColors[enrollment.status]}>
											{statusLabels[enrollment.status]}
										</Badge>
									</div>

									{/* Current Status */}
									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center gap-2">
											<MapPin className="w-4 h-4 text-text-muted" />
											<span className="text-sm text-text-muted">الكلاس:</span>
											<span className="font-medium">{enrollment.class.name}</span>
										</div>
										<div className="flex items-center gap-2">
											<GraduationCap className="w-4 h-4 text-text-muted" />
											<span className="text-sm text-text-muted">المستوى:</span>
											<span className="font-medium">
												مستوى {enrollment.level.levelNumber}
											</span>
										</div>
									</div>

									{/* Changes History */}
									{enrollment.changes && enrollment.changes.length > 0 && (
										<div className="space-y-3">
														<h4 className="font-medium text-sm text-text-muted flex items-center gap-2">
															<History className="w-4 h-4" />
															سجل التغييرات
														</h4>
											<div className="space-y-2">
												{enrollment.changes.map((change) => (
													<div
														key={change.id}
														className="bg-muted/50 rounded-lg p-3 space-y-2"
													>
														<div className="flex items-center justify-between">
															<Badge
																variant="outline"
																className={changeTypeColors[change.changeType]}
															>
																{changeTypeLabels[change.changeType]}
															</Badge>
															<span className="text-xs text-text-muted">
																{new Date(change.changeDate).toLocaleDateString("ar-EG")}
															</span>
														</div>

														<div className="flex items-center gap-4 text-sm">
															{change.previousClass && (
																<div className="flex items-center gap-1 text-text-muted">
																	<span>{change.previousClass.name}</span>
																</div>
															)}
															<MoveRight className="w-4 h-4 text-primary" />
															<div className="flex items-center gap-1 font-medium">
																<span>{change.newClass.name}</span>
															</div>
														</div>

														{change.previousLevel && (
															<div className="flex items-center gap-4 text-sm">
																<div className="flex items-center gap-1 text-text-muted">
																	<span>مستوى {change.previousLevel.levelNumber}</span>
																</div>
																<MoveRight className="w-4 h-4 text-primary" />
																<div className="flex items-center gap-1 font-medium">
																	<span>مستوى {change.newLevel.levelNumber}</span>
																</div>
															</div>
														)}

														{change.notes && (
															<p className="text-xs text-text-muted mt-2">
																{change.notes}
															</p>
														)}
													</div>
												))}
											</div>
										</div>
									)}

									{/* Completion Info */}
									{enrollment.status === "completed" && (
										<div className="border-t pt-3 mt-3">
											<div className="flex items-center justify-between text-sm">
												<span className="text-text-muted">تاريخ الإكمال:</span>
												<span>
													{enrollment.completionDate
														? new Date(enrollment.completionDate).toLocaleDateString("ar-EG")
														: "-"}
												</span>
											</div>
											{enrollment.finalGrade && (
												<div className="flex items-center justify-between text-sm mt-1">
													<span className="text-text-muted">التقدير النهائي:</span>
													<Badge variant="outline">{enrollment.finalGrade}</Badge>
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</DialogContent>
		</Dialog>
	);
}

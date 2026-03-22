import {
	BookOpen,
	Calendar,
	CheckCircle,
	GraduationCap,
	History,
	Loader2,
	MapPin,
	MoveLeft,
	Repeat,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

const changeTypeCardStyles: Record<string, string> = {
	initial_enrollment: "border-primary/20 bg-primary/5",
	class_change: "border-info/20 bg-info/5",
	level_promotion: "border-success/20 bg-success/5",
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
	const utils = trpc.useUtils();
	const [changeClassId, setChangeClassId] = useState("");
	const [nextLevelClassId, setNextLevelClassId] = useState("");

	const { data, isLoading } = trpc.students.getCourseHistory.useQuery(
		studentId || "",
		{
			enabled: !!studentId && open,
		},
	);

	const history = data?.history || [];
	const activeEnrollment = history.find((e) => e.status === "active") || null;

	const { data: levelsData } = trpc.courses.getLevels.useQuery(
		{ courseId: activeEnrollment?.course?.id || "" },
		{ enabled: !!activeEnrollment?.course?.id && open },
	);
	const levels = levelsData?.data || [];

	const _currentLevel = activeEnrollment
		? levels.find((l) => l.id === activeEnrollment.level.id)
		: null;
	const nextLevel = useMemo(() => {
		if (!activeEnrollment) return null;
		return (
			levels
				.filter((l) => l.levelNumber > activeEnrollment.level.levelNumber)
				.sort((a, b) => a.levelNumber - b.levelNumber)[0] || null
		);
	}, [activeEnrollment, levels]);

	const { data: sameLevelClassesData } =
		trpc.classes.getByCourseAndLevel.useQuery(
			{
				courseId: activeEnrollment?.course?.id || "",
				levelId: activeEnrollment?.level?.id || "",
			},
			{
				enabled:
					!!activeEnrollment?.course?.id &&
					!!activeEnrollment?.level?.id &&
					open,
			},
		);

	const { data: nextLevelClassesData } =
		trpc.classes.getByCourseAndLevel.useQuery(
			{
				courseId: activeEnrollment?.course?.id || "",
				levelId: nextLevel?.id || "",
			},
			{
				enabled: !!activeEnrollment?.course?.id && !!nextLevel?.id && open,
			},
		);

	const sameLevelClasses = (sameLevelClassesData?.data || []).filter(
		(c) => c.id !== activeEnrollment?.class?.id,
	);
	const nextLevelClasses = nextLevelClassesData?.data || [];

	const changeClassMutation = trpc.students.changeClass.useMutation({
		onSuccess: () => {
			toast.success("تم تغيير الكلاس بنجاح");
			setChangeClassId("");
			if (studentId) {
				utils.students.getCourseHistory.invalidate(studentId);
			}
			utils.students.getAll.invalidate();
		},
		onError: (err) => toast.error(err.message || "حدث خطأ أثناء تغيير الكلاس"),
	});

	const advanceLevelMutation = trpc.students.advanceLevel.useMutation({
		onSuccess: () => {
			toast.success("تم إنهاء المستوى والانتقال للمستوى التالي بنجاح");
			setNextLevelClassId("");
			if (studentId) {
				utils.students.getCourseHistory.invalidate(studentId);
			}
			utils.students.getAll.invalidate();
		},
		onError: (err) =>
			toast.error(err.message || "حدث خطأ أثناء إنهاء المستوى والانتقال"),
	});

	const completeCourseMutation = trpc.students.completeCourse.useMutation({
		onSuccess: () => {
			toast.success("تم إنهاء الكورس بنجاح، ويمكن تسجيل الطالب في كورس جديد");
			if (studentId) {
				utils.students.getCourseHistory.invalidate(studentId);
			}
			utils.students.getAll.invalidate();
		},
		onError: (err) => toast.error(err.message || "حدث خطأ أثناء إنهاء الكورس"),
	});

	const handleChangeClass = () => {
		if (!studentId || !activeEnrollment || !changeClassId) return;
		changeClassMutation.mutate({
			studentId,
			enrollmentId: activeEnrollment.id,
			newClassId: changeClassId,
			notes: "تغيير كلاس عبر سجل التسجيل",
		});
	};

	const handleFinishLevel = () => {
		if (!studentId || !activeEnrollment || !nextLevel || !nextLevelClassId)
			return;
		advanceLevelMutation.mutate({
			studentId,
			enrollmentId: activeEnrollment.id,
			newLevelId: nextLevel.id,
			newClassId: nextLevelClassId,
			notes: undefined,
		});
	};

	const handleFinishCourse = () => {
		if (!studentId || !activeEnrollment) return;
		completeCourseMutation.mutate({
			studentId,
			enrollmentId: activeEnrollment.id,
			notes: "إنهاء الكورس عند آخر مستوى",
		});
	};

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
					<div className="h-[60vh] overflow-y-auto pr-4">
						{activeEnrollment && (
							<div className="mb-4 border rounded-lg p-4 bg-primary/5 space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="font-semibold">إجراءات التسجيل النشط</h4>
									<Badge className="bg-success/10 text-success">نشط</Badge>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="space-y-2">
										<p className="text-sm font-medium">
											تغيير الكلاس (نفس المستوى)
										</p>
										<Select
											value={changeClassId}
											onValueChange={setChangeClassId}
										>
											<SelectTrigger>
												<SelectValue placeholder="اختر كلاس بديل" />
											</SelectTrigger>
											<SelectContent>
												{sameLevelClasses.map((cls) => (
													<SelectItem key={cls.id} value={cls.id}>
														{cls.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											type="button"
											variant="outline"
											onClick={handleChangeClass}
											disabled={!changeClassId || changeClassMutation.isPending}
											className="w-full gap-2"
										>
											<Repeat className="w-4 h-4" />
											تغيير الكلاس
										</Button>
									</div>

									<div className="space-y-2">
										<p className="text-sm font-medium">
											إنهاء المستوى والانتقال
										</p>
										{nextLevel ? (
											<>
												<Select
													value={nextLevelClassId}
													onValueChange={setNextLevelClassId}
												>
													<SelectTrigger>
														<SelectValue
															placeholder={`اختر كلاس المستوى ${nextLevel.levelNumber}`}
														/>
													</SelectTrigger>
													<SelectContent>
														{nextLevelClasses.map((cls) => (
															<SelectItem key={cls.id} value={cls.id}>
																{cls.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Button
													type="button"
													onClick={handleFinishLevel}
													disabled={
														!nextLevelClassId || advanceLevelMutation.isPending
													}
													className="w-full gap-2"
												>
													<CheckCircle className="w-4 h-4" />
													إنهاء المستوى
												</Button>
											</>
										) : (
											<div className="space-y-2">
												<p className="text-sm text-text-muted">
													لا يوجد مستوى أعلى متاح لهذا الكورس
												</p>
												<Button
													type="button"
													variant="secondary"
													onClick={handleFinishCourse}
													disabled={completeCourseMutation.isPending}
													className="w-full gap-2"
												>
													<CheckCircle className="w-4 h-4" />
													إنهاء الكورس (آخر مستوى)
												</Button>
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						<div className="space-y-6">
							{history.map((enrollment, _index) => (
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
													{new Date(
														enrollment.enrollmentDate,
													).toLocaleDateString("ar-EG")}
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
											<span className="font-medium">
												{enrollment.class.name}
											</span>
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
														className={`rounded-lg p-3 space-y-2 border ${changeTypeCardStyles[change.changeType] || "border-border bg-muted/50"}`}
													>
														<div className="flex items-center justify-between">
															<Badge
																variant="outline"
																className={changeTypeColors[change.changeType]}
															>
																{changeTypeLabels[change.changeType]}
															</Badge>
															<span className="text-xs text-text-muted">
																{new Date(change.changeDate).toLocaleDateString(
																	"ar-EG",
																)}
															</span>
														</div>

														<div
															className="flex items-center gap-2 text-sm justify-end"
															dir="rtl"
														>
															{change.previousClass ? (
																<>
																	<div className="flex items-center gap-1 font-medium">
																		<span>{change.newClass.name}</span>
																	</div>
																	<MoveLeft className="w-4 h-4 text-primary" />
																	<div className="flex items-center gap-1 text-text-muted">
																		<span>{change.previousClass.name}</span>
																	</div>
																</>
															) : (
																<div className="flex items-center gap-1 font-medium">
																	<span>{change.newClass.name}</span>
																</div>
															)}
														</div>

														{change.previousLevel && (
															<div
																className="flex items-center gap-2 text-sm justify-end"
																dir="rtl"
															>
																<div className="flex items-center gap-1 font-medium">
																	<span>
																		مستوى {change.newLevel.levelNumber}
																	</span>
																</div>
																<MoveLeft className="w-4 h-4 text-primary" />
																<div className="flex items-center gap-1 text-text-muted">
																	<span>
																		مستوى {change.previousLevel.levelNumber}
																	</span>
																</div>
															</div>
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
														? new Date(
																enrollment.completionDate,
															).toLocaleDateString("ar-EG")
														: "-"}
												</span>
											</div>
											{enrollment.finalGrade && (
												<div className="flex items-center justify-between text-sm mt-1">
													<span className="text-text-muted">
														التقدير النهائي:
													</span>
													<Badge variant="outline">
														{enrollment.finalGrade}
													</Badge>
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

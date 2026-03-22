import { BookOpen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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

interface EnrollInCourseModalProps {
	isOpen: boolean;
	onClose: () => void;
	studentId: string | null;
	studentName: string;
}

const daysOfWeek = [
	"الأحد",
	"الإثنين",
	"الثلاثاء",
	"الأربعاء",
	"الخميس",
	"الجمعة",
	"السبت",
];

export function EnrollInCourseModal({
	isOpen,
	onClose,
	studentId,
	studentName,
}: EnrollInCourseModalProps) {
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedLevelId, setSelectedLevelId] = useState("");
	const [selectedClassId, setSelectedClassId] = useState("");

	const utils = trpc.useUtils();

	const { data: coursesData } = trpc.courses.getAll.useQuery();
	const courses = coursesData?.data ?? [];

	const { data: levelsData } = trpc.courses.getLevels.useQuery(
		{ courseId: selectedCourseId },
		{ enabled: !!selectedCourseId },
	);
	const levels = levelsData?.data ?? [];

	const { data: classesData } = trpc.classes.getByCourseAndLevel.useQuery(
		{ courseId: selectedCourseId, levelId: selectedLevelId },
		{ enabled: !!selectedCourseId && !!selectedLevelId },
	);
	const availableClasses = classesData?.data ?? [];

	useEffect(() => {
		if (!isOpen) {
			setSelectedCourseId("");
			setSelectedLevelId("");
			setSelectedClassId("");
		}
	}, [isOpen]);

	const enrollMutation = trpc.students.enrollInCourse.useMutation({
		onSuccess: () => {
			utils.students.getAll.invalidate();
			if (studentId) {
				utils.students.getById.invalidate(studentId);
			}
			toast.success(`تم تسجيل الطالب ${studentName} في الكورس والكلاس بنجاح`);
			onClose();
			// Reset form
			setSelectedCourseId("");
			setSelectedLevelId("");
			setSelectedClassId("");
		},
		onError: (err) => {
			toast.error(err.message || "حدث خطأ أثناء تسجيل الطالب");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedCourseId) {
			toast.error("يجب اختيار كورس");
			return;
		}

		if (!selectedLevelId) {
			toast.error("يجب اختيار مستوى");
			return;
		}

		if (!selectedClassId) {
			toast.error("يجب اختيار كلاس");
			return;
		}

		if (!studentId) return;

		enrollMutation.mutate({
			studentId,
			courseId: selectedCourseId,
			levelId: selectedLevelId,
			classId: selectedClassId,
		});
	};

	// Helper function to convert 24h time to 12h format
	const formatTime12h = (timeStr: string) => {
		if (!timeStr) return "";
		const [hours, minutes] = timeStr.split(":").map(Number);
		const period = hours >= 12 ? "م" : "ص";
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
	};

	const formatSchedule = (schedules: any[]) => {
		if (!schedules || schedules.length === 0) return "لا يوجد جدول";
		return schedules
			.map(
				(s) =>
					`${daysOfWeek[s.dayOfWeek]} ${formatTime12h(s.startTime)}-${formatTime12h(s.endTime)}`,
			)
			.join("، ");
	};

	const getClassLabel = (cls: {
		name: string;
		teacher?: { fullName: string } | null;
		schedules?: Array<{
			dayOfWeek: number;
			startTime: string;
			endTime: string;
		}>;
	}) => {
		const teacherName = cls.teacher?.fullName
			? ` - ${cls.teacher.fullName}`
			: "";
		const schedule = cls.schedules?.length
			? ` - ${formatSchedule(cls.schedules)}`
			: "";
		return `${cls.name}${teacherName}${schedule}`;
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[550px]" dir="rtl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<BookOpen className="w-6 h-6 text-primary" />
						تسجيل الطالب في كورس
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<div className="bg-primary/5 p-3 rounded-lg mb-4">
						<p className="text-sm text-text-muted">الطالب:</p>
						<p className="font-semibold text-lg">{studentName}</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">الكورس *</label>
						<Select
							value={selectedCourseId}
							onValueChange={(value) => {
								setSelectedCourseId(value);
								setSelectedLevelId("");
								setSelectedClassId("");
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="اختر الكورس" />
							</SelectTrigger>
							<SelectContent>
								{courses.map((course) => (
									<SelectItem key={course.id} value={course.id}>
										{course.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">المستوى *</label>
						<Select
							value={selectedLevelId}
							onValueChange={(value) => {
								setSelectedLevelId(value);
								setSelectedClassId("");
							}}
							disabled={!selectedCourseId || levels.length === 0}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										selectedCourseId ? "اختر المستوى" : "اختر الكورس أولاً"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{levels.map((level) => (
									<SelectItem key={level.id} value={level.id}>
										مستوى {level.levelNumber}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">الكلاس *</label>
						<Select
							value={selectedClassId}
							onValueChange={setSelectedClassId}
							disabled={!selectedLevelId || availableClasses.length === 0}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										!selectedLevelId
											? "اختر المستوى أولاً"
											: availableClasses.length === 0
												? "لا يوجد كلاسات متاحة"
												: "اختر الكلاس"
									}
								/>
							</SelectTrigger>
							<SelectContent className="max-w-[460px]">
								{availableClasses.map((cls) => (
									<SelectItem key={cls.id} value={cls.id}>
										<span className="truncate max-w-[430px] block">
											{getClassLabel(cls)}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedClassId && (
							<p className="text-xs text-text-muted mt-1">
								{(() => {
									const selected = availableClasses.find(
										(c) => c.id === selectedClassId,
									);
									return selected ? getClassLabel(selected) : "";
								})()}
							</p>
						)}
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={onClose}>
							إلغاء
						</Button>
						<Button
							type="submit"
							disabled={
								enrollMutation.isPending ||
								!selectedCourseId ||
								!selectedLevelId ||
								!selectedClassId
							}
						>
							{enrollMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 ml-2 animate-spin" />
									جاري التسجيل...
								</>
							) : (
								"تسجيل"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

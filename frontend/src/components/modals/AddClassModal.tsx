import { Clock, GraduationCap, Loader2, Plus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface AddClassModalProps {
	isOpen: boolean;
	onClose: () => void;
	courseId?: string;
	courseName?: string;
}

const daysOfWeek = [
	{ value: "0", label: "الأحد" },
	{ value: "1", label: "الإثنين" },
	{ value: "2", label: "الثلاثاء" },
	{ value: "3", label: "الأربعاء" },
	{ value: "4", label: "الخميس" },
	{ value: "5", label: "الجمعة" },
	{ value: "6", label: "السبت" },
];

export function AddClassModal({
	isOpen,
	onClose,
	courseId,
	courseName,
}: AddClassModalProps) {
	const [formData, setFormData] = useState({
		name: "",
		teacherId: "",
		teacherPaymentAmount: "",
		teacherPaymentCycle: "4",
		levelId: "",
		schedules: [{ dayOfWeek: "0", startTime: "", endTime: "" }],
	});

	const utils = trpc.useUtils();

	const { data: teachersData } = trpc.teachers.getAll.useQuery({
		page: 1,
		limit: 100,
	});
	const teachers = teachersData?.data ?? [];

	const { data: levelsData } = trpc.courses.getLevels.useQuery(
		{ courseId: courseId || "" },
		{ enabled: !!courseId },
	);
	const levels = levelsData?.data ?? [];

	const createClassMutation = trpc.classes.create.useMutation({
		onSuccess: () => {
			utils.classes.getAll.invalidate();
			toast.success("تم إضافة الكلاس بنجاح");
			onClose();
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message || "حدث خطأ أثناء الإضافة");
		},
	});

	const createCourseClassMutation = trpc.courses.createClass.useMutation({
		onSuccess: () => {
			if (courseId) {
				utils.courses.getClasses.invalidate(courseId);
			}
			toast.success("تم إضافة الكلاس بنجاح");
			onClose();
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message || "حدث خطأ أثناء الإضافة");
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			teacherId: "",
			teacherPaymentAmount: "",
			teacherPaymentCycle: "4",
			levelId: "",
			schedules: [{ dayOfWeek: "0", startTime: "", endTime: "" }],
		});
	};

	const handleAddSchedule = () => {
		setFormData((prev) => ({
			...prev,
			schedules: [
				...prev.schedules,
				{ dayOfWeek: "0", startTime: "", endTime: "" },
			],
		}));
	};

	const handleRemoveSchedule = (index: number) => {
		setFormData((prev) => ({
			...prev,
			schedules: prev.schedules.filter((_, i) => i !== index),
		}));
	};

	const handleScheduleChange = (
		index: number,
		field: string,
		value: string,
	) => {
		setFormData((prev) => {
			const newSchedules = [...prev.schedules];
			newSchedules[index] = { ...newSchedules[index], [field]: value };
			return { ...prev, schedules: newSchedules };
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name) {
			toast.error("اسم الكلاس مطلوب");
			return;
		}

		if (courseId) {
			// Creating class within a course context
			if (!formData.levelId) {
				toast.error("المستوى مطلوب");
				return;
			}

			if (formData.teacherId && !formData.teacherPaymentAmount) {
				toast.error("مبلغ دفع المعلم مطلوب عند اختيار معلم");
				return;
			}

			const validSchedules = formData.schedules.filter(
				(s) => s.startTime && s.endTime,
			);
			if (validSchedules.length === 0) {
				toast.error("يجب إضافة جدول زمني واحد على الأقل");
				return;
			}

			createCourseClassMutation.mutate({
				courseId,
				name: formData.name,
				levelId: formData.levelId,
				teacherId: formData.teacherId || undefined,
				teacherPaymentAmount: formData.teacherId
					? Number(formData.teacherPaymentAmount)
					: undefined,
				teacherPaymentCycle: formData.teacherId
					? (formData.teacherPaymentCycle as "4" | "8")
					: undefined,
				schedules: validSchedules.map((s) => ({
					dayOfWeek: parseInt(s.dayOfWeek, 10),
					startTime: s.startTime,
					endTime: s.endTime,
				})),
			});
		} else {
			// Creating generic class (no course context)
			createClassMutation.mutate({
				name: formData.name,
				teacherId: formData.teacherId || undefined,
				teacherPayment:
					formData.teacherId && formData.teacherPaymentAmount
						? {
								paymentAmount: Number(formData.teacherPaymentAmount),
								paymentCycle: formData.teacherPaymentCycle as "4" | "8",
							}
						: undefined,
				scheduleDayOfWeek: formData.schedules[0]?.dayOfWeek
					? parseInt(formData.schedules[0].dayOfWeek, 10)
					: undefined,
				scheduleStartTime: formData.schedules[0]?.startTime || undefined,
				scheduleEndTime: formData.schedules[0]?.endTime || undefined,
			});
		}
	};

	const isPending =
		createClassMutation.isPending || createCourseClassMutation.isPending;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto"
				dir="rtl"
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						{courseId ? (
							<>
								<GraduationCap className="w-6 h-6 text-primary" />
								إضافة كلاس جديد {courseName && `- ${courseName}`}
							</>
						) : (
							<>
								<Users className="w-6 h-6 text-primary" />
								إضافة كلاس جديد
							</>
						)}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<div className="space-y-2">
						<Label htmlFor="name">اسم الكلاس *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="أدخل اسم الكلاس"
							required
						/>
					</div>

					{courseId && (
						<div className="space-y-2">
							<Label htmlFor="level">المستوى *</Label>
							<Select
								value={formData.levelId}
								onValueChange={(value) =>
									setFormData({ ...formData, levelId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="اختر المستوى" />
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
					)}

					<div className="space-y-2">
						<Label htmlFor="teacher">المعلم</Label>
						<Select
							value={formData.teacherId}
							onValueChange={(value) =>
								setFormData({ ...formData, teacherId: value })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="اختر المعلم" />
							</SelectTrigger>
							<SelectContent>
								{teachers.map((teacher) => (
									<SelectItem key={teacher.id} value={teacher.id}>
										{teacher.fullName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{formData.teacherId && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="teacherPaymentAmount">مبلغ دفع المعلم *</Label>
								<Input
									id="teacherPaymentAmount"
									type="number"
									min="1"
									value={formData.teacherPaymentAmount}
									onChange={(e) =>
										setFormData({
											...formData,
											teacherPaymentAmount: e.target.value,
										})
									}
									placeholder="مثال: 500"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="teacherPaymentCycle">دورة دفع المعلم</Label>
								<Select
									value={formData.teacherPaymentCycle}
									onValueChange={(value) =>
										setFormData({ ...formData, teacherPaymentCycle: value })
									}
								>
									<SelectTrigger id="teacherPaymentCycle">
										<SelectValue placeholder="اختر دورة الدفع" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="4">كل 4 حصص</SelectItem>
										<SelectItem value="8">كل 8 حصص</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>{courseId ? "الجدول الزمني *" : "الجدول الزمني"}</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddSchedule}
							>
								<Plus className="w-4 h-4 ml-1" />
								إضافة يوم
							</Button>
						</div>

						<div className="space-y-2">
							{formData.schedules.map((schedule, index) => (
								<div
									key={index}
									className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
								>
									<Select
										value={schedule.dayOfWeek}
										onValueChange={(value) =>
											handleScheduleChange(index, "dayOfWeek", value)
										}
									>
										<SelectTrigger className="w-[120px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{daysOfWeek.map((day) => (
												<SelectItem key={day.value} value={day.value}>
													{day.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<div className="relative">
										<Input
											type="time"
											value={schedule.startTime}
											onChange={(e) =>
												handleScheduleChange(index, "startTime", e.target.value)
											}
											className="w-[140px] text-base pl-10 cursor-pointer"
										/>
										<div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
											<Clock className="w-4 h-4 text-text-muted" />
										</div>
									</div>

									<span className="text-text-muted px-1">إلى</span>

									<div className="relative">
										<Input
											type="time"
											value={schedule.endTime}
											onChange={(e) =>
												handleScheduleChange(index, "endTime", e.target.value)
											}
											className="w-[140px] text-base pl-10 cursor-pointer"
										/>
										<div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
											<Clock className="w-4 h-4 text-text-muted" />
										</div>
									</div>

									{formData.schedules.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="text-error"
											onClick={() => handleRemoveSchedule(index)}
										>
											<X className="w-4 h-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={onClose}>
							إلغاء
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="w-4 h-4 ml-2 animate-spin" />
									جاري الحفظ...
								</>
							) : (
								"حفظ"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

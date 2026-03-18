import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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

interface EditClassModalProps {
	classId: string | null;
	courseId: string | null;
	isOpen: boolean;
	onClose: () => void;
}

const _daysOfWeek = [
	"الأحد",
	"الإثنين",
	"الثلاثاء",
	"الأربعاء",
	"الخميس",
	"الجمعة",
	"السبت",
];

export function EditClassModal({
	classId,
	courseId,
	isOpen,
	onClose,
}: EditClassModalProps) {
	const [formData, setFormData] = useState({
		name: "",
		levelId: "",
		teacherId: "",
		teacherPaymentAmount: "",
		teacherPaymentCycle: "4",
	});

	const utils = trpc.useUtils();

	const { data: classData, isLoading: isLoadingClass } =
		trpc.courses.getClasses.useQuery(courseId || "", {
			enabled: !!courseId && !!classId && isOpen,
		});

	const selectedClass = classData?.data?.find((c: any) => c.id === classId);

	const { data: levelsData } = trpc.courses.getLevels.useQuery(
		{ courseId: courseId || "" },
		{ enabled: !!courseId && isOpen },
	);
	const levels = levelsData?.data || [];

	const { data: teachersData } = trpc.teachers.getAll.useQuery({});
	const teachers = teachersData?.data || [];

	useEffect(() => {
		if (selectedClass) {
			setFormData({
				name: selectedClass.name || "",
				levelId: selectedClass.level?.id || "",
				teacherId: selectedClass.teacher?.id || "",
				teacherPaymentAmount: selectedClass.teacherPayment?.amount
					? String(selectedClass.teacherPayment.amount)
					: "",
				teacherPaymentCycle: selectedClass.teacherPayment?.cycle || "4",
			});
		}
	}, [selectedClass]);

	const updateClassMutation = trpc.courses.updateClass.useMutation({
		onSuccess: () => {
			utils.courses.getClasses.invalidate(courseId || "");
			toast.success("تم تعديل الكلاس بنجاح");
			onClose();
		},
		onError: (err) => {
			toast.error(err.message || "حدث خطأ أثناء التعديل");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!classId || !formData.name || !formData.levelId) {
			toast.error("اسم الكلاس والمستوى مطلوبان");
			return;
		}

		if (formData.teacherId && !formData.teacherPaymentAmount) {
			toast.error("مبلغ دفع المعلم مطلوب عند اختيار معلم");
			return;
		}

		updateClassMutation.mutate({
			classId,
			name: formData.name,
			levelId: formData.levelId,
			teacherId: formData.teacherId || undefined,
			teacherPaymentAmount: formData.teacherId
				? Number(formData.teacherPaymentAmount)
				: undefined,
			teacherPaymentCycle: formData.teacherId
				? (formData.teacherPaymentCycle as "4" | "8")
				: undefined,
		});
	};

	if (isLoadingClass) {
		return (
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent dir="rtl">
					<div className="flex items-center justify-center h-32">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px]" dir="rtl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<GraduationCap className="w-6 h-6 text-primary" />
						تعديل الكلاس
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<div className="space-y-2">
						<Label>اسم الكلاس *</Label>
						<Input
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="أدخل اسم الكلاس"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label>المستوى *</Label>
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
								{levels.map((level: any) => (
									<SelectItem key={level.id} value={level.id}>
										مستوى {level.levelNumber}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>المعلم (اختياري)</Label>
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
								{teachers.map((teacher: any) => (
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
								<Label htmlFor="editTeacherPaymentAmount">
									مبلغ دفع المعلم *
								</Label>
								<Input
									id="editTeacherPaymentAmount"
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
								<Label htmlFor="editTeacherPaymentCycle">دورة دفع المعلم</Label>
								<Select
									value={formData.teacherPaymentCycle}
									onValueChange={(value) =>
										setFormData({ ...formData, teacherPaymentCycle: value })
									}
								>
									<SelectTrigger id="editTeacherPaymentCycle">
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

					<div className="flex gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="flex-1"
						>
							إلغاء
						</Button>
						<Button
							type="submit"
							disabled={updateClassMutation.isPending}
							className="flex-1"
						>
							{updateClassMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 ml-2 animate-spin" />
									جاري الحفظ...
								</>
							) : (
								"حفظ التغييرات"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

interface EditStudentModalProps {
	studentId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditStudentModal({
	studentId,
	open,
	onOpenChange,
	onSuccess,
}: EditStudentModalProps) {
	const [formData, setFormData] = useState({
		fullName: "",
		age: "",
		parentName: "",
		parentPhone: "",
		address: "",
		emergencyContact: "",
	});
	const [error, setError] = useState("");

	const utils = trpc.useUtils();

	// Fetch student data
	const { data: student, isLoading: isLoadingStudent } =
		trpc.students.getById.useQuery(studentId || "", {
			enabled: !!studentId && open,
		});

	// Populate form when student data loads
	useEffect(() => {
		if (student) {
			setFormData({
				fullName: student.fullName || "",
				age: student.age?.toString() || "",
				parentName: student.parentName || "",
				parentPhone: student.parentPhone || "",
				address: student.address || "",
				emergencyContact: student.emergencyContact || "",
			});
		}
	}, [student]);

	const updateStudent = trpc.students.update.useMutation({
		onSuccess: () => {
			toast.success("تم تحديث بيانات الطالب بنجاح");
			utils.students.getAll.invalidate();
			onSuccess?.();
			onOpenChange(false);
		},
		onError: (err) => {
			setError(err.message || "حدث خطأ أثناء تحديث بيانات الطالب");
			toast.error(err.message || "حدث خطأ أثناء تحديث بيانات الطالب");
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!studentId) return;

		if (
			!formData.fullName ||
			!formData.parentName ||
			!formData.parentPhone ||
			!formData.address ||
			!formData.emergencyContact
		) {
			setError("جميع الحقول المطلوبة يجب ملؤها");
			return;
		}

		updateStudent.mutate({
			id: studentId,
			data: {
				fullName: formData.fullName,
				age: formData.age ? parseInt(formData.age, 10) : undefined,
				parentName: formData.parentName,
				parentPhone: formData.parentPhone,
				address: formData.address,
				emergencyContact: formData.emergencyContact,
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>تعديل بيانات الطالب</DialogTitle>
					<DialogDescription>
						تعديل بيانات الطالب. جميع الحقول المميزة بـ * مطلوبة.
					</DialogDescription>
				</DialogHeader>

				{isLoadingStudent ? (
					<div className="flex items-center justify-center h-64">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4 mt-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="fullName">اسم الطالب الكامل *</Label>
								<Input
									id="fullName"
									value={formData.fullName}
									onChange={(e) =>
										setFormData({ ...formData, fullName: e.target.value })
									}
									placeholder="أدخل اسم الطالب"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="age">العمر</Label>
								<Input
									id="age"
									type="number"
									value={formData.age}
									onChange={(e) =>
										setFormData({ ...formData, age: e.target.value })
									}
									placeholder="أدخل العمر"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="parentName">اسم ولي الأمر *</Label>
								<Input
									id="parentName"
									value={formData.parentName}
									onChange={(e) =>
										setFormData({ ...formData, parentName: e.target.value })
									}
									placeholder="أدخل اسم ولي الأمر"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="parentPhone">رقم هاتف ولي الأمر *</Label>
								<Input
									id="parentPhone"
									value={formData.parentPhone}
									onChange={(e) =>
										setFormData({ ...formData, parentPhone: e.target.value })
									}
									placeholder="أدخل رقم الهاتف"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">العنوان *</Label>
							<Input
								id="address"
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								placeholder="أدخل العنوان"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="emergencyContact">رقم الطوارئ *</Label>
							<Input
								id="emergencyContact"
								value={formData.emergencyContact}
								onChange={(e) =>
									setFormData({ ...formData, emergencyContact: e.target.value })
								}
								placeholder="أدخل رقم الطوارئ"
								required
							/>
						</div>

						<DialogFooter className="mt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={updateStudent.isPending}
							>
								إلغاء
							</Button>
							<Button
								type="submit"
								disabled={updateStudent.isPending}
								className="gap-2"
							>
								{updateStudent.isPending && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								حفظ التغييرات
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

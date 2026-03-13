import {
	AlertCircle,
	Home,
	Loader2,
	Phone,
	User,
	UserCircle,
} from "lucide-react";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";

interface AddStudentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function AddStudentModal({
	open,
	onOpenChange,
	onSuccess,
}: AddStudentModalProps) {
	const [formData, setFormData] = useState({
		fullName: "",
		age: "",
		parentName: "",
		parentPhone: "",
		address: "",
		emergencyContact: "",
	});
	const [error, setError] = useState("");
	const { toast } = useToast();

	const utils = trpc.useUtils();
	const createStudent = trpc.students.create.useMutation({
		onSuccess: () => {
			utils.students.getAll.invalidate();
			onSuccess?.();
			onOpenChange(false);
			setFormData({
				fullName: "",
				age: "",
				parentName: "",
				parentPhone: "",
				address: "",
				emergencyContact: "",
			});
			toast({
				title: "تم بنجاح",
				description: "تم إضافة الطالب بنجاح",
			});
		},
		onError: (err) => {
			setError(err.message || "حدث خطأ أثناء إضافة الطالب");
			toast({
				variant: "destructive",
				title: "خطأ",
				description: err.message || "حدث خطأ أثناء إضافة الطالب",
			});
		},
	});

	const validateForm = () => {
		if (!formData.fullName || formData.fullName.length < 3) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "يجب أن يكون اسم الطالب 3 أحرف على الأقل",
			});
			return false;
		}

		if (!formData.parentName || formData.parentName.length < 3) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "يجب أن يكون اسم ولي الأمر 3 أحرف على الأقل",
			});
			return false;
		}

		if (!formData.address || formData.address.length < 3) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "يجب أن يكون العنوان 3 أحرف على الأقل",
			});
			return false;
		}

		if (!formData.parentPhone) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "رقم هاتف ولي الأمر مطلوب",
			});
			return false;
		}

		if (!formData.emergencyContact) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "رقم الطوارئ مطلوب",
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!validateForm()) {
			return;
		}

		createStudent.mutate({
			fullName: formData.fullName,
			age: formData.age ? parseInt(formData.age, 10) : undefined,
			parentName: formData.parentName,
			parentPhone: formData.parentPhone,
			address: formData.address,
			emergencyContact: formData.emergencyContact,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]" dir="rtl">
				<DialogHeader>
					<DialogTitle>إضافة طالب جديد</DialogTitle>
					<DialogDescription>
						أدخل بيانات الطالب الجديد. جميع الحقول المميزة بـ * مطلوبة.
					</DialogDescription>
				</DialogHeader>

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
							<div className="relative">
								<User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
								<Input
									id="fullName"
									value={formData.fullName}
									onChange={(e) =>
										setFormData({ ...formData, fullName: e.target.value })
									}
									placeholder="أدخل اسم الطالب"
									className="pr-10"
									required
								/>
							</div>
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
							<div className="relative">
								<UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
								<Input
									id="parentName"
									value={formData.parentName}
									onChange={(e) =>
										setFormData({ ...formData, parentName: e.target.value })
									}
									placeholder="أدخل اسم ولي الأمر"
									className="pr-10"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="parentPhone">رقم هاتف ولي الأمر *</Label>
							<div className="relative">
								<Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
								<Input
									id="parentPhone"
									value={formData.parentPhone}
									onChange={(e) =>
										setFormData({ ...formData, parentPhone: e.target.value })
									}
									placeholder="أدخل رقم الهاتف"
									className="pr-10"
									required
								/>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="address">العنوان *</Label>
						<div className="relative">
							<Home className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
							<Input
								id="address"
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								placeholder="أدخل العنوان"
								className="pr-10"
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="emergencyContact">رقم الطوارئ *</Label>
						<div className="relative">
							<Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
							<Input
								id="emergencyContact"
								value={formData.emergencyContact}
								onChange={(e) =>
									setFormData({ ...formData, emergencyContact: e.target.value })
								}
								placeholder="أدخل رقم الطوارئ"
								className="pr-10"
								required
							/>
						</div>
					</div>

					<DialogFooter className="mt-6 gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={createStudent.isPending}
						>
							إلغاء
						</Button>
						<Button
							type="submit"
							disabled={createStudent.isPending}
							className="gap-2"
						>
							{createStudent.isPending && (
								<Loader2 className="w-4 h-4 animate-spin" />
							)}
							إضافة الطالب
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

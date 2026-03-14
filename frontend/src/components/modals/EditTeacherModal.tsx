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
import { trpc } from "@/lib/trpc";

interface EditTeacherModalProps {
	isOpen: boolean;
	onClose: () => void;
	teacherId: string | null;
}

export function EditTeacherModal({
	isOpen,
	onClose,
	teacherId,
}: EditTeacherModalProps) {
	const [formData, setFormData] = useState({
		fullName: "",
		phone: "",
		email: "",
		address: "",
	});

	const utils = trpc.useContext();

	const { data: teacher, isLoading: isLoadingTeacher } =
		trpc.teachers.getById.useQuery(teacherId || "", { enabled: !!teacherId });

	useEffect(() => {
		if (teacher) {
			setFormData({
				fullName: teacher.fullName || "",
				phone: teacher.phone || "",
				email: teacher.email || "",
				address: teacher.address || "",
			});
		}
	}, [teacher]);

	const updateMutation = trpc.teachers.update.useMutation({
		onSuccess: () => {
			toast.success("تم تحديث بيانات المعلم بنجاح");
			utils.teachers.getAll.invalidate();
			if (teacherId) {
				utils.teachers.getById.invalidate(teacherId);
			}
			onClose();
		},
		onError: (err) => {
			toast.error(err.message || "حدث خطأ أثناء تحديث بيانات المعلم");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!teacherId) return;

		updateMutation.mutate({
			id: teacherId,
			data: {
				fullName: formData.fullName,
				phone: formData.phone || undefined,
				email: formData.email || undefined,
				address: formData.address || undefined,
			},
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]" dir="rtl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<GraduationCap className="w-6 h-6 text-accent-cyan" />
						تعديل بيانات المعلم
					</DialogTitle>
				</DialogHeader>

				{isLoadingTeacher ? (
					<div className="flex items-center justify-center h-32">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4 mt-4">
						<div className="space-y-2">
							<Label htmlFor="fullName">الاسم الكامل *</Label>
							<Input
								id="fullName"
								value={formData.fullName}
								onChange={(e) =>
									setFormData({ ...formData, fullName: e.target.value })
								}
								placeholder="أدخل اسم المعلم"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">رقم الهاتف</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								placeholder="01xxxxxxxx"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">البريد الإلكتروني</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								placeholder="email@example.com"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">العنوان</Label>
							<Input
								id="address"
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								placeholder="عنوان المعلم"
							/>
						</div>

						<div className="flex justify-end gap-2 pt-4">
							<Button type="button" variant="outline" onClick={onClose}>
								إلغاء
							</Button>
							<Button
								type="submit"
								className="bg-accent-cyan hover:bg-accent-cyan/90"
								disabled={updateMutation.isPending}
							>
								{updateMutation.isPending ? (
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
				)}
			</DialogContent>
		</Dialog>
	);
}

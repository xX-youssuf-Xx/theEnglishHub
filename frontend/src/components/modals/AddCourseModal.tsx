import { BookOpen, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";

interface AddCourseModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		syllabus: "",
		sessionsPerMonth: "4",
	});
	const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>(
		[],
	);
	const { toast } = useToast();

	const utils = trpc.useUtils();
	const { data: coursesData } = trpc.courses.getAll.useQuery();
	const existingCourses =
		coursesData?.data?.filter((c: any) => c.isActive) || [];

	const createMutation = trpc.courses.create.useMutation({
		onSuccess: () => {
			utils.courses.getAll.invalidate();
			toast({
				title: "تم بنجاح",
				description: "تم إضافة الكورس بنجاح",
			});
			onClose();
			resetForm();
		},
		onError: (err) => {
			toast({
				variant: "destructive",
				title: "خطأ",
				description: err.message || "حدث خطأ أثناء إضافة الكورس",
			});
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			syllabus: "",
			sessionsPerMonth: "4",
		});
		setSelectedPrerequisites([]);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "اسم الكورس مطلوب",
			});
			return;
		}

		createMutation.mutate({
			name: formData.name,
			description: formData.description || undefined,
			syllabus: formData.syllabus || undefined,
			sessionsPerMonth: parseInt(formData.sessionsPerMonth, 10),
			prerequisiteCourseIds:
				selectedPrerequisites.length > 0 ? selectedPrerequisites : undefined,
		});
	};

	const togglePrerequisite = (courseId: string) => {
		setSelectedPrerequisites((prev) =>
			prev.includes(courseId)
				? prev.filter((id) => id !== courseId)
				: [...prev, courseId],
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[550px]" dir="rtl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<BookOpen className="w-6 h-6 text-primary" />
						إضافة كورس جديد
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<div className="space-y-2">
						<Label htmlFor="name">اسم الكورس *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="أدخل اسم الكورس"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">الوصف</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder="أدخل وصف الكورس"
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="syllabus">المنهج</Label>
						<Textarea
							id="syllabus"
							value={formData.syllabus}
							onChange={(e) =>
								setFormData({ ...formData, syllabus: e.target.value })
							}
							placeholder="أدخل منهج الكورس"
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="sessionsPerMonth">عدد الحصص في الشهر *</Label>
						<Select
							value={formData.sessionsPerMonth}
							onValueChange={(value) =>
								setFormData({ ...formData, sessionsPerMonth: value })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="اختر عدد الحصص" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="4">4 حصص (دفع كل 4 حصص)</SelectItem>
								<SelectItem value="8">8 حصص (دفع كل 8 حصص)</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-text-muted">
							هذا يحدد دورة الدفع للطلاب والمعلمين
						</p>
					</div>

					{existingCourses.length > 0 && (
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Link2 className="w-4 h-4" />
								<span>المتطلبات السابقة (كورسات)</span>
							</Label>
							<div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
								{existingCourses.map((course: any) => (
									<label
										key={course.id}
										className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
									>
										<input
											type="checkbox"
											checked={selectedPrerequisites.includes(course.id)}
											onChange={() => togglePrerequisite(course.id)}
											className="w-4 h-4"
										/>
										<span className="text-sm">{course.name}</span>
									</label>
								))}
							</div>
						</div>
					)}

					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={onClose}>
							إلغاء
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 ml-2 animate-spin" />
									جاري الحفظ...
								</>
							) : (
								"إضافة الكورس"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

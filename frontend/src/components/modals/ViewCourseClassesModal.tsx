import {
	Calendar,
	Clock,
	Edit,
	GraduationCap,
	Loader2,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { AddClassModal } from "./AddClassModal";
import { EditClassModal } from "./EditClassModal";

interface ViewCourseClassesModalProps {
	courseId: string | null;
	courseName: string;
	isOpen: boolean;
	onClose: () => void;
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

// Helper function to convert 24h time to 12h format
const formatTime12h = (timeStr: string) => {
	if (!timeStr) return "";
	const [hours, minutes] = timeStr.split(":").map(Number);
	const period = hours >= 12 ? "م" : "ص";
	const displayHours = hours % 12 || 12;
	return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export function ViewCourseClassesModal({
	courseId,
	courseName,
	isOpen,
	onClose,
}: ViewCourseClassesModalProps) {
	const [editingClassId, setEditingClassId] = useState<string | null>(null);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const { toast } = useToast();

	const utils = trpc.useUtils();

	const { data: classesData, isLoading: isLoadingClasses } =
		trpc.courses.getClasses.useQuery(courseId || "", { enabled: !!courseId });

	const classes = classesData?.data || [];

	const deleteClassMutation = trpc.courses.deleteClass.useMutation({
		onSuccess: () => {
			utils.courses.getClasses.invalidate(courseId || "");
			toast({
				title: "تم بنجاح",
				description: "تم حذف الكلاس بنجاح",
			});
		},
		onError: (err) => {
			toast({
				variant: "destructive",
				title: "خطأ",
				description: err.message || "حدث خطأ أثناء الحذف",
			});
		},
	});

	const handleDeleteClass = (classId: string) => {
		deleteClassMutation.mutate(classId);
	};

	const handleEditClass = (classId: string) => {
		setEditingClassId(classId);
	};

	const formatSchedule = (schedules: any[]) => {
		if (!schedules || schedules.length === 0) return "لا يوجد جدول";
		return schedules
			.map(
				(s) =>
					`${daysOfWeek[s.dayOfWeek]} ${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`,
			)
			.join("، ");
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent
					className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto"
					dir="rtl"
				>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-xl">
							<GraduationCap className="w-6 h-6 text-primary" />
							كلاسات الكورس: {courseName}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 mt-4">
						{/* Add Button */}
						<Button
							onClick={() => setIsAddModalOpen(true)}
							className="w-full gap-2"
							variant="outline"
						>
							<Plus className="w-4 h-4" />
							إضافة كلاس جديد
						</Button>

						{/* Classes List */}
						<div className="space-y-3">
							<h3 className="font-semibold text-lg">الكلاسات الحالية</h3>

							{isLoadingClasses ? (
								<div className="flex items-center justify-center h-32">
									<Loader2 className="w-8 h-8 animate-spin text-primary" />
								</div>
							) : classes.length > 0 ? (
								<div className="space-y-2">
									{classes.map((cls: any) => (
										<div
											key={cls.id}
											className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-colors"
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-2">
													<span className="font-semibold text-base">
														{cls.name}
													</span>
													{cls.level && (
														<Badge variant="secondary" className="text-xs">
															مستوى {cls.level.levelNumber}
														</Badge>
													)}
												</div>
												<div className="text-sm text-text-muted space-y-1">
													<p className="flex items-center gap-2">
														<Clock className="w-4 h-4" />
														{formatSchedule(cls.schedules)}
													</p>
													{cls.teacher && (
														<p className="flex items-center gap-2">
															<Users className="w-4 h-4" />
															المعلم: {cls.teacher.fullName}
														</p>
													)}
													<p className="flex items-center gap-2">
														<Calendar className="w-4 h-4" />
														عدد الطلاب: {cls.studentCount || 0}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-1 mr-4">
												<Button
													variant="ghost"
													size="icon"
													className="text-primary hover:text-primary hover:bg-primary/10"
													onClick={() => handleEditClass(cls.id)}
												>
													<Edit className="w-4 h-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-error hover:text-error hover:bg-error/10"
													onClick={() => handleDeleteClass(cls.id)}
													disabled={deleteClassMutation.isPending}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-text-muted bg-muted/50 rounded-lg">
									<GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p>لا يوجد كلاسات في هذا الكورس</p>
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<EditClassModal
				classId={editingClassId}
				courseId={courseId}
				isOpen={!!editingClassId}
				onClose={() => setEditingClassId(null)}
			/>

			<AddClassModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				courseId={courseId || undefined}
				courseName={courseName}
			/>
		</>
	);
}

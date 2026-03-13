import {
	AlertCircle,
	Clock,
	GraduationCap,
	Loader2,
	Plus,
	Trash2,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";

interface ManageTeacherClassesModalProps {
	isOpen: boolean;
	onClose: () => void;
	teacherId: string | null;
	teacherName: string;
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

export function ManageTeacherClassesModal({
	isOpen,
	onClose,
	teacherId,
	teacherName,
}: ManageTeacherClassesModalProps) {
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedClassId, setSelectedClassId] = useState("");
	const [paymentAmount, setPaymentAmount] = useState("");
	const [paymentCycle, setPaymentCycle] = useState<"4" | "8">("4");
	const [isAddingMode, setIsAddingMode] = useState(false);
	const { toast } = useToast();

	const utils = trpc.useUtils();

	const { data: teacherData, isLoading: isLoadingTeacher } =
		trpc.teachers.getClassesByCourse.useQuery(teacherId || "", {
			enabled: !!teacherId,
		});

	const { data: availableData, isLoading: isLoadingAvailable } =
		trpc.teachers.getAvailableClasses.useQuery();
	const availableCourses = availableData?.courses || [];

	console.log("Available data:", availableData);
	console.log("Available courses:", availableCourses);

	const assignMutation = trpc.teachers.assignToClass.useMutation({
		onSuccess: () => {
			utils.teachers.getClassesByCourse.invalidate(teacherId || "");
			utils.teachers.getAvailableClasses.invalidate();
			toast({
				title: "تم بنجاح",
				description: "تم إضافة المعلم إلى الكلاس بنجاح",
			});
			resetAddForm();
			setIsAddingMode(false);
		},
		onError: (err) => {
			toast({
				variant: "destructive",
				title: "خطأ",
				description: err.message || "حدث خطأ أثناء إضافة المعلم",
			});
		},
	});

	const removeMutation = trpc.teachers.removeFromClass.useMutation({
		onSuccess: () => {
			utils.teachers.getClassesByCourse.invalidate(teacherId || "");
			utils.teachers.getAvailableClasses.invalidate();
			toast({
				title: "تم بنجاح",
				description: "تم إزالة المعلم من الكلاس بنجاح",
			});
		},
		onError: (err) => {
			toast({
				variant: "destructive",
				title: "خطأ",
				description: err.message || "حدث خطأ أثناء إزالة المعلم",
			});
		},
	});

	const resetAddForm = () => {
		setSelectedCourseId("");
		setSelectedClassId("");
		setPaymentAmount("");
		setPaymentCycle("4");
	};

	const handleAssign = () => {
		if (!selectedClassId || !paymentAmount || !teacherId) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "جميع الحقول مطلوبة",
			});
			return;
		}

		assignMutation.mutate({
			teacherId,
			classId: selectedClassId,
			paymentAmount: parseFloat(paymentAmount),
			paymentCycle,
		});
	};

	const handleRemove = (classId: string) => {
		if (!teacherId) return;

		removeMutation.mutate({
			teacherId,
			classId,
		});
	};

	const selectedCourse = availableCourses.find(
		(c) => c.id === selectedCourseId,
	);
	const availableClasses = selectedCourse?.classes || [];

	const formatSchedule = (schedules: any[]) => {
		if (!schedules || schedules.length === 0) return "لا يوجد جدول";
		return schedules
			.map(
				(s) =>
					`${daysOfWeek[s.dayOfWeek]} ${s.startTime?.slice(0, 5)}-${s.endTime?.slice(0, 5)}`,
			)
			.join("، ");
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto"
				dir="rtl"
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<GraduationCap className="w-6 h-6 text-accent-cyan" />
						إدارة كلاسات المعلم
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 mt-4">
					{/* Teacher Info */}
					<div className="bg-accent-cyan/5 p-3 rounded-lg">
						<p className="text-sm text-text-muted">المعلم:</p>
						<p className="font-semibold text-lg">{teacherName}</p>
					</div>

					{/* Add Button */}
					{!isAddingMode && (
						<Button
							onClick={() => setIsAddingMode(true)}
							className="w-full gap-2"
							variant="outline"
						>
							<Plus className="w-4 h-4" />
							إضافة كلاس جديد
						</Button>
					)}

					{/* Add Class Form */}
					{isAddingMode && (
						<Card className="border-accent-cyan/30">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Plus className="w-4 h-4" />
										إضافة كلاس
									</span>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setIsAddingMode(false);
											resetAddForm();
										}}
									>
										<X className="w-4 h-4" />
									</Button>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{isLoadingAvailable ? (
									<div className="flex items-center justify-center py-4">
										<Loader2 className="w-6 h-6 animate-spin text-primary" />
									</div>
								) : availableCourses.length === 0 ? (
									<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
										<AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
										<div>
											<p className="font-medium text-yellow-800">
												لا يوجد كلاسات متاحة
											</p>
											<p className="text-sm text-yellow-700 mt-1">
												لا توجد كلاسات بدون معلمين حالياً. قم بإنشاء كلاسات جديدة
												أولاً.
											</p>
										</div>
									</div>
								) : (
									<>
										<div className="space-y-2">
											<Label>الكورس *</Label>
											<Select
												value={selectedCourseId}
												onValueChange={(value) => {
													setSelectedCourseId(value);
													setSelectedClassId("");
												}}
											>
												<SelectTrigger>
													<SelectValue placeholder="اختر الكورس" />
												</SelectTrigger>
												<SelectContent>
													{availableCourses.map((course) => (
														<SelectItem key={course.id} value={course.id}>
															{course.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label>الكلاس *</Label>
											<Select
												value={selectedClassId}
												onValueChange={setSelectedClassId}
												disabled={
													!selectedCourseId || availableClasses.length === 0
												}
											>
												<SelectTrigger>
													<SelectValue
														placeholder={
															!selectedCourseId
																? "اختر الكورس أولاً"
																: availableClasses.length === 0
																	? "لا يوجد كلاسات متاحة"
																	: "اختر الكلاس"
														}
													/>
												</SelectTrigger>
												<SelectContent>
													{availableClasses.map((cls) => (
														<SelectItem key={cls.id} value={cls.id}>
															{cls.name} - مستوى {cls.levelNumber}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>المبلغ (جنيه) *</Label>
												<Input
													type="number"
													value={paymentAmount}
													onChange={(e) => setPaymentAmount(e.target.value)}
													placeholder="أدخل المبلغ"
												/>
											</div>
											<div className="space-y-2">
												<Label>دورة الدفع *</Label>
												<Select
													value={paymentCycle}
													onValueChange={(value: "4" | "8") =>
														setPaymentCycle(value)
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="4">كل 4 حصص</SelectItem>
														<SelectItem value="8">كل 8 حصص</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="flex gap-2 pt-2">
											<Button
												variant="outline"
												onClick={() => {
													setIsAddingMode(false);
													resetAddForm();
												}}
												className="flex-1"
											>
												إلغاء
											</Button>
											<Button
												onClick={handleAssign}
												disabled={
													assignMutation.isPending ||
													!selectedClassId ||
													!paymentAmount
												}
												className="flex-1"
											>
												{assignMutation.isPending ? (
													<>
														<Loader2 className="w-4 h-4 ml-2 animate-spin" />
														جاري الإضافة...
													</>
												) : (
													"إضافة"
												)}
											</Button>
										</div>
									</>
								)}
							</CardContent>
						</Card>
					)}

					{/* Current Classes by Course */}
					<div className="space-y-3">
						<h3 className="font-semibold text-lg">الكلاسات الحالية</h3>

						{isLoadingTeacher ? (
							<div className="flex items-center justify-center h-32">
								<Loader2 className="w-8 h-8 animate-spin text-primary" />
							</div>
						) : teacherData?.courses && teacherData.courses.length > 0 ? (
							<div className="space-y-3">
								{teacherData.courses.map((course) => (
									<Collapsible key={course.id} defaultOpen>
										<Card>
											<CollapsibleTrigger className="w-full">
												<CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
													<CardTitle className="text-base flex items-center justify-between">
														<div className="flex items-center gap-2">
															<span className="text-primary">
																{course.name}
															</span>
														</div>
														<Badge variant="secondary">
															{course.classes.length} كلاس
														</Badge>
													</CardTitle>
												</CardHeader>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<CardContent className="pt-0">
													<div className="space-y-2">
														{course.classes.map((cls) => (
															<div
																key={cls.id}
																className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
															>
																<div className="flex-1">
																	<div className="flex items-center gap-2 mb-1">
																		<span className="font-medium">
																			{cls.name}
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			مستوى {cls.levelNumber}
																		</Badge>
																	</div>
																	<div className="text-xs text-text-muted space-y-1">
																		<p className="flex items-center gap-1">
																			<Clock className="w-3 h-3" />
																			{formatSchedule(cls.schedules)}
																		</p>
																		<p>
																			{cls.paymentAmount} جنيه / كل{" "}
																			{cls.paymentCycle} حصص
																		</p>
																	</div>
																</div>
																<Button
																	variant="ghost"
																	size="icon"
																	className="text-error hover:text-error hover:bg-error/10"
																	onClick={() => handleRemove(cls.id)}
																	disabled={removeMutation.isPending}
																>
																	<Trash2 className="w-4 h-4" />
																</Button>
															</div>
														))}
													</div>
												</CardContent>
											</CollapsibleContent>
										</Card>
									</Collapsible>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-text-muted bg-muted/50 rounded-lg">
								<Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p>لا يوجد كلاسات مسندة لهذا المعلم</p>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

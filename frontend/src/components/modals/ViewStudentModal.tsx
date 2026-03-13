import { AlertCircle, BookOpen, Loader2, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface ViewStudentModalProps {
	studentId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ViewStudentModal({
	studentId,
	open,
	onOpenChange,
}: ViewStudentModalProps) {
	const {
		data: student,
		isLoading,
		error,
	} = trpc.students.getById.useQuery(studentId || "", {
		enabled: !!studentId && open,
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>تفاصيل الطالب</DialogTitle>
					<DialogDescription>معلومات تفصيلية عن الطالب</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center h-64">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : error ? (
					<div className="flex flex-col items-center justify-center h-64 space-y-4">
						<AlertCircle className="w-12 h-12 text-error" />
						<p className="text-text-muted">{error.message}</p>
					</div>
				) : student ? (
					<div className="space-y-6 mt-4">
						{/* Basic Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<User className="w-5 h-5" />
									المعلومات الأساسية
								</CardTitle>
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-text-muted">الاسم الكامل</p>
									<p className="font-medium">{student.fullName}</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">العمر</p>
									<p className="font-medium">
										{student.age ? `${student.age} سنة` : "غير محدد"}
									</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">تاريخ التسجيل</p>
									<p className="font-medium">
										{student.createdAt &&
											new Date(student.createdAt).toLocaleDateString("ar-EG")}
									</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">الحالة</p>
									<Badge variant={student.isActive ? "success" : "secondary"}>
										{student.isActive ? "نشط" : "غير نشط"}
									</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Parent Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Phone className="w-5 h-5" />
									معلومات ولي الأمر
								</CardTitle>
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-text-muted">اسم ولي الأمر</p>
									<p className="font-medium">{student.parentName}</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">رقم الهاتف</p>
									<p className="font-medium">{student.parentPhone}</p>
								</div>
								<div className="col-span-2">
									<p className="text-sm text-text-muted">العنوان</p>
									<p className="font-medium">{student.address}</p>
								</div>
								<div>
									<p className="text-sm text-text-muted">رقم الطوارئ</p>
									<p className="font-medium">{student.emergencyContact}</p>
								</div>
							</CardContent>
						</Card>

						{/* Class & Enrollments */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BookOpen className="w-5 h-5" />
									الكلاس والكورسات
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-sm text-text-muted">الكلاس</p>
									<p className="font-medium">
										{student.class?.name || "غير مسجل"}
									</p>
								</div>

								{student.enrollments && student.enrollments.length > 0 && (
									<div>
										<p className="text-sm text-text-muted mb-2">
											الكورسات المسجل فيها:
										</p>
										<div className="space-y-2">
											{student.enrollments.map((enrollment) => (
												<div
													key={enrollment.id}
													className="p-3 bg-background-page rounded-lg"
												>
													<div className="flex justify-between items-center">
														<span className="font-medium">
															{enrollment.course?.name}
														</span>
														<Badge variant="outline">
															{enrollment.currentLevel?.levelNumber}
														</Badge>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						<div className="flex justify-end">
							<Button onClick={() => onOpenChange(false)}>إغلاق</Button>
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

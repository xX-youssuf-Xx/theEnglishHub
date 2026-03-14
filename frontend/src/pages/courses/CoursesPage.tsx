import {
	AlertCircle,
	BookOpen,
	Clock,
	Edit,
	Eye,
	GraduationCap,
	Layers,
	Loader2,
	MoreVertical,
	Plus,
	Search,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddCourseModal } from "@/components/modals/AddCourseModal";
import { AddLevelModal } from "@/components/modals/AddLevelModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { EditCourseModal } from "@/components/modals/EditCourseModal";
import { ViewCourseClassesModal } from "@/components/modals/ViewCourseClassesModal";
import { ViewCourseModal } from "@/components/modals/ViewCourseModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

export function CoursesPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const limit = 10;
	const utils = trpc.useUtils();

	// Modal states
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isClassesModalOpen, setIsClassesModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isAddLevelModalOpen, setIsAddLevelModalOpen] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
	const [selectedCourseName, setSelectedCourseName] = useState("");

	const { data, isLoading, error } = trpc.courses.getAll.useQuery();

	const courses =
		data?.data?.filter(
			(course: any) =>
				course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.description?.toLowerCase().includes(searchQuery.toLowerCase()),
		) ?? [];

	const total = courses.length;
	const totalPages = Math.ceil(total / limit);
	const paginatedCourses = courses.slice((page - 1) * limit, page * limit);

	const deleteMutation = trpc.courses.delete.useMutation({
		onSuccess: () => {
			toast.success("تم حذف الكورس وجميع كلاساته وحصصه بنجاح");
			// Invalidate and refetch courses
			utils.courses.getAll.invalidate();
			// Invalidate calendar to reflect deleted sessions
			utils.sessions.getWeeklySchedule.invalidate();
			setIsDeleteModalOpen(false);
			setSelectedCourseId(null);
			setSelectedCourseName("");
		},
		onError: (err) => {
			toast.error(err.message || "حدث خطأ أثناء الحذف");
		},
	});

	const handleView = (courseId: string, courseName: string) => {
		setSelectedCourseId(courseId);
		setSelectedCourseName(courseName);
		setIsViewModalOpen(true);
	};

	const handleEdit = (courseId: string, courseName: string) => {
		setSelectedCourseId(courseId);
		setSelectedCourseName(courseName);
		setIsEditModalOpen(true);
	};

	const handleViewClasses = (courseId: string, courseName: string) => {
		setSelectedCourseId(courseId);
		setSelectedCourseName(courseName);
		setIsClassesModalOpen(true);
	};

	const handleAddLevel = (courseId: string, courseName: string) => {
		setSelectedCourseId(courseId);
		setSelectedCourseName(courseName);
		setIsAddLevelModalOpen(true);
	};

	const handleDelete = (courseId: string, courseName: string) => {
		setSelectedCourseId(courseId);
		setSelectedCourseName(courseName);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = () => {
		if (selectedCourseId) {
			deleteMutation.mutate(selectedCourseId);
		}
	};

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-64 space-y-4">
				<AlertCircle className="w-12 h-12 text-error" />
				<p className="text-text-heading font-medium">
					حدث خطأ في تحميل البيانات
				</p>
				<p className="text-text-muted">{error.message}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-text-heading">
						إدارة الكورسات
					</h1>
					<p className="text-text-muted mt-1">
						إدارة الكورسات والمستويات والكلاسات
					</p>
				</div>
				<Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
					<Plus className="w-4 h-4" />
					إضافة كورس جديد
				</Button>
			</div>

			<Card>
				<CardContent className="p-4">
					<div className="relative">
						<Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
						<Input
							placeholder="البحث بالاسم..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="pr-10"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						{isLoading ? (
							<div className="flex items-center justify-center h-64">
								<Loader2 className="w-8 h-8 animate-spin text-primary" />
							</div>
						) : (
							<>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>الكورس</TableHead>
											<TableHead>المستويات</TableHead>
											<TableHead>الطلاب</TableHead>
											<TableHead>الحصص/الشهر</TableHead>
											<TableHead>الحالة</TableHead>
											<TableHead className="text-left">الإجراءات</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedCourses.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center py-8 text-text-muted"
												>
													لا توجد كورسات
												</TableCell>
											</TableRow>
										) : (
											paginatedCourses.map((course: any) => (
												<TableRow key={course.id} className="h-14">
													<TableCell className="py-2">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
																<BookOpen className="w-4 h-4 text-primary" />
															</div>
															<div>
																<p className="font-medium text-text-heading">
																	{course.name}
																</p>
																{course.description && (
																	<p className="text-xs text-text-muted truncate max-w-[200px]">
																		{course.description}
																	</p>
																)}
															</div>
														</div>
													</TableCell>
													<TableCell className="py-2">
														<div className="flex items-center gap-2">
															<Layers className="w-4 h-4 text-text-muted" />
															<span className="text-sm">
																{course.levels?.length || 0} مستوى
															</span>
														</div>
													</TableCell>
													<TableCell className="py-2">
														<div className="flex items-center gap-2">
															<Users className="w-4 h-4 text-text-muted" />
															<span className="text-sm">
																{course.enrollmentCount || 0} طالب
															</span>
														</div>
													</TableCell>
													<TableCell className="py-2">
														<div className="flex items-center gap-2">
															<Clock className="w-4 h-4 text-text-muted" />
															<span className="text-sm">
																{course.sessionsPerMonth || 4} حصة
															</span>
														</div>
													</TableCell>
													<TableCell className="py-2">
														<Badge
															variant={
																course.isActive ? "success" : "secondary"
															}
														>
															{course.isActive ? "نشط" : "غير نشط"}
														</Badge>
													</TableCell>
													<TableCell className="text-left py-2">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon">
																	<MoreVertical className="w-4 h-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent
																align="start"
																side="bottom"
																sideOffset={8}
																className="min-w-[160px]"
															>
																<DropdownMenuItem
																	onClick={() =>
																		handleView(course.id, course.name)
																	}
																	className="flex justify-end gap-1.5"
																>
																	<span>عرض التفاصيل</span>
																	<Eye className="w-4 h-4" />
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleViewClasses(course.id, course.name)
																	}
																	className="flex justify-end gap-1.5"
																>
																	<span>عرض الكلاسات</span>
																	<GraduationCap className="w-4 h-4" />
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleAddLevel(course.id, course.name)
																	}
																	className="flex justify-end gap-1.5"
																>
																	<span>إضافة مستوى</span>
																	<Layers className="w-4 h-4" />
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleEdit(course.id, course.name)
																	}
																	className="flex justify-end gap-1.5"
																>
																	<span>تعديل</span>
																	<Edit className="w-4 h-4" />
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleDelete(course.id, course.name)
																	}
																	className="flex justify-end gap-1.5 text-error"
																>
																	<span>حذف</span>
																	<Trash2 className="w-4 h-4" />
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>

								{/* Pagination */}
								{totalPages > 1 && (
									<div className="flex items-center justify-between px-4 py-4 border-t border-border-divider">
										<div className="text-sm text-text-muted">
											الصفحة {page} من {totalPages} (إجمالي: {total})
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setPage((p) => Math.max(1, p - 1))}
												disabled={page === 1}
											>
												السابق
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setPage((p) => Math.min(totalPages, p + 1))
												}
												disabled={page === totalPages}
											>
												التالي
											</Button>
										</div>
									</div>
								)}
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Modals */}
			<AddCourseModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
			/>

			<ViewCourseModal
				courseId={selectedCourseId}
				open={isViewModalOpen}
				onOpenChange={setIsViewModalOpen}
			/>

			<EditCourseModal
				courseId={selectedCourseId}
				courseName={selectedCourseName}
				open={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
			/>

			<ViewCourseClassesModal
				courseId={selectedCourseId}
				courseName={selectedCourseName}
				isOpen={isClassesModalOpen}
				onClose={() => {
					setIsClassesModalOpen(false);
					setSelectedCourseId(null);
					setSelectedCourseName("");
				}}
			/>

			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setSelectedCourseId(null);
					setSelectedCourseName("");
				}}
				onConfirm={confirmDelete}
				title="حذف الكورس"
				description={`هل أنت متأكد من حذف الكورس "${selectedCourseName}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
				isLoading={deleteMutation.isPending}
			/>

			<AddLevelModal
				isOpen={isAddLevelModalOpen}
				onClose={() => {
					setIsAddLevelModalOpen(false);
					setSelectedCourseId(null);
					setSelectedCourseName("");
				}}
				courseId={selectedCourseId}
				courseName={selectedCourseName}
			/>
		</div>
	);
}

import {
	AlertCircle,
	CalendarDays,
	Edit,
	Eye,
	GraduationCap,
	Loader2,
	MoreVertical,
	Phone,
	Plus,
	Search,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddTeacherModal } from "@/components/modals/AddTeacherModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { EditTeacherModal } from "@/components/modals/EditTeacherModal";
import { ManageTeacherClassesModal } from "@/components/modals/ManageTeacherClassesModal";
import { ViewTeacherModal } from "@/components/modals/ViewTeacherModal";
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { trpc } from "@/lib/trpc";

export function TeachersPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 400);
	const [page, setPage] = useState(1);
	const limit = 10;

	// Modal states
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isManageClassesModalOpen, setIsManageClassesModalOpen] =
		useState(false);
	const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
		null,
	);
	const [selectedTeacherName, setSelectedTeacherName] = useState("");

	const { data, isLoading, error } = trpc.teachers.getAll.useQuery({
		page,
		limit,
		search: debouncedSearchQuery || undefined,
	});

	const utils = trpc.useUtils();

	const deleteMutation = trpc.teachers.delete.useMutation({
		onSuccess: () => {
			toast.success("تم حذف المعلم بنجاح");
			utils.teachers.getAll.invalidate();
			setIsDeleteModalOpen(false);
			setSelectedTeacherId(null);
			setSelectedTeacherName("");
		},
		onError: (err) => {
			toast.error(err.message || "حدث خطأ أثناء الحذف");
		},
	});

	const teachers = data?.data ?? [];
	const total = data?.pagination?.total ?? 0;
	const totalPages = data?.pagination?.totalPages ?? 1;

	const handleView = (teacherId: string) => {
		setSelectedTeacherId(teacherId);
		setIsViewModalOpen(true);
	};

	const handleEdit = (teacherId: string) => {
		setSelectedTeacherId(teacherId);
		setIsEditModalOpen(true);
	};

	const handleDelete = (teacherId: string, teacherName: string) => {
		setSelectedTeacherId(teacherId);
		setSelectedTeacherName(teacherName);
		setIsDeleteModalOpen(true);
	};

	const handleManageClasses = (teacherId: string, teacherName: string) => {
		setSelectedTeacherId(teacherId);
		setSelectedTeacherName(teacherName);
		setIsManageClassesModalOpen(true);
	};

	const confirmDelete = () => {
		if (selectedTeacherId) {
			deleteMutation.mutate(selectedTeacherId);
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
						إدارة المعلمين
					</h1>
					<p className="text-text-muted mt-1">
						إدارة بيانات المعلمين والكلاسات
					</p>
				</div>
				<Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
					<Plus className="w-4 h-4" />
					إضافة معلم جديد
				</Button>
			</div>

			<Card>
				<CardContent className="p-4">
					<div className="relative">
						<Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
						<Input
							placeholder="البحث بالاسم، رقم الهاتف..."
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
											<TableHead>المعلم</TableHead>
											<TableHead>الكلاسات</TableHead>
											<TableHead className="text-left">الإجراءات</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{teachers.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={3}
													className="text-center py-8 text-text-muted"
												>
													لا يوجد معلمين
												</TableCell>
											</TableRow>
										) : (
											teachers.map((teacher) => (
												<TableRow key={teacher.id} className="h-14">
													<TableCell className="py-2">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center">
																<GraduationCap className="w-4 h-4 text-accent-cyan" />
															</div>
															<div>
																<p className="font-medium text-text-heading">
																	{teacher.fullName}
																</p>
																{teacher.phone && (
																	<p className="text-xs text-text-muted flex items-center gap-1">
																		<Phone className="w-3 h-3" />
																		{teacher.phone}
																	</p>
																)}
															</div>
														</div>
													</TableCell>
													<TableCell className="py-2">
														<div className="flex items-center gap-2">
															<Users className="w-4 h-4 text-text-muted" />
															<span className="text-sm">
																{teacher.classes?.length || 0} كلاس
															</span>
														</div>
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
																	onClick={() => handleView(teacher.id)}
																	className="flex justify-end gap-1.5"
																>
																	<span>عرض التفاصيل</span>
																	<Eye className="w-4 h-4" />
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleManageClasses(
																			teacher.id,
																			teacher.fullName,
																		)
																	}
																	className="flex justify-end gap-1.5"
																>
																	<span>إدارة الكلاسات</span>
																	<CalendarDays className="w-4 h-4" />
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleEdit(teacher.id)}
																	className="flex justify-end gap-1.5"
																>
																	<span>تعديل</span>
																	<Edit className="w-4 h-4" />
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleDelete(teacher.id, teacher.fullName)
																	}
																	className="text-error flex justify-end gap-1.5"
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
			<AddTeacherModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
			/>

			<ViewTeacherModal
				isOpen={isViewModalOpen}
				onClose={() => {
					setIsViewModalOpen(false);
					setSelectedTeacherId(null);
				}}
				teacherId={selectedTeacherId}
			/>

			<EditTeacherModal
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setSelectedTeacherId(null);
				}}
				teacherId={selectedTeacherId}
			/>

			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setSelectedTeacherId(null);
					setSelectedTeacherName("");
				}}
				onConfirm={confirmDelete}
				title="حذف المعلم"
				description={`هل أنت متأكد من حذف المعلم "${selectedTeacherName}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
				isLoading={deleteMutation.isPending}
			/>

			<ManageTeacherClassesModal
				isOpen={isManageClassesModalOpen}
				onClose={() => {
					setIsManageClassesModalOpen(false);
					setSelectedTeacherId(null);
					setSelectedTeacherName("");
				}}
				teacherId={selectedTeacherId}
				teacherName={selectedTeacherName}
			/>
		</div>
	);
}

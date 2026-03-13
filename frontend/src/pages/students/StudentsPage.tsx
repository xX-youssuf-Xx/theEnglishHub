import {
	AlertCircle,
	BookOpen,
	Edit,
	Eye,
	GraduationCap,
	Loader2,
	MoreVertical,
	Phone,
	Plus,
	Search,
	Trash2,
	User,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { AddStudentModal } from "@/components/modals/AddStudentModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { EditStudentModal } from "@/components/modals/EditStudentModal";
import { EnrollInCourseModal } from "@/components/modals/EnrollInCourseModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { ViewStudentModal } from "@/components/modals/ViewStudentModal";
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
import { Toaster } from "@/components/ui/toaster";
import { trpc } from "@/lib/trpc";

export function StudentsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const limit = 10;

	// Modal states
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [enrollModalOpen, setEnrollModalOpen] = useState(false);
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
		null,
	);
	const [selectedStudentName, setSelectedStudentName] = useState("");

	const { data, isLoading, error } = trpc.students.getAll.useQuery({
		page,
		limit,
		search: searchQuery || undefined,
	});

	const students = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / limit);

	const utils = trpc.useUtils();
	const deleteMutation = trpc.students.delete.useMutation({
		onSuccess: () => {
			utils.students.getAll.invalidate();
			setDeleteModalOpen(false);
			setSelectedStudentId(null);
			setSelectedStudentName("");
		},
	});

	const handleView = (studentId: string) => {
		setSelectedStudentId(studentId);
		setViewModalOpen(true);
	};

	const handleEdit = (studentId: string, studentName: string) => {
		setSelectedStudentId(studentId);
		setSelectedStudentName(studentName);
		setEditModalOpen(true);
	};

	const handleRecordPayment = (studentId: string, studentName: string) => {
		setSelectedStudentId(studentId);
		setSelectedStudentName(studentName);
		setPaymentModalOpen(true);
	};

	const handleDelete = (studentId: string, studentName: string) => {
		setSelectedStudentId(studentId);
		setSelectedStudentName(studentName);
		setDeleteModalOpen(true);
	};

	const handleEnroll = (studentId: string, studentName: string) => {
		setSelectedStudentId(studentId);
		setSelectedStudentName(studentName);
		setEnrollModalOpen(true);
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
			<Toaster />

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-text-heading">إدارة الطلاب</h1>
					<p className="text-text-muted mt-1">إدارة بيانات الطلاب والتسجيل</p>
				</div>
				<Button className="gap-2" onClick={() => setAddModalOpen(true)}>
					<Plus className="w-4 h-4" />
					إضافة طالب جديد
				</Button>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
							<Input
								placeholder="البحث بالاسم، رقم الهاتف، أو ولي الأمر..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setPage(1);
								}}
								className="pr-10"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Students Table */}
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
											<TableHead>الطالب</TableHead>
											<TableHead>ولي الأمر</TableHead>
											<TableHead>الكلاس</TableHead>
											<TableHead>الكورسات</TableHead>
											<TableHead>تاريخ التسجيل</TableHead>
											<TableHead className="text-left">الإجراءات</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{students.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center py-8 text-text-muted"
												>
													لا يوجد طلاب
												</TableCell>
											</TableRow>
										) : (
											students.map((student) => (
												<TableRow key={student.id}>
													<TableCell>
														<div className="flex items-center gap-3">
															<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
																<User className="w-5 h-5 text-primary" />
															</div>
															<div>
																<p className="font-medium text-text-heading">
																	{student.fullName}
																</p>
																{student.age && (
																	<p className="text-sm text-text-muted">
																		{student.age} سنة
																	</p>
																)}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<div>
															<p className="font-medium">
																{student.parentName}
															</p>
															{student.parentPhone && (
																<p className="text-sm text-text-muted flex items-center gap-1">
																	<Phone className="w-3 h-3" />
																	{student.parentPhone}
																</p>
															)}
														</div>
													</TableCell>
													<TableCell>
														<span className="text-sm">
															{student.class?.name || "غير مسجل"}
														</span>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-1">
															<BookOpen className="w-4 h-4 text-text-muted" />
															<span>{student.enrollments?.length || 0}</span>
														</div>
													</TableCell>
													<TableCell>
														{student.createdAt &&
															new Date(student.createdAt).toLocaleDateString(
																"ar-EG",
															)}
													</TableCell>
													<TableCell className="text-left">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon">
																	<MoreVertical className="w-4 h-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem
																	onClick={() => handleView(student.id)}
																>
																	<Eye className="w-4 h-4 ml-2" />
																	عرض التفاصيل
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleEdit(student.id, student.fullName)
																	}
																>
																	<Edit className="w-4 h-4 ml-2" />
																	تعديل
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleEnroll(student.id, student.fullName)
																	}
																>
																	<GraduationCap className="w-4 h-4 ml-2" />
																	تسجيل في كورس
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleRecordPayment(
																			student.id,
																			student.fullName,
																		)
																	}
																>
																	<Wallet className="w-4 h-4 ml-2" />
																	تسجيل الدفع
																</DropdownMenuItem>
																<DropdownMenuItem
																	className="text-error"
																	onClick={() =>
																		handleDelete(student.id, student.fullName)
																	}
																>
																	<Trash2 className="w-4 h-4 ml-2" />
																	حذف
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
			<AddStudentModal open={addModalOpen} onOpenChange={setAddModalOpen} />

			<ViewStudentModal
				studentId={selectedStudentId}
				open={viewModalOpen}
				onOpenChange={setViewModalOpen}
			/>

			<EditStudentModal
				studentId={selectedStudentId}
				open={editModalOpen}
				onOpenChange={setEditModalOpen}
			/>

			<RecordPaymentModal
				studentId={selectedStudentId}
				open={paymentModalOpen}
				onOpenChange={setPaymentModalOpen}
			/>

			<DeleteConfirmationModal
				isOpen={deleteModalOpen}
				onClose={() => {
					setDeleteModalOpen(false);
					setSelectedStudentId(null);
					setSelectedStudentName("");
				}}
				onConfirm={() => {
					if (selectedStudentId) {
						deleteMutation.mutate(selectedStudentId);
					}
				}}
				title="حذف الطالب"
				description={`هل أنت متأكد من حذف الطالب "${selectedStudentName}"؟`}
			/>

			<EnrollInCourseModal
				isOpen={enrollModalOpen}
				onClose={() => {
					setEnrollModalOpen(false);
					setSelectedStudentId(null);
					setSelectedStudentName("");
				}}
				studentId={selectedStudentId}
				studentName={selectedStudentName}
			/>
		</div>
	);
}

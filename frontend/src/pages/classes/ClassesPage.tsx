import {
	AlertCircle,
	Calendar,
	Edit,
	Eye,
	GraduationCap,
	Loader2,
	MoreVertical,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { AddClassModal } from "@/components/modals/AddClassModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { EditClassModal } from "@/components/modals/EditClassModal";
import { ViewClassModal } from "@/components/modals/ViewClassModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

const daysOfWeek = [
	"الأحد",
	"الإثنين",
	"الثلاثاء",
	"الأربعاء",
	"الخميس",
	"الجمعة",
	"السبت",
];

export function ClassesPage() {
	const [page, setPage] = useState(1);
	const limit = 10;

	// Modal states
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
	const [selectedClassName, setSelectedClassName] = useState("");

	const { data, isLoading, error } = trpc.classes.getAll.useQuery({
		page,
		limit,
	});

	const deleteMutation = trpc.classes.delete.useMutation({
		onSuccess: () => {
			setIsDeleteModalOpen(false);
			setSelectedClassId(null);
			setSelectedClassName("");
		},
	});

	const classes = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / limit);

	const handleView = (classId: string) => {
		setSelectedClassId(classId);
		setIsViewModalOpen(true);
	};

	const handleEdit = (classId: string) => {
		setSelectedClassId(classId);
		setIsEditModalOpen(true);
	};

	const handleDelete = (classId: string, className: string) => {
		setSelectedClassId(classId);
		setSelectedClassName(className);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = () => {
		if (selectedClassId) {
			deleteMutation.mutate(selectedClassId);
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
						إدارة الكلاسات
					</h1>
					<p className="text-text-muted mt-1">
						إدارة الكلاسات والجداول الدراسية
					</p>
				</div>
				<Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
					<Plus className="w-4 h-4" />
					إضافة كلاس جديد
				</Button>
			</div>

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
											<TableHead>الكلاس</TableHead>
											<TableHead>المعلم</TableHead>
											<TableHead>الجدول</TableHead>
											<TableHead>الطلاب</TableHead>
											<TableHead>التقدم</TableHead>
											<TableHead className="text-left">الإجراءات</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{classes.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center py-8 text-text-muted"
												>
													لا توجد كلاسات
												</TableCell>
											</TableRow>
										) : (
											classes.map((cls) => (
												<TableRow key={cls.id}>
													<TableCell>
														<div>
															<p className="font-medium text-text-heading">
																{cls.name}
															</p>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<GraduationCap className="w-4 h-4 text-text-muted" />
															<span>{cls.teacher?.fullName || "غير محدد"}</span>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<Calendar className="w-4 h-4 text-text-muted" />
															<span className="text-sm">
																{cls.scheduleDayOfWeek !== undefined
																	? `${daysOfWeek[cls.scheduleDayOfWeek]} - ${cls.scheduleStartTime || ""}`
																	: "غير محدد"}
															</span>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<Users className="w-4 h-4 text-text-muted" />
															<span>{cls.students?.length || 0} طالب</span>
														</div>
													</TableCell>
													<TableCell>
														<div className="w-full max-w-[120px]">
															<div className="flex justify-between text-xs mb-1">
																<span>الحصص</span>
																<span>{cls.totalSessions || 0}</span>
															</div>
															<div className="h-2 bg-border-divider rounded-full overflow-hidden">
																<div
																	className="h-full bg-primary transition-all"
																	style={{
																		width: `${Math.min(100, ((cls.completedSessions || 0) / Math.max(1, cls.totalSessions || 1)) * 100)}%`,
																	}}
																/>
															</div>
														</div>
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
																	onClick={() => handleView(cls.id)}
																>
																	<Eye className="w-4 h-4 ml-2" />
																	عرض التفاصيل
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleEdit(cls.id)}
																>
																	<Edit className="w-4 h-4 ml-2" />
																	تعديل
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleDelete(cls.id, cls.name)}
																	className="text-error"
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
			<AddClassModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
			/>

			<ViewClassModal
				isOpen={isViewModalOpen}
				onClose={() => {
					setIsViewModalOpen(false);
					setSelectedClassId(null);
				}}
				classId={selectedClassId}
			/>

			<EditClassModal
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setSelectedClassId(null);
				}}
				classId={selectedClassId}
			/>

			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setSelectedClassId(null);
					setSelectedClassName("");
				}}
				onConfirm={confirmDelete}
				title="حذف الكلاس"
				description={`هل أنت متأكد من حذف الكلاس "${selectedClassName}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}

import {
	GraduationCap,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Users,
	Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface ViewTeacherModalProps {
	isOpen: boolean;
	onClose: () => void;
	teacherId: string | null;
}

export function ViewTeacherModal({
	isOpen,
	onClose,
	teacherId,
}: ViewTeacherModalProps) {
	const { data: teacher, isLoading } = trpc.teachers.getById.useQuery(
		teacherId || "",
		{ enabled: !!teacherId },
	);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px]" dir="rtl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<GraduationCap className="w-6 h-6 text-accent-cyan" />
						تفاصيل المعلم
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center h-32">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : teacher ? (
					<div className="space-y-6 mt-4">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-accent-cyan/10 flex items-center justify-center">
								<GraduationCap className="w-8 h-8 text-accent-cyan" />
							</div>
							<div>
								<h3 className="text-xl font-bold text-text-heading">
									{teacher.fullName}
								</h3>
								<Badge variant={teacher.isActive ? "success" : "secondary"}>
									{teacher.isActive ? "نشط" : "غير نشط"}
								</Badge>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{teacher.phone && (
								<div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg">
									<Phone className="w-5 h-5 text-text-muted" />
									<div>
										<p className="text-sm text-text-muted">رقم الهاتف</p>
										<p className="font-medium">{teacher.phone}</p>
									</div>
								</div>
							)}

							{teacher.email && (
								<div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg">
									<Mail className="w-5 h-5 text-text-muted" />
									<div>
										<p className="text-sm text-text-muted">البريد الإلكتروني</p>
										<p className="font-medium">{teacher.email}</p>
									</div>
								</div>
							)}

							{teacher.address && (
								<div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg md:col-span-2">
									<MapPin className="w-5 h-5 text-text-muted" />
									<div>
										<p className="text-sm text-text-muted">العنوان</p>
										<p className="font-medium">{teacher.address}</p>
									</div>
								</div>
							)}
						</div>

						<div className="border-t border-border-divider pt-4">
							<h4 className="font-semibold mb-3 flex items-center gap-2">
								<Users className="w-5 h-5 text-accent-cyan" />
								الكلاسات ({teacher.classes?.length || 0})
							</h4>
							{teacher.classes && teacher.classes.length > 0 ? (
								<div className="space-y-2">
									{teacher.classes.map((cls: any) => (
										<div
											key={cls.id}
											className="p-3 bg-bg-light rounded-lg flex justify-between items-center"
										>
											<span className="font-medium">{cls.name}</span>
											<div className="flex items-center gap-2 text-sm text-text-muted">
												<Wallet className="w-4 h-4" />
												<span>{cls.paymentAmount} جنيه</span>
												<span className="text-xs">
													(كل {cls.paymentCycle} حصص)
												</span>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-text-muted text-center py-4">
									لا يوجد كلاسات مسندة
								</p>
							)}
						</div>

						<div className="flex justify-end">
							<Button onClick={onClose}>إغلاق</Button>
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

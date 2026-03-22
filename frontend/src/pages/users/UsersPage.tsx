import { Loader2, Plus, ShieldUser, UserCog, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

export function UsersPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		role: "assistant" as "admin" | "assistant",
	});

	const utils = trpc.useUtils();
	const { data, isLoading } = trpc.auth.getUsers.useQuery();

	const createUserMutation = trpc.auth.createUser.useMutation({
		onSuccess: () => {
			toast.success("تم إنشاء المستخدم بنجاح");
			setIsCreateOpen(false);
			setFormData({ username: "", password: "", role: "assistant" });
			utils.auth.getUsers.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "حدث خطأ أثناء إنشاء المستخدم");
		},
	});

	const handleCreateUser = () => {
		if (!formData.username || !formData.password) {
			toast.error("الرجاء إدخال اسم المستخدم وكلمة المرور");
			return;
		}

		createUserMutation.mutate({
			username: formData.username,
			password: formData.password,
			role: formData.role,
		});
	};

	return (
		<div className="space-y-6" dir="rtl">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-text-heading">المستخدمون</h1>
					<p className="text-text-muted mt-1">
						إدارة حسابات المدراء والمساعدين
					</p>
				</div>
				<Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
					<Plus className="w-4 h-4" />
					إضافة مستخدم
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserCog className="w-5 h-5" />
						قائمة المستخدمين
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center h-40">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>اسم المستخدم</TableHead>
										<TableHead>الدور</TableHead>
										<TableHead>آخر دخول</TableHead>
										<TableHead>الحالة</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(data?.data || []).map((user) => (
										<TableRow key={user.id}>
											<TableCell>
												<div className="flex items-center gap-2 font-medium">
													<UserRound className="w-4 h-4 text-text-muted" />
													{user.username}
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														user.role === "admin" ? "default" : "secondary"
													}
												>
													{user.role === "admin" ? "مدير" : "مساعد"}
												</Badge>
											</TableCell>
											<TableCell>
												{user.lastLogin
													? new Date(user.lastLogin).toLocaleString("ar-EG")
													: "-"}
											</TableCell>
											<TableCell>
												<Badge variant={user.isActive ? "success" : "outline"}>
													{user.isActive ? "نشط" : "موقوف"}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<ShieldUser className="w-5 h-5" />
						صلاحيات المساعد (ثابتة حالياً)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid md:grid-cols-2 gap-3 text-sm">
						<div className="p-3 rounded-lg border bg-muted/40">
							الوصول الكامل لصفحة الطلاب
						</div>
						<div className="p-3 rounded-lg border bg-muted/40">
							الوصول الجزئي لصفحة المدفوعات
						</div>
						<div className="p-3 rounded-lg border bg-muted/40">
							تسوية رسوم التسجيل والكتب فقط
						</div>
						<div className="p-3 rounded-lg border bg-muted/40">
							إخفاء دفعات المعلمين والمصروفات
						</div>
					</div>
				</CardContent>
			</Card>

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent dir="rtl">
					<DialogHeader>
						<DialogTitle>إضافة مستخدم جديد</DialogTitle>
						<DialogDescription>أنشئ حساب مدير أو مساعد</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="username">اسم المستخدم</Label>
							<Input
								id="username"
								value={formData.username}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, username: e.target.value }))
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">كلمة المرور</Label>
							<Input
								id="password"
								type="password"
								value={formData.password}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, password: e.target.value }))
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>الدور</Label>
							<Select
								value={formData.role}
								onValueChange={(value: "admin" | "assistant") =>
									setFormData((prev) => ({ ...prev, role: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="assistant">مساعد</SelectItem>
									<SelectItem value="admin">مدير</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
							إلغاء
						</Button>
						<Button
							onClick={handleCreateUser}
							disabled={createUserMutation.isPending}
						>
							{createUserMutation.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								"إنشاء"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

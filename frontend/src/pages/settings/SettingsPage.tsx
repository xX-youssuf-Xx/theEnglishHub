import {
	AlertCircle,
	Edit,
	Loader2,
	Plus,
	Shield,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

// Default permissions structure
const defaultPermissions = [
	{ id: 1, name: "إضافة/تعديل الطلاب", key: "manage_students", enabled: true },
	{
		id: 2,
		name: "إضافة/تعديل المعلمين",
		key: "manage_teachers",
		enabled: true,
	},
	{ id: 3, name: "تعديل الكلاسات", key: "manage_classes", enabled: false },
	{
		id: 4,
		name: "عرض التقارير المالية",
		key: "view_financial_reports",
		enabled: false,
	},
	{ id: 5, name: "تسجيل المدفوعات", key: "record_payments", enabled: true },
	{ id: 6, name: "حذف السجلات", key: "delete_records", enabled: false },
];

export function SettingsPage() {
	const [permissions, setPermissions] = useState(defaultPermissions);

	// Get current user info
	const { data: currentUser, isLoading: isLoadingUser } =
		trpc.auth.me.useQuery();

	// Check if user is admin
	const isAdmin = currentUser?.role === "admin";

	const togglePermission = (id: number) => {
		setPermissions(
			permissions.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
		);
	};

	if (isLoadingUser) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className="flex flex-col items-center justify-center h-64 space-y-4">
				<AlertCircle className="w-12 h-12 text-warning" />
				<p className="text-text-heading font-medium">غير مصرح</p>
				<p className="text-text-muted">فقط المدير يمكنه الوصول لهذه الصفحة</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-text-heading">الإعدادات</h1>
				<p className="text-text-muted mt-1">إدارة المستخدمين والصلاحيات</p>
			</div>

			<Tabs defaultValue="users" className="space-y-6">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="users" className="gap-2">
						<Users className="w-4 h-4" />
						المستخدمين
					</TabsTrigger>
					<TabsTrigger value="permissions" className="gap-2">
						<Shield className="w-4 h-4" />
						الصلاحيات
					</TabsTrigger>
				</TabsList>

				<TabsContent value="users" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>المستخدمين</CardTitle>
								<CardDescription>إدارة حسابات المستخدمين</CardDescription>
							</div>
							<Button size="sm" className="gap-2">
								<Plus className="w-4 h-4" />
								إضافة مستخدم
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-left">الإجراءات</TableHead>
											<TableHead>الدور</TableHead>
											<TableHead>اسم المستخدم</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow>
											<TableCell className="text-left">
												<div className="flex items-center gap-2">
													<Button variant="ghost" size="icon">
														<Edit className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-error"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="default">
													{currentUser?.role === "admin" ? "مدير" : "مساعد"}
												</Badge>
											</TableCell>
											<TableCell className="font-medium">
												{currentUser?.username}
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="permissions" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>صلاحيات المساعد</CardTitle>
							<CardDescription>
								تحديد الصلاحيات المتاحة لدور المساعد
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{permissions.map((permission) => (
									<div
										key={permission.id}
										className="flex items-center justify-between p-4 rounded-lg border border-border-divider"
									>
										<div className="flex items-center gap-3">
											<Shield className="w-5 h-5 text-primary" />
											<span className="font-medium">{permission.name}</span>
										</div>
										<Switch
											checked={permission.enabled}
											onCheckedChange={() => togglePermission(permission.id)}
										/>
									</div>
								))}
							</div>

							<div className="mt-6 flex justify-end">
								<Button>حفظ التغييرات</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

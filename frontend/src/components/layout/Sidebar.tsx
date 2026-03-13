import {
	BarChart3,
	BookOpen,
	Calendar,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	GraduationCap,
	LayoutDashboard,
	LogOut,
	Settings,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
	isMobileOpen: boolean;
	setIsMobileOpen: (open: boolean) => void;
	collapsed: boolean;
	setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
	path: string;
	label: string;
	icon: React.ElementType;
	children?: NavItem[];
}

const navItems: NavItem[] = [
	{ path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
	{
		path: "/calendar",
		label: "التقويم",
		icon: Calendar,
	},
	{ path: "/students", label: "الطلاب", icon: Users },
	{ path: "/teachers", label: "المعلمين", icon: GraduationCap },
	{ path: "/courses", label: "الكورسات", icon: BookOpen },
	{ path: "/payments", label: "المدفوعات", icon: CreditCard },
	{ path: "/reports", label: "التقارير", icon: BarChart3 },
	{ path: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar({
	isMobileOpen,
	setIsMobileOpen,
	collapsed,
	setCollapsed,
}: SidebarProps) {
	const { user, logout, hasPermission } = useAuth();
	const location = useLocation();
	const [_expandedMenus, _setExpandedMenus] = useState<string[]>([]);

	const filteredNavItems = navItems.filter((item) => {
		if (item.path === "/settings") return hasPermission("view_settings");
		if (item.path === "/reports") return hasPermission("view_reports");
		return true;
	});

	const isActive = (path: string) => {
		return (
			location.pathname === path || location.pathname.startsWith(`${path}/`)
		);
	};

	return (
		<>
			{/* Mobile Overlay */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 lg:hidden"
					onClick={() => setIsMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed top-0 right-0 z-50 h-screen sidebar-gradient transition-all duration-300 ease-in-out",
					collapsed ? "w-20" : "w-64",
					isMobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
				)}
			>
				{/* Logo Area */}
				<div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
					{!collapsed && (
						<div className="flex items-center gap-3">
							<img src="/logo.svg" alt="Logo" className="w-8 h-8" />
							<span className="text-white font-bold text-lg">
								The English Hub
							</span>
						</div>
					)}
					{collapsed && (
						<img src="/logo.svg" alt="Logo" className="w-8 h-8 mx-auto" />
					)}

					<button
						onClick={() => setCollapsed(!collapsed)}
						className="hidden lg:flex text-white/70 hover:text-white transition-colors"
					>
						{collapsed ? (
							<ChevronLeft className="w-5 h-5" />
						) : (
							<ChevronRight className="w-5 h-5" />
						)}
					</button>

					<button
						onClick={() => setIsMobileOpen(false)}
						className="lg:hidden text-white/70 hover:text-white"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-3 py-6 overflow-y-auto">
					<ul className="space-y-1">
						{filteredNavItems.map((item) => {
							const Icon = item.icon;
							const active = isActive(item.path);

							return (
								<li key={item.path}>
									<NavLink
										to={item.path}
										onClick={() => setIsMobileOpen(false)}
										className={cn(
											"flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
											active
												? "bg-primary text-white"
												: "text-white/70 hover:bg-white/10 hover:text-white",
										)}
									>
										<Icon
											className={cn(
												"w-5 h-5 flex-shrink-0",
												active
													? "text-white"
													: "text-white/70 group-hover:text-white",
											)}
										/>
										{!collapsed && (
											<span className="font-medium">{item.label}</span>
										)}
									</NavLink>
								</li>
							);
						})}
					</ul>
				</nav>

				{/* User Section */}
				<div className="border-t border-white/10 p-4">
					{!collapsed ? (
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
									<span className="text-primary-dark font-bold">
										{user?.username?.charAt(0).toUpperCase() || "U"}
									</span>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-white font-medium truncate">
										{user?.username}
									</p>
									<p className="text-white/60 text-sm">
										{user?.role === "admin" ? "مدير" : "مساعد"}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={logout}
								className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10"
							>
								<LogOut className="w-4 h-4" />
								<span>تسجيل الخروج</span>
							</Button>
						</div>
					) : (
						<Button
							variant="ghost"
							size="icon"
							onClick={logout}
							className="w-full text-white/70 hover:text-white hover:bg-white/10"
						>
							<LogOut className="w-5 h-5" />
						</Button>
					)}
				</div>
			</aside>
		</>
	);
}

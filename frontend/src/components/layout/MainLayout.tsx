import { useState } from "react";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
	children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className="min-h-screen bg-background-page">
			<Sidebar
				isMobileOpen={isMobileOpen}
				setIsMobileOpen={setIsMobileOpen}
				collapsed={collapsed}
				setCollapsed={setCollapsed}
			/>

			<div
				className={cn(
					"transition-all duration-300 ease-in-out",
					collapsed ? "lg:mr-20" : "lg:mr-64",
				)}
			>
				<Header onMenuClick={() => setIsMobileOpen(true)} />

				<main className="p-4 lg:p-6">{children}</main>
			</div>
		</div>
	);
}

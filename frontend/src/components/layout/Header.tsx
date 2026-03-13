import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const [showSearch, setShowSearch] = useState(false);

	return (
		<header className="sticky top-0 z-30 bg-background-card border-b border-border-divider shadow-sm">
			<div className="flex items-center justify-between h-16 px-4 lg:px-6">
				{/* Right Section - Menu Button & Title */}
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={onMenuClick}
						className="lg:hidden"
					>
						<Menu className="w-6 h-6" />
					</Button>

					<h1 className="text-xl font-bold text-text-heading hidden sm:block">
						The English Hub
					</h1>
				</div>

				{/* Center/Left Section - Search & Notifications */}
				<div className="flex items-center gap-3">
					{/* Search */}
					<div
						className={`
            transition-all duration-300 overflow-hidden
            ${showSearch ? "w-48 sm:w-64" : "w-0 sm:w-64 sm:overflow-visible"}
          `}
					>
						<div className="relative hidden sm:block">
							<Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
							<Input
								type="search"
								placeholder="بحث..."
								className="pr-10 w-full"
							/>
						</div>
					</div>

					<Button
						variant="ghost"
						size="icon"
						className="sm:hidden"
						onClick={() => setShowSearch(!showSearch)}
					>
						<Search className="w-5 h-5" />
					</Button>

					{/* Notifications */}
					<Button variant="ghost" size="icon" className="relative">
						<Bell className="w-5 h-5" />
						<span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
					</Button>
				</div>
			</div>

			{/* Mobile Search Bar */}
			{showSearch && (
				<div className="sm:hidden px-4 pb-3">
					<div className="relative">
						<Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
						<Input
							type="search"
							placeholder="بحث..."
							className="pr-10 w-full"
							autoFocus
						/>
					</div>
				</div>
			)}
		</header>
	);
}

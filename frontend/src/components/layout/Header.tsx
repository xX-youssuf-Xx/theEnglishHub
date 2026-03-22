import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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

				<div />
			</div>
		</header>
	);
}

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-white hover:bg-primary-dark",
				secondary:
					"border-transparent bg-primary-light text-primary-dark hover:bg-primary-light/80",
				destructive: "border-transparent bg-error text-white hover:bg-error/80",
				outline: "text-text-body",
				success:
					"border-transparent bg-success/10 text-success border-success/20",
				warning:
					"border-transparent bg-warning/10 text-warning border-warning/20",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };

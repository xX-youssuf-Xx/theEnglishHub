import { BookOpen, Clock, Layers, Link2, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface ViewCourseModalProps {
	courseId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ViewCourseModal({
	courseId,
	open,
	onOpenChange,
}: ViewCourseModalProps) {
	const { data: course, isLoading } = trpc.courses.getById.useQuery(
		courseId || "",
		{ enabled: !!courseId },
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto"
				dir="rtl"
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<BookOpen className="w-6 h-6 text-primary" />
						تفاصيل الكورس
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center h-32">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : course ? (
					<div className="space-y-6 mt-4">
						{/* Course Info */}
						<div className="bg-primary/5 p-4 rounded-lg">
							<h3 className="text-xl font-bold text-text-heading">
								{course.name}
							</h3>
							{course.description && (
								<p className="text-text-muted mt-2">{course.description}</p>
							)}
						</div>

						{/* Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<Card>
								<CardContent className="p-4 flex items-center gap-3">
									<Layers className="w-5 h-5 text-primary" />
									<div>
										<p className="text-sm text-text-muted">المستويات</p>
										<p className="font-bold">{course.levels?.length || 0}</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="p-4 flex items-center gap-3">
									<Users className="w-5 h-5 text-accent-cyan" />
									<div>
										<p className="text-sm text-text-muted">الطلاب</p>
										<p className="font-bold">{course.enrollmentCount || 0}</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="p-4 flex items-center gap-3">
									<Clock className="w-5 h-5 text-success" />
									<div>
										<p className="text-sm text-text-muted">الحصص/الشهر</p>
										<p className="font-bold">{course.sessionsPerMonth || 4}</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="p-4 flex items-center gap-3">
									<BookOpen className="w-5 h-5 text-warning" />
									<div>
										<p className="text-sm text-text-muted">الكلاسات</p>
										<p className="font-bold">{course.classesCount || 0}</p>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Prerequisites */}
						{course.prerequisites && course.prerequisites.length > 0 && (
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-base flex items-center gap-2">
										<Link2 className="w-4 h-4" />
										المتطلبات السابقة
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2">
										{course.prerequisites.map((prereq: any) => (
											<Badge key={prereq.id} variant="secondary">
												{prereq.name}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Syllabus */}
						{course.syllabus && (
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-base">المنهج</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-text-muted whitespace-pre-line">
										{course.syllabus}
									</p>
								</CardContent>
							</Card>
						)}

						{/* Levels */}
						<div className="space-y-3">
							<h3 className="font-semibold">
								المستويات ({course.levels?.length || 0})
							</h3>

							{course.levels?.length > 0 ? (
								<div className="space-y-2">
									{course.levels.map((level: any) => (
										<Collapsible key={level.id}>
											<Card>
												<CollapsibleTrigger className="w-full">
													<CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
														<CardTitle className="text-base flex items-center justify-between">
															<div className="flex items-center gap-2">
																<span>مستوى {level.levelNumber}</span>
																<Badge variant="outline" className="text-xs">
																	{level.durationMonths} أشهر
																</Badge>
																{level.pricePerMonth &&
																	level.pricePerMonth !== "0" && (
																		<Badge
																			variant="secondary"
																			className="text-xs"
																		>
																			{level.pricePerMonth} جنيه/شهر
																		</Badge>
																	)}
															</div>
															{level.prerequisites?.length > 0 && (
																<Badge variant="secondary">
																	{level.prerequisites.length} متطلب
																</Badge>
															)}
														</CardTitle>
													</CardHeader>
												</CollapsibleTrigger>
												<CollapsibleContent>
													<CardContent className="pt-0">
														{level.description && (
															<p className="text-sm text-text-muted mb-3">
																{level.description}
															</p>
														)}

														{level.prerequisites?.length > 0 && (
															<div className="mb-3">
																<p className="text-xs text-text-muted mb-1">
																	المتطلبات:
																</p>
																<div className="flex flex-wrap gap-1">
																	{level.prerequisites.map((prereq: any) => (
																		<Badge
																			key={prereq.id}
																			variant="outline"
																			className="text-xs"
																		>
																			مستوى {prereq.levelNumber}
																		</Badge>
																	))}
																</div>
															</div>
														)}

														{level.books?.length > 0 && (
															<div>
																<p className="text-xs text-text-muted mb-1">
																	الكتب:
																</p>
																<ul className="text-sm space-y-1">
																	{level.books.map((book: any) => (
																		<li
																			key={book.id}
																			className="flex justify-between"
																		>
																			<span>{book.name}</span>
																			<span className="text-text-muted">
																				{book.price} جنيه
																			</span>
																		</li>
																	))}
																</ul>
															</div>
														)}
													</CardContent>
												</CollapsibleContent>
											</Card>
										</Collapsible>
									))}
								</div>
							) : (
								<p className="text-text-muted">لا يوجد مستويات</p>
							)}
						</div>

						<div className="flex justify-end pt-4">
							<Button onClick={() => onOpenChange(false)}>إغلاق</Button>
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

import { BookOpen, Layers, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";

interface AddLevelModalProps {
	isOpen: boolean;
	onClose: () => void;
	courseId: string | null;
	courseName: string;
}

export function AddLevelModal({
	isOpen,
	onClose,
	courseId,
	courseName,
}: AddLevelModalProps) {
	const [formData, setFormData] = useState({
		levelNumber: "",
		durationMonths: "4",
		pricePerMonth: "",
		description: "",
	});
	const [books, setBooks] = useState<Array<{ name: string; price: string }>>(
		[],
	);
	const { toast } = useToast();

	const utils = trpc.useUtils();
	const { data: levelsData } = trpc.courses.getLevels.useQuery(
		{ courseId: courseId || "" },
		{ enabled: !!courseId },
	);
	const existingLevels = levelsData?.data || [];

	const addLevelMutation = trpc.courses.addLevel.useMutation({
		onSuccess: () => {
			utils.courses.getLevels.invalidate({ courseId: courseId || "" });
			utils.courses.getAll.invalidate();
			toast({
				title: "تم بنجاح",
				description: "تم إضافة المستوى بنجاح",
				variant: "success",
			});
			onClose();
			resetForm();
		},
		onError: (err) => {
			toast({
				variant: "destructive",
				title: "خطأ",
				description: err.message || "حدث خطأ أثناء إضافة المستوى",
			});
		},
	});

	const resetForm = () => {
		setFormData({
			levelNumber: "",
			durationMonths: "4",
			pricePerMonth: "",
			description: "",
		});
		setBooks([]);
	};

	const handleAddBook = () => {
		setBooks([...books, { name: "", price: "" }]);
	};

	const handleRemoveBook = (index: number) => {
		setBooks(books.filter((_, i) => i !== index));
	};

	const handleBookChange = (index: number, field: string, value: string) => {
		const newBooks = [...books];
		newBooks[index] = { ...newBooks[index], [field]: value };
		setBooks(newBooks);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!courseId || !formData.levelNumber) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "رقم المستوى مطلوب",
			});
			return;
		}

		// Check if level number already exists
		const levelNum = parseInt(formData.levelNumber);
		if (existingLevels.some((l: any) => l.levelNumber === levelNum)) {
			toast({
				variant: "destructive",
				title: "خطأ في التحقق",
				description: "هذا المستوى موجود بالفعل",
			});
			return;
		}

		// Filter out empty books
		const validBooks = books.filter((b) => b.name && b.price);

		addLevelMutation.mutate({
			courseId,
			levelNumber: levelNum,
			durationMonths: parseInt(formData.durationMonths),
			pricePerMonth: formData.pricePerMonth
				? parseFloat(formData.pricePerMonth)
				: undefined,
			description: formData.description || undefined,
			books:
				validBooks.length > 0
					? validBooks.map((b) => ({
							name: b.name,
							price: parseFloat(b.price),
						}))
					: undefined,
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[550px]" dir="rtl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<Layers className="w-6 h-6 text-primary" />
						إضافة مستوى جديد
					</DialogTitle>
				</DialogHeader>

				<div className="bg-primary/5 p-3 rounded-lg mb-4">
					<p className="text-sm text-text-muted">الكورس:</p>
					<p className="font-semibold">{courseName}</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="levelNumber">رقم المستوى *</Label>
							<Input
								id="levelNumber"
								type="number"
								value={formData.levelNumber}
								onChange={(e) =>
									setFormData({ ...formData, levelNumber: e.target.value })
								}
								placeholder="مثال: 1"
								required
								min={1}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="durationMonths">المدة (أشهر) *</Label>
							<Input
								id="durationMonths"
								type="number"
								value={formData.durationMonths}
								onChange={(e) =>
									setFormData({ ...formData, durationMonths: e.target.value })
								}
								placeholder="4"
								required
								min={1}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="pricePerMonth">السعر الشهري (جنيه) *</Label>
						<Input
							id="pricePerMonth"
							type="number"
							step="0.01"
							value={formData.pricePerMonth}
							onChange={(e) =>
								setFormData({ ...formData, pricePerMonth: e.target.value })
							}
							placeholder="أدخل السعر الشهري"
							required
							min={0}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">الوصف</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder="وصف المستوى..."
							rows={3}
						/>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="flex items-center gap-2">
								<BookOpen className="w-4 h-4" />
								<span>الكتب</span>
							</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddBook}
							>
								<Plus className="w-4 h-4 ml-1" />
								إضافة كتاب
							</Button>
						</div>

						<div className="space-y-2">
							{books.map((book, index) => (
								<div
									key={index}
									className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
								>
									<Input
										placeholder="اسم الكتاب"
										value={book.name}
										onChange={(e) =>
											handleBookChange(index, "name", e.target.value)
										}
										className="flex-1"
									/>
									<Input
										type="number"
										placeholder="السعر"
										value={book.price}
										onChange={(e) =>
											handleBookChange(index, "price", e.target.value)
										}
										className="w-24"
									/>
									<span className="text-sm text-text-muted">جنيه</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="text-error"
										onClick={() => handleRemoveBook(index)}
									>
										<X className="w-4 h-4" />
									</Button>
								</div>
							))}

							{books.length === 0 && (
								<p className="text-sm text-text-muted text-center py-4">
									لا توجد كتب مضافة
								</p>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={onClose}>
							إلغاء
						</Button>
						<Button type="submit" disabled={addLevelMutation.isPending}>
							{addLevelMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 ml-2 animate-spin" />
									جاري الحفظ...
								</>
							) : (
								"إضافة المستوى"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Loader2 } from 'lucide-react';

interface EditCourseModalProps {
  courseId: string | null;
  courseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCourseModal({ courseId, courseName, open, onOpenChange }: EditCourseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    syllabus: '',
    sessionsPerMonth: '4',
  });
  const { toast } = useToast();

  const utils = trpc.useUtils();
  
  const { data: course, isLoading } = trpc.courses.getById.useQuery(
    courseId || '',
    { enabled: !!courseId }
  );

  // Update form when course data loads
  useState(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        description: course.description || '',
        syllabus: course.syllabus || '',
        sessionsPerMonth: String(course.sessionsPerMonth || 4),
      });
    }
  });

  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      utils.courses.getAll.invalidate();
      toast({
        title: "تم بنجاح",
        description: "تم تعديل الكورس بنجاح",
      });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err.message || 'حدث خطأ أثناء التعديل',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !formData.name) return;

    updateMutation.mutate({
      id: courseId,
      data: {
        name: formData.name,
        description: formData.description || undefined,
        syllabus: formData.syllabus || undefined,
        sessionsPerMonth: parseInt(formData.sessionsPerMonth),
      },
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-6 h-6 text-primary" />
            تعديل الكورس
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الكورس *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم الكورس"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="أدخل وصف الكورس"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="syllabus">المنهج</Label>
            <Textarea
              id="syllabus"
              value={formData.syllabus}
              onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
              placeholder="أدخل منهج الكورس"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionsPerMonth">عدد الحصص في الشهر *</Label>
            <Select
              value={formData.sessionsPerMonth}
              onValueChange={(value) => setFormData({ ...formData, sessionsPerMonth: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر عدد الحصص" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 حصص (دفع كل 4 حصص)</SelectItem>
                <SelectItem value="8">8 حصص (دفع كل 8 حصص)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { Users, Loader2 } from 'lucide-react';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const daysOfWeek = [
  { value: '0', label: 'الأحد' },
  { value: '1', label: 'الإثنين' },
  { value: '2', label: 'الثلاثاء' },
  { value: '3', label: 'الأربعاء' },
  { value: '4', label: 'الخميس' },
  { value: '5', label: 'الجمعة' },
  { value: '6', label: 'السبت' },
];

export function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    scheduleDayOfWeek: '',
    scheduleStartTime: '',
    scheduleEndTime: '',
  });

  const utils = trpc.useContext();

  const { data: teachersData } = trpc.teachers.getAll.useQuery({ page: 1, limit: 100 });
  const teachers = teachersData?.data ?? [];

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      utils.classes.getAll.invalidate();
      onClose();
      setFormData({
        name: '',
        teacherId: '',
        scheduleDayOfWeek: '',
        scheduleStartTime: '',
        scheduleEndTime: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      teacherId: formData.teacherId || undefined,
      scheduleDayOfWeek: formData.scheduleDayOfWeek ? parseInt(formData.scheduleDayOfWeek) : undefined,
      scheduleStartTime: formData.scheduleStartTime || undefined,
      scheduleEndTime: formData.scheduleEndTime || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-6 h-6 text-primary" />
            إضافة كلاس جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الكلاس *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: كلاس الصف الأول"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">المعلم</Label>
            <Select
              value={formData.teacherId}
              onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المعلم" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="day">يوم الجدولة</Label>
            <Select
              value={formData.scheduleDayOfWeek}
              onValueChange={(value) => setFormData({ ...formData, scheduleDayOfWeek: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر اليوم" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">وقت البدء</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.scheduleStartTime}
                onChange={(e) => setFormData({ ...formData, scheduleStartTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">وقت الانتهاء</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.scheduleEndTime}
                onChange={(e) => setFormData({ ...formData, scheduleEndTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

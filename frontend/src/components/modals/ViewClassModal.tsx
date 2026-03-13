import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Users, GraduationCap, Calendar, Clock, Loader2, BookOpen } from 'lucide-react';

interface ViewClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | null;
}

const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function ViewClassModal({ isOpen, onClose, classId }: ViewClassModalProps) {
  const { data: cls, isLoading } = trpc.classes.getById.useQuery(
    classId || '',
    { enabled: !!classId }
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-6 h-6 text-primary" />
            تفاصيل الكلاس
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cls ? (
          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-heading">{cls.name}</h3>
                <Badge variant={cls.isActive ? 'success' : 'secondary'}>
                  {cls.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg">
                <GraduationCap className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-sm text-text-muted">المعلم</p>
                  <p className="font-medium">{cls.teacher?.fullName || 'غير محدد'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg">
                <Users className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-sm text-text-muted">عدد الطلاب</p>
                  <p className="font-medium">{cls.students?.length || 0} طالب</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg">
                <Calendar className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-sm text-text-muted">يوم الجدولة</p>
                  <p className="font-medium">
                    {cls.scheduleDayOfWeek !== undefined 
                      ? daysOfWeek[cls.scheduleDayOfWeek] 
                      : 'غير محدد'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg">
                <Clock className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-sm text-text-muted">الوقت</p>
                  <p className="font-medium">
                    {cls.scheduleStartTime && cls.scheduleEndTime
                      ? `${cls.scheduleStartTime} - ${cls.scheduleEndTime}`
                      : 'غير محدد'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border-divider pt-4">
              <h4 className="font-semibold mb-3">الطلاب ({cls.students?.length || 0})</h4>
              {cls.students && cls.students.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cls.students.map((student: any) => (
                    <div key={student.id} className="p-3 bg-bg-light rounded-lg flex justify-between items-center">
                      <span className="font-medium">{student.fullName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-center py-4">لا يوجد طلاب مسجلين</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose}>إغلاق</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RecordPaymentModalProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RecordPaymentModal({ studentId, open, onOpenChange, onSuccess }: RecordPaymentModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'tuition' as 'tuition' | 'books',
    notes: '',
  });
  const [error, setError] = useState('');

  const utils = trpc.useUtils();
  
  // Fetch student details to get class and course info
  const { data: student } = trpc.students.getById.useQuery(
    studentId || '',
    {
      enabled: !!studentId && open,
    }
  );

  // Get sessionsPerMonth from student's course
  const sessionsPerMonth = student?.enrollments?.[0]?.course?.sessionsPerMonth || 4;

  const recordPayment = trpc.payments.recordStudentPayment.useMutation({
    onSuccess: () => {
      utils.payments.getStudentPayments.invalidate();
      utils.students.getAll.invalidate();
      onSuccess?.();
      onOpenChange(false);
      setFormData({
        amount: '',
        type: 'tuition',
        notes: '',
      });
    },
    onError: (err) => {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدفعة');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId || !student) {
      setError('بيانات الطالب غير متوفرة');
      return;
    }

    if (!formData.amount || !student.class?.id || !student.enrollments?.[0]?.course?.id) {
      setError('جميع الحقول المطلوبة يجب ملؤها والطالب يجب أن يكون مسجل في كلاس وكورس');
      return;
    }

    recordPayment.mutate({
      studentId,
      classId: student.class.id,
      courseId: student.enrollments[0].course.id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      sessionsCovered: formData.type === 'tuition' ? sessionsPerMonth : undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
          <DialogDescription>
            تسجيل دفعة جديدة للطالب {student?.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">نوع الدفعة *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'tuition' | 'books') => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الدفعة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tuition">رسوم دراسية</SelectItem>
                <SelectItem value="books">كتب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (ج.م) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="أدخل المبلغ"
              required
            />
          </div>

          {formData.type === 'tuition' && student?.enrollments?.[0]?.course && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                سيتم تسجيل الدفعة لتغطية <strong>{sessionsPerMonth} حصص</strong> (حسب إعدادات الكورس)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أدخل أي ملاحظات"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={recordPayment.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={recordPayment.isPending}
              className="gap-2"
            >
              {recordPayment.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              تسجيل الدفعة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

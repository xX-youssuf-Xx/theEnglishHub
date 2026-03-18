import { useState } from "react";
import { GraduationCap, Loader2, Users, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TeacherPaymentsBannerProps {
  onRefresh: () => void;
}

export function TeacherPaymentsBanner({ onRefresh }: TeacherPaymentsBannerProps) {
  const [isTeachersModalOpen, setIsTeachersModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{
    teacherId: string;
    teacherName: string;
    payments: any[];
    totalAmount: number;
  } | null>(null);

  const { data, isLoading } = trpc.payments.getPendingPaymentsByTeacher.useQuery(undefined, {
    enabled: isTeachersModalOpen,
  });

  const bulkSettleMutation = trpc.payments.bulkSettleTeacherPayments.useMutation({
    onSuccess: (result) => {
      toast.success(`تم تسديد ${result.settledCount} دفعات بمبلغ ${result.totalAmount} جنيه`);
      setSelectedTeacher(null);
      onRefresh();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const teachers = data?.data || [];
  const totalTeachers = teachers.length;
  const totalPendingAmount = teachers.reduce((sum: number, t: any) => sum + t.totalAmount, 0);

  const handleTeacherClick = (teacher: any) => {
    setSelectedTeacher({
      teacherId: teacher.teacher.id,
      teacherName: teacher.teacher.name,
      payments: teacher.payments,
      totalAmount: teacher.totalAmount,
    });
  };

  const handleBulkSettle = () => {
    if (!selectedTeacher) return;
    bulkSettleMutation.mutate({
      teacherId: selectedTeacher.teacherId,
      notes: `تسديد جميع الدفعات المعلقة - ${selectedTeacher.teacherName}`,
    });
  };

  return (
    <>
      {/* Banner */}
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary"
        onClick={() => setIsTeachersModalOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">دفعات المعلمين</h3>
                <p className="text-sm text-muted-foreground">
                  {totalTeachers} معلم لديهم دفعات معلقة
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-primary">
                {totalPendingAmount.toFixed(2)} جنيه
              </p>
              <p className="text-sm text-muted-foreground">إجمالي المعلق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers List Modal */}
      <Dialog open={isTeachersModalOpen} onOpenChange={setIsTeachersModalOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              المعلمون ذوو الدفعات المعلقة
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا يوجد معلمون لديهم دفعات معلقة
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {teachers.map((teacher: any) => (
                <div
                  key={teacher.teacher.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleTeacherClick(teacher)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{teacher.teacher.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {teacher.paymentCount} دفعة معلقة
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-primary">
                      {teacher.totalAmount.toFixed(2)} جنيه
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Teacher Payments Detail Modal */}
      <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                دفعات {selectedTeacher?.teacherName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTeacher(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedTeacher && (
            <div className="space-y-4">
              {/* Payments List */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {selectedTeacher.payments.map((payment: any, index: number) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{payment.class?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          دورة {payment.cycleNumber}
                          {payment.paymentCycle && ` (${payment.paymentCycle} حصص)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold">{payment.amount} جنيه</p>
                      <Badge variant="warning">معلق</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الدفعات:</p>
                    <p className="text-3xl font-bold text-primary">
                      {selectedTeacher.totalAmount.toFixed(2)} جنيه
                    </p>
                  </div>
                  <Button
                    onClick={handleBulkSettle}
                    disabled={bulkSettleMutation.isPending}
                    className="gap-2"
                  >
                    {bulkSettleMutation.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    تسديد الكل
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

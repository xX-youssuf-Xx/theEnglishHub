import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Plus, Trash2, Loader2, GraduationCap, Calendar, X, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ViewCourseClassesModalProps {
  courseId: string | null;
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
}

const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function ViewCourseClassesModal({ 
  courseId, 
  courseName, 
  isOpen, 
  onClose 
}: ViewCourseClassesModalProps) {
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [schedules, setSchedules] = useState<Array<{ dayOfWeek: string; startTime: string; endTime: string }>>([
    { dayOfWeek: '0', startTime: '', endTime: '' }
  ]);
  const { toast } = useToast();

  const utils = trpc.useUtils();

  const { data: classesData, isLoading: isLoadingClasses } = trpc.courses.getClasses.useQuery(
    courseId || '',
    { enabled: !!courseId }
  );
  
  const classes = classesData?.data || [];

  const { data: levelsData } = trpc.courses.getLevels.useQuery(
    { courseId: courseId || '' },
    { enabled: !!courseId }
  );
  const levels = levelsData?.data || [];

  const createClassMutation = trpc.courses.createClass.useMutation({
    onSuccess: () => {
      utils.courses.getClasses.invalidate(courseId || '');
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الكلاس بنجاح",
      });
      resetAddForm();
      setIsAddingMode(false);
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err.message || 'حدث خطأ أثناء إضافة الكلاس',
      });
    },
  });

  const deleteClassMutation = trpc.courses.deleteClass.useMutation({
    onSuccess: () => {
      utils.courses.getClasses.invalidate(courseId || '');
      toast({
        title: "تم بنجاح",
        description: "تم حذف الكلاس بنجاح",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err.message || 'حدث خطأ أثناء الحذف',
      });
    },
  });

  const resetAddForm = () => {
    setNewClassName('');
    setSelectedLevelId('');
    setSchedules([{ dayOfWeek: '0', startTime: '', endTime: '' }]);
  };

  const handleAddSchedule = () => {
    setSchedules([...schedules, { dayOfWeek: '0', startTime: '', endTime: '' }]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index: number, field: string, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClassName || !selectedLevelId) {
      toast({
        variant: "destructive",
        title: "خطأ في التحقق",
        description: "اسم الكلاس والمستوى مطلوبان",
      });
      return;
    }

    // Validate schedules
    const validSchedules = schedules.filter(s => s.startTime && s.endTime);
    if (validSchedules.length === 0) {
      toast({
        variant: "destructive",
        title: "خطأ في التحقق",
        description: "يجب إضافة جدول زمني واحد على الأقل",
      });
      return;
    }

    createClassMutation.mutate({
      courseId: courseId || '',
      name: newClassName,
      levelId: selectedLevelId,
      schedules: validSchedules.map(s => ({
        dayOfWeek: parseInt(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
  };

  const handleDeleteClass = (classId: string) => {
    deleteClassMutation.mutate(classId);
  };

  const formatSchedule = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return 'لا يوجد جدول';
    return schedules.map(s => 
      `${daysOfWeek[s.dayOfWeek]} ${s.startTime?.slice(0, 5)}-${s.endTime?.slice(0, 5)}`
    ).join('، ');
  };

  // Group classes by level
  const classesByLevel = classes.reduce((acc: any, cls: any) => {
    const levelNum = cls.level?.levelNumber || 0;
    if (!acc[levelNum]) acc[levelNum] = [];
    acc[levelNum].push(cls);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="w-6 h-6 text-primary" />
            كلاسات الكورس: {courseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Add Button */}
          {!isAddingMode && (
            <Button 
              onClick={() => setIsAddingMode(true)} 
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              إضافة كلاس جديد
            </Button>
          )}

          {/* Add Class Form */}
          {isAddingMode && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة كلاس جديد
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setIsAddingMode(false);
                      resetAddForm();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {levels.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">لا يوجد مستويات</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        يجب إضافة مستويات للكورس أولاً قبل إنشاء كلاسات.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم الكلاس *</Label>
                      <Input
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="أدخل اسم الكلاس"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>المستوى *</Label>
                      <Select
                        value={selectedLevelId}
                        onValueChange={setSelectedLevelId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستوى" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              مستوى {level.levelNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>الجدول الزمني *</Label>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={handleAddSchedule}
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة يوم
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {schedules.map((schedule, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <Select
                              value={schedule.dayOfWeek}
                              onValueChange={(value) => handleScheduleChange(index, 'dayOfWeek', value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {daysOfWeek.map((day, idx) => (
                                  <SelectItem key={idx} value={String(idx)}>{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                              className="w-[100px]"
                            />
                            
                            <span className="text-text-muted">إلى</span>
                            
                            <Input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                              className="w-[100px]"
                            />
                            
                            {schedules.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-error"
                                onClick={() => handleRemoveSchedule(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => {
                          setIsAddingMode(false);
                          resetAddForm();
                        }}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createClassMutation.isPending}
                        className="flex-1"
                      >
                        {createClassMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            جاري الإضافة...
                          </>
                        ) : (
                          'إضافة الكلاس'
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Classes List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">الكلاسات الحالية</h3>
            
            {isLoadingClasses ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : classes.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(classesByLevel)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([levelNum, levelClasses]: [string, any]) => (
                    <Collapsible key={levelNum} defaultOpen>
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardTitle className="text-base flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-primary">المستوى {levelNum}</span>
                              </div>
                              <Badge variant="secondary">
                                {levelClasses.length} كلاس
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {levelClasses.map((cls: any) => (
                                <div 
                                  key={cls.id} 
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{cls.name}</span>
                                    </div>
                                    <div className="text-xs text-text-muted space-y-1">
                                      <p className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatSchedule(cls.schedules)}
                                      </p>
                                      {cls.teacher && (
                                        <p className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          المعلم: {cls.teacher.fullName}
                                        </p>
                                      )}
                                      <p className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        عدد الطلاب: {cls.studentCount || 0}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-error hover:text-error hover:bg-error/10"
                                    onClick={() => handleDeleteClass(cls.id)}
                                    disabled={deleteClassMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted bg-muted/50 rounded-lg">
                <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا يوجد كلاسات في هذا الكورس</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

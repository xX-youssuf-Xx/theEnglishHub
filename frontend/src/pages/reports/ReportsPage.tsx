import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Users,
  CreditCard,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const { data: enrollmentReport, isLoading: isLoadingEnrollment } = 
    trpc.reports.getEnrollmentReport.useQuery();

  const { data: financialReport, isLoading: isLoadingFinancial } = 
    trpc.reports.getFinancialReport.useQuery({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  const courseEnrollments = enrollmentReport?.courseEnrollments ?? [];
  const classEnrollments = enrollmentReport?.classEnrollments ?? [];

  // Mock monthly data for charts (until backend provides it)
  const monthlyData = [
    { month: 'يناير', income: 30000, expenses: 20000 },
    { month: 'فبراير', income: 35000, expenses: 22000 },
    { month: 'مارس', income: 40000, expenses: 25000 },
    { month: 'أبريل', income: 38000, expenses: 24000 },
    { month: 'مايو', income: 42000, expenses: 26000 },
    { month: 'يونيو', income: 45000, expenses: 28000 },
  ];

  const paymentStatusData = [
    { name: 'مدفوع', value: 222, color: '#34D399' },
    { name: 'معلق', value: 23, color: '#FBBF24' },
    { name: 'متأخر', value: 5, color: '#F87171' },
  ];

  if (isLoadingEnrollment || isLoadingFinancial) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-heading">التقارير والتحليلات</h1>
          <p className="text-text-muted mt-1">تقارير مكلاسة عن أداء المركز المالي</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير التقرير
        </Button>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="financial" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            مالي
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="gap-2">
            <Users className="w-4 h-4" />
            التسجيل
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            المدفوعات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الدخل مقابل المصروفات</CardTitle>
                <CardDescription>مقارنة الدخل والمصروفات على مدار 6 أشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9E5F5" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E9E5F5',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => value.toLocaleString() + ' ج.م'}
                      />
                      <Bar dataKey="income" name="الدخل" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="المصروفات" fill="#F87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص مالي</CardTitle>
                <CardDescription>
                  الفترة: {dateRange.startDate.toLocaleDateString('ar-EG')} - {dateRange.endDate.toLocaleDateString('ar-EG')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                    <span className="font-medium">إجمالي الدخل</span>
                    <span className="text-xl font-bold text-primary">
                      {financialReport?.income?.total?.toLocaleString() || 0} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-error/10 rounded-lg">
                    <span className="font-medium">إجمالي المصروفات</span>
                    <span className="text-xl font-bold text-error">
                      {financialReport?.expenses?.total?.toLocaleString() || 0} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                    <span className="font-medium">صافي الربح</span>
                    <span className="text-xl font-bold text-success">
                      {financialReport?.netProfit?.toLocaleString() || 0} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات التسجيل</CardTitle>
              <CardDescription>
                إجمالي الطلاب: {enrollmentReport?.summary?.totalStudents || 0} | 
                الكورسات: {enrollmentReport?.summary?.totalCourses || 0} | 
                الكلاسات: {enrollmentReport?.summary?.totalClasses || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-4">التسجيل حسب الكورس</h3>
                  <div className="space-y-2">
                    {courseEnrollments.map((course) => (
                      <div key={course.courseId} className="flex justify-between items-center p-3 bg-background-page rounded-lg">
                        <span>{course.courseName}</span>
                        <span className="font-bold">{course.count} طالب</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold mb-4">التسجيل حسب الكلاس</h3>
                  <div className="space-y-2">
                    {classEnrollments.map((cls) => (
                      <div key={cls.classId} className="flex justify-between items-center p-3 bg-background-page rounded-lg">
                        <span>{cls.className}</span>
                        <span className="font-bold">{cls.count} طالب</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>حالة المدفوعات</CardTitle>
              <CardDescription>نظرة عامة على حالات المدفوعات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E9E5F5',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {paymentStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-text-body">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

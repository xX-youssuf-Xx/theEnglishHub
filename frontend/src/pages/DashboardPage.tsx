import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import {
  Users,
  GraduationCap,
  CreditCard,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  CheckCircle,
  Loader2,
} from 'lucide-react';
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

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  isPositive?: boolean;
  icon: React.ReactNode;
  trendLabel?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, trend, isPositive, icon, trendLabel, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="hover-card-shadow transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-card-shadow transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-muted">{title}</p>
            <p className="text-3xl font-bold text-text-heading">{value}</p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success' : 'text-error'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{trend}% {trendLabel || 'من الشهر الماضي'}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock data for charts until backend provides them
const monthlyData = [
  { month: 'يناير', income: 30000, expenses: 20000 },
  { month: 'فبراير', income: 35000, expenses: 22000 },
  { month: 'مارس', income: 40000, expenses: 25000 },
  { month: 'أبريل', income: 38000, expenses: 24000 },
  { month: 'مايو', income: 42000, expenses: 26000 },
  { month: 'يونيو', income: 45000, expenses: 28000 },
];

const enrollmentData = [
  { month: 'يناير', students: 200 },
  { month: 'فبراير', students: 215 },
  { month: 'مارس', students: 230 },
  { month: 'أبريل', students: 235 },
  { month: 'مايو', students: 240 },
  { month: 'يونيو', students: 245 },
];

const paymentStatusData = [
  { name: 'مدفوع', value: 222, color: '#34D399' },
  { name: 'معلق', value: 23, color: '#FBBF24' },
];

const recentActivities = [
  { id: 1, type: 'payment', message: 'تم استلام دفعة جديدة من الطالب أحمد محمد', time: 'منذ 5 دقائق', amount: 1500 },
  { id: 2, type: 'session', message: 'تم إكمال حصة اللغة الإنجليزية - المستوى المتوسط', time: 'منذ 15 دقيقة', teacher: 'سارة أحمد' },
  { id: 3, type: 'student', message: 'تم تسجيل طالب جديد: محمد علي', time: 'منذ ساعة', level: 'مبتدئ' },
  { id: 4, type: 'payment', message: 'دفعة معلقة للطالبة فاطمة حسن', time: 'منذ ساعتين', amount: 2000 },
];

const alerts = [
  { id: 1, type: 'overdue', message: '3 طلاب لديهم دفعات متأخرة', severity: 'high' },
  { id: 2, type: 'upcoming', message: '5 دفعات للمعلمين مستحقة هذا الأسبوع', severity: 'medium' },
];

export function DashboardPage() {
  const { data: stats, isLoading, error } = trpc.reports.getDashboardStats.useQuery();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-error" />
        <p className="text-text-heading font-medium">حدث خطأ في تحميل البيانات</p>
        <p className="text-text-muted">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-heading">لوحة التحكم</h1>
          <p className="text-text-muted mt-1">نظرة عامة على أداء المركز</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            طالب جديد
          </Button>
          <Button className="gap-2">
            <CreditCard className="w-4 h-4" />
            تسجيل دفعة
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                alert.severity === 'high'
                  ? 'bg-error/10 border-error/20 text-error'
                  : 'bg-warning/10 border-warning/20 text-warning'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid - Connected to Backend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="إجمالي الطلاب"
          value={stats?.totalActiveStudents ?? 0}
          isLoading={isLoading}
          icon={<Users className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="المعلمين"
          value={stats?.totalActiveTeachers ?? 0}
          isLoading={isLoading}
          icon={<GraduationCap className="w-6 h-6 text-accent-cyan" />}
        />
        <StatCard
          title="الدفعات المعلقة"
          value={stats?.pendingPaymentsCount ?? 0}
          isLoading={isLoading}
          icon={<AlertCircle className="w-6 h-6 text-warning" />}
        />
        <StatCard
          title="دفعات المعلمين"
          value={0}
          isLoading={isLoading}
          icon={<CreditCard className="w-6 h-6 text-accent-coral" />}
        />
        <StatCard
          title="الربح الشهري"
          value={`${(stats?.monthlyIncome ?? 0).toLocaleString()} ج.م`}
          isLoading={isLoading}
          icon={<DollarSign className="w-6 h-6 text-success" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>الدخل مقابل المصروفات</CardTitle>
            <CardDescription>مقارنة الدخل والمصروفات الشهرية</CardDescription>
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

        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاهات التسجيل</CardTitle>
            <CardDescription>عدد الطلاب المسجلين على مدار الأشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9E5F5" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E9E5F5',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="students"
                    name="الطلاب"
                    stroke="#22D3EE"
                    strokeWidth={3}
                    dot={{ fill: '#22D3EE', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>حالة المدفوعات</CardTitle>
            <CardDescription>توزيع حالات المدفوعات</CardDescription>
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

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>النشاطات الأخيرة</CardTitle>
            <CardDescription>آخر التحديثات والأحداث في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-background-page/50 hover:bg-background-page transition-colors"
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${activity.type === 'payment' ? 'bg-success/10 text-success' :
                      activity.type === 'session' ? 'bg-accent-cyan/10 text-accent-cyan' :
                      activity.type === 'student' ? 'bg-primary/10 text-primary' :
                      'bg-warning/10 text-warning'}
                  `}>
                    {activity.type === 'payment' && <DollarSign className="w-5 h-5" />}
                    {activity.type === 'session' && <CheckCircle className="w-5 h-5" />}
                    {activity.type === 'student' && <Users className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-heading">{activity.message}</p>
                    <p className="text-sm text-text-muted mt-1">{activity.time}</p>
                  </div>
                  
                  {activity.amount && (
                    <Badge variant="success" className="flex-shrink-0">
                      +{activity.amount.toLocaleString()} ج.م
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

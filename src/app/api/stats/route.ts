import { NextRequest, NextResponse } from 'next/server';
import { getStats, getLast7DaysStats, getReports, getUsers, getProjects } from '@/lib/db';

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get basic stats
    const stats = await getStats();
    
    // Get last 7 days stats
    const last7Days = await getLast7DaysStats();

    // Get today's reports with user info
    const todayReportsData = await getReports({
      startDate: today,
      endDate: today,
    });

    const users = await getUsers();
    const projects = await getProjects();
    const todayReportsList = todayReportsData.map((report) => {
      const user = users.find((u) => u.id === report.userId);
      const reportProjects = report.projectIds
        .map((pid) => projects.find((p) => p.id === pid)?.name)
        .filter(Boolean);
      return {
        id: report.id,
        userId: report.userId,
        date: report.date,
        completed: report.completed,
        createdAt: report.createdAt.toISOString(),
        userName: user?.name || '',
        projects: reportProjects,
      };
    });

    // Get unsubmitted users (for admin/lead)
    const submittedUserIds = todayReportsData.map((r) => r.userId);
    const unsubmittedUsers = users
      .filter((user) => !submittedUserIds.includes(user.id))
      .map((user) => ({
        id: user.id,
        name: user.name,
        department: user.department,
      }));

    return NextResponse.json({
      stats,
      last7Days,
      todayReports: todayReportsList,
      unsubmittedUsers,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}

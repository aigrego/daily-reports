import { NextRequest, NextResponse } from 'next/server';
import { getReports } from '@/lib/db';

// GET /api/reports - Get all reports with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const keyword = searchParams.get('keyword');

    // Build filters object
    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (projectId) filters.projectId = projectId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (keyword) filters.keyword = keyword;

    // Fetch reports using Prisma
    const reportsData = await getReports(Object.keys(filters).length > 0 ? filters : undefined);

    // Format response to match expected structure
    const reports = reportsData.map((report) => ({
      id: report.id,
      userId: report.userId,
      date: report.date,
      completed: report.completed,
      inProgress: report.inProgress,
      problems: report.problems,
      tomorrowPlan: report.tomorrowPlan,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      projectIds: report.projectIds,
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: '获取日报列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create new report
export async function POST(request: NextRequest) {
  try {
    const { userId, date, projectIds, completed, inProgress, problems, tomorrowPlan } = await request.json();

    if (!userId || !date || !projectIds || projectIds.length === 0) {
      return NextResponse.json(
        { error: '用户、日期和项目不能为空' },
        { status: 400 }
      );
    }

    // Check if report already exists for this user and date
    const { getReports, createReport } = await import('@/lib/db');
    const existingReports = await getReports({ userId, startDate: date, endDate: date });

    if (existingReports.length > 0) {
      return NextResponse.json(
        { error: '该日期已提交日报,请使用更新功能' },
        { status: 409 }
      );
    }

    // Create report using Prisma
    const report = await createReport({
      userId,
      date,
      projectIds,
      completed: completed || '',
      inProgress: inProgress || '',
      problems: problems || '',
      tomorrowPlan: tomorrowPlan || '',
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        userId: report.userId,
        date: report.date,
        projectIds: report.projectIds,
        completed: report.completed,
        inProgress: report.inProgress,
        problems: report.problems,
        tomorrowPlan: report.tomorrowPlan,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: '创建日报失败' },
      { status: 500 }
    );
  }
}

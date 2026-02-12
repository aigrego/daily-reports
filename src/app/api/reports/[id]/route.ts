import { NextRequest, NextResponse } from 'next/server';
import { getReportById } from '@/lib/db';

// GET /api/reports/[id] - Get report by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await getReportById(params.id);

    if (!report) {
      return NextResponse.json(
        { error: '日报不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: '获取日报失败' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Update report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { projectIds, completed, inProgress, problems, tomorrowPlan } = await request.json();
    
    // Check if report exists
    const { getReportById, updateReport } = await import('@/lib/db');
    const existingReport = await getReportById(params.id);
    
    if (!existingReport) {
      return NextResponse.json(
        { error: '日报不存在' },
        { status: 404 }
      );
    }

    // Build updates object
    const updates: any = {};
    
    if (completed !== undefined) {
      updates.completed = completed;
    }
    if (inProgress !== undefined) {
      updates.inProgress = inProgress;
    }
    if (problems !== undefined) {
      updates.problems = problems;
    }
    if (tomorrowPlan !== undefined) {
      updates.tomorrowPlan = tomorrowPlan;
    }
    if (projectIds !== undefined) {
      updates.projectIds = projectIds;
    }

    // Update report using Prisma
    const report = await updateReport(params.id, updates);

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
    });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: '更新日报失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if report exists
    const { getReportById, deleteReport } = await import('@/lib/db');
    const existingReport = await getReportById(params.id);
    
    if (!existingReport) {
      return NextResponse.json(
        { error: '日报不存在' },
        { status: 404 }
      );
    }

    // Delete report using Prisma
    await deleteReport(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: '删除日报失败' },
      { status: 500 }
    );
  }
}

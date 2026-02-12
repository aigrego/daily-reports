import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/db';

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const { name, department, role } = await request.json();

    if (!name || !department || !role) {
      return NextResponse.json(
        { error: '请提供完整信息' },
        { status: 400 }
      );
    }

    // API 端设置默认密码
    const user = await createUser({
      name,
      department,
      role,
      password: 'Dev123!',
    });

    return NextResponse.json({
      success: true,
      user,
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    );
  }
}

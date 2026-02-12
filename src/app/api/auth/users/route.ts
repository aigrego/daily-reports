import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const users = await getUsers();
    
    // Return users for login page
    const loginUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      department: user.department,
      role: user.role,
    }));

    return NextResponse.json({ users: loginUsers });
  } catch (error) {
    console.error('Get login users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

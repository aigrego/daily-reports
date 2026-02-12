import { NextRequest, NextResponse } from 'next/server';
import { getUserWithPassword, verifyPassword } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: '请提供用户ID和密码' },
        { status: 400 }
      );
    }

    const user = await getUserWithPassword(userId);

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }

    // 使用加密验证（传入用户独立的盐值）
    const isValid = verifyPassword(password, user.password, user.passwordSalt);

    if (!isValid) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}

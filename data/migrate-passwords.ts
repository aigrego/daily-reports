import { prisma } from '../src/lib/prisma';
import { generateSalt, encryptPassword } from '../src/lib/crypto';

async function migratePasswords() {
  console.log('🔐 开始迁移用户密码（使用独立盐值）...\n');

  try {
    // 获取所有用户
    const users = await prisma.user.findMany();
    console.log(`找到 ${users.length} 个用户\n`);

    // 更新每个用户的密码
    const newPassword = 'Dev123!';

    for (const user of users) {
      // 为每个用户生成独立的盐值
      const salt = generateSalt();
      
      // 使用盐值加密密码
      const encryptedPassword = encryptPassword(newPassword, salt);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: encryptedPassword,
          passwordSalt: salt,
          // 如果没有 displayName，使用 name 作为默认值
          displayName: user.displayName || user.name,
        },
      });
      
      console.log(`✓ ${user.name}`);
      console.log(`  盐值: ${salt.slice(0, 16)}...`);
      console.log(`  密文: ${encryptedPassword.slice(0, 32)}...`);
    }

    console.log('\n✅ 密码迁移完成！');
    console.log(`所有用户密码已设置为: ${newPassword}`);
    console.log('每个用户拥有独立的盐值（校验位）');
    console.log('加密方案: AES-256-CBC + SHA256 密钥派生');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();

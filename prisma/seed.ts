import { seedDatabase } from '../src/lib/db';

async function main() {
  console.log('🌱 开始种子数据...');
  await seedDatabase();
  console.log('✅ 种子数据完成!');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据失败:', e);
    process.exit(1);
  });

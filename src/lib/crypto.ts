import crypto from 'crypto';

// 系统密钥，用于加密盐值本身（可选的安全层）
const SYSTEM_KEY = process.env.SYSTEM_KEY || 'daily-report-system-key';

/**
 * 生成随机盐值
 * 用于每个用户的独立校验位
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 加密密码
 * 
 * 方案：
 * 1. 生成随机盐值 (salt) 作为校验位
 * 2. 使用 AES-256-CBC 加密密码
 * 3. 密钥派生：SHA256(password + salt) 生成加密密钥
 * 4. 存储格式: iv:encryptedData (盐值单独存储在 passwordSalt 字段)
 * 
 * @param password 明文密码
 * @param salt 用户独立的盐值（校验位）
 * @returns 加密后的密文
 */
export function encryptPassword(password: string, salt: string): string {
  // 1. 生成随机 IV
  const iv = crypto.randomBytes(16);

  // 2. 派生加密密钥：SHA256(密码 + 盐值)
  // 这样即使两个用户密码相同，加密结果也不同（因为盐值不同）
  const key = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest();

  // 3. AES-256-CBC 加密
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 4. 返回：IV + 密文
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 验证密码
 * 
 * @param inputPassword 用户输入的密码
 * @param encryptedPassword 存储的加密密码
 * @param salt 用户独立的盐值
 * @returns 是否验证通过
 */
export function verifyPassword(
  inputPassword: string,
  encryptedPassword: string,
  salt: string
): boolean {
  try {
    // 1. 解析存储的密码
    const [ivHex, encryptedData] = encryptedPassword.split(':');
    if (!ivHex || !encryptedData) return false;

    const iv = Buffer.from(ivHex, 'hex');

    // 2. 使用相同的密钥派生方式
    const key = crypto
      .createHash('sha256')
      .update(inputPassword + salt)
      .digest();

    // 3. AES-256-CBC 解密
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // 4. 时间安全比较（防止时序攻击）
    return crypto.timingSafeEqual(
      Buffer.from(decrypted),
      Buffer.from(inputPassword)
    );
  } catch (error) {
    return false;
  }
}

/**
 * 重新加密密码（用于密码修改）
 * 生成新的盐值，确保安全性
 */
export function reencryptPassword(password: string): {
  encryptedPassword: string;
  salt: string;
} {
  const salt = generateSalt();
  const encryptedPassword = encryptPassword(password, salt);
  return { encryptedPassword, salt };
}

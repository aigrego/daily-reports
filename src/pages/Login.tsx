import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Lock, Eye, EyeOff, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { User } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { users, login } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 模拟密码验证（实际项目中应该调用API）
  const mockPasswords: Record<string, string> = {
    '1': 'zhangsan123', // 张三
    '2': 'lisi123',     // 李四
    '3': 'wangwu123',   // 王五
    '4': 'zhaoliu123',  // 赵六
    '5': 'sunqi123',    // 孙七
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setPassword('');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password) return;

    setIsLoading(true);
    setError('');

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 模拟密码验证（实际项目中应该调用后端API）
    const expectedPassword = mockPasswords[selectedUser.id];
    if (password === expectedPassword) {
      login(selectedUser);
      navigate('/dashboard');
    } else {
      setError('密码错误，请重试');
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'lead':
        return '负责人';
      default:
        return '成员';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'lead':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white mb-4 shadow-lg shadow-purple-200">
            <Users size={32} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Daily Report</h1>
          <p className="text-neutral-500">选择用户进入系统</p>
        </div>

        {/* User Selection */}
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">选择用户</h2>
            <div className="space-y-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-neutral-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-lg font-semibold text-neutral-700">
                    {user.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-neutral-900">{user.name}</div>
                    <div className="text-sm text-neutral-500">{user.department}</div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-400 text-sm mt-6">
          Daily Report System v1.0
        </p>
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">输入密码</h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                欢迎回来，{selectedUser.name}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-sm font-semibold">
                  {selectedUser.name[0]}
                </div>
                <div>
                  <div className="font-medium text-neutral-900">{selectedUser.name}</div>
                  <div className="text-xs text-neutral-500">{selectedUser.department}</div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-3 rounded-2xl border border-neutral-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}

              {/* Hint */}
              <div className="text-xs text-neutral-400 bg-neutral-50 p-3 rounded-xl">
                <p className="font-medium mb-1">测试密码：</p>
                <p>张三: zhangsan123</p>
                <p>李四: lisi123</p>
                <p>王五: wangwu123</p>
                <p>赵六: zhaoliu123</p>
                <p>孙七: sunqi123</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!password || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  password && !isLoading
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    登录
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

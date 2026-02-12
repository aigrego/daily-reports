'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Users, ArrowRight, Lock, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

interface LoginUser {
  id: string;
  name: string;
  department: string;
  role: 'member' | 'lead' | 'admin';
}

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, login, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LoginUser | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    // Fetch users from API
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch(err => {
        console.error('Failed to fetch users:', err);
      });
  }, []);

  const handleUserSelect = (user: LoginUser) => {
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

    const success = await login(selectedUser.id, password);

    if (success) {
      router.push('/dashboard');
    } else {
      setError('密码错误，请重试');
      setIsLoading(false);
    }
  };

  // Generate consistent avatar color based on user name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-cyan-400 to-cyan-600',
      'from-teal-400 to-teal-600',
      'from-emerald-400 to-emerald-600',
      'from-orange-400 to-orange-600',
      'from-red-400 to-red-600',
      'from-violet-400 to-violet-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg shadow-purple-200 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Daily Report Logo"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Daily Report</h1>
          <p className="text-neutral-500">选择用户进入系统</p>
        </div>

        {/* User Selection */}
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">选择用户</h2>
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="group flex flex-col items-center p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(user.name)} flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                    {user.name[0]}
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">{user.name}</div>
                    <div className="text-xs text-neutral-500 mt-1">{user.department}</div>
                  </div>
                  <span
                    className={`mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(
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
                <p className="font-medium mb-1">默认密码：</p>
                <p className="font-mono text-neutral-600">Dev123!</p>
                <p className="mt-1 text-neutral-400">所有用户使用相同密码</p>
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

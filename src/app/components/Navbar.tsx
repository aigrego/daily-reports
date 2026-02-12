'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  Users,
  LogOut,
  ChevronDown,
  FileText,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../providers/AuthProvider';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, canManageProjects, canManageMembers } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
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

  const navItems = [
    { path: '/dashboard', label: '概览', icon: LayoutDashboard },
    { path: '/report/new', label: '写日报', icon: FileText },
    { path: '/summary', label: '汇总', icon: BarChart3 },
    ...(canManageProjects()
      ? [{ path: '/projects', label: '项目', icon: FolderKanban }]
      : []),
    ...(canManageMembers()
      ? [{ path: '/members', label: '成员', icon: Users }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
              <Image
                src="/logo.png"
                alt="Daily Report Logo"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <span className="font-bold text-xl text-neutral-900">Daily Report</span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-600 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-blue-500' : ''} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-100 transition-colors">
                <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-semibold text-neutral-700">
                  {currentUser?.name[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-neutral-900">
                    {currentUser?.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {getRoleLabel(currentUser?.role || '')}
                  </div>
                </div>
                <ChevronDown size={16} className="text-neutral-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] bg-white rounded-2xl shadow-xl border border-neutral-200 p-2 animate-in fade-in zoom-in-95 duration-200"
                sideOffset={8}
                align="end"
              >
                <div className="px-3 py-2 border-b border-neutral-100 mb-2">
                  <div className="font-medium text-neutral-900">{currentUser?.name}</div>
                  <div className="text-sm text-neutral-500">{currentUser?.department}</div>
                </div>
                <DropdownMenu.Item asChild>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-neutral-200 overflow-x-auto">
        <div className="flex items-center gap-1 px-4 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-neutral-600 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-blue-500' : ''} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

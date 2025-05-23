import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarLink,
} from '@/components/ui/sidebar';
import {
  GalleryVerticalEnd,
  Home,
  User,
  Settings,
  LogOut,
  Upload,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar>
      <SidebarHeader>
        <a
          href="/dashboard"
          className="flex items-center gap-2 font-medium text-foreground"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Kanora</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
          Library
        </div>
        <SidebarLink
          icon={<Home />}
          label="Home"
          active={location.pathname === '/dashboard'}
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard');
          }}
          href="/dashboard"
        />
        <SidebarLink
          icon={<Users />}
          label="Artists"
          active={isActive('/artists')}
          onClick={(e) => {
            e.preventDefault();
            navigate('/artists');
          }}
          href="/artists"
        />
        <div className="px-2 pt-4 pb-1 text-xs font-semibold text-muted-foreground">
          Manage
        </div>
        <SidebarLink
          icon={<Upload />}
          label="Import"
          active={isActive('/manage/import')}
          onClick={(e) => {
            e.preventDefault();
            navigate('/manage/import');
          }}
          href="/manage/import"
        />
        <SidebarLink
          icon={<RefreshCw />}
          label="Scan"
          active={isActive('/manage/scan')}
          onClick={(e) => {
            e.preventDefault();
            navigate('/manage/scan');
          }}
          href="/manage/scan"
        />
        <div className="px-2 pt-4 pb-1 text-xs font-semibold text-muted-foreground">
          Account
        </div>
        <SidebarLink
          icon={<User />}
          label="Profile"
          active={location.pathname.startsWith('/profile')}
          onClick={(e) => {
            e.preventDefault();
            navigate('/profile');
          }}
          href="/profile"
        />
        <SidebarLink
          icon={<Settings />}
          label="Settings"
          active={location.pathname.startsWith('/settings')}
          onClick={(e) => {
            e.preventDefault();
            navigate('/settings');
          }}
          href="/settings"
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarLink
          icon={<LogOut />}
          label="Logout"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
          href="/login"
        />
      </SidebarFooter>
    </Sidebar>
  );
}

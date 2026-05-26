import { NavLink, Outlet } from 'react-router-dom';
import ParticleBackground from '../ui/ParticleBackground';
import {
  LayoutDashboard, Upload, BarChart3, GitCompare,
  Wrench, ScrollText, Database, Users, Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: '数据总览', icon: LayoutDashboard },
  { to: '/upload', label: '上传数据', icon: Upload },
  { to: '/analysis', label: '数据分析', icon: BarChart3 },
  { to: '/compare', label: '周期对比', icon: GitCompare },
  { to: '/after-sales', label: '售后分析', icon: Wrench },
  { to: '/records', label: '运营记录', icon: ScrollText },
  { to: '/data-manage', label: '数据管理', icon: Database },
  { to: '/influencer', label: '达人建联', icon: Users },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-mesh-flow">
      <ParticleBackground />
      <div className="mesh-orb-1" style={{ top: '-10%', left: '-5%' }} />
      <div className="mesh-orb-2" style={{ bottom: '-5%', right: '-8%' }} />
      <div className="mesh-orb-3" style={{ top: '40%', left: '50%' }} />
      <aside className="w-64 glass-sidebar flex flex-col shrink-0 relative z-10 scan-line">
        <div className="h-[1px] bg-gradient-to-r from-emerald-500/60 via-teal-500/30 to-transparent shrink-0" />
        <div className="px-5 py-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.25)]">
              <Sparkles size={16} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight" style={{ fontFamily: "'Geist', sans-serif" }}>
                TikTok 看板
              </h1>
              <p className="text-[11px] gradient-text opacity-80 leading-tight">AI-Powered Analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-100 border-l-[2px] border-emerald-400/60 -ml-[2px]'
                    : 'text-slate-400 hover:text-emerald-50 hover:bg-emerald-500/5 border-l-[2px] border-transparent -ml-[2px]'
                }`
              }
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              <item.icon size={18} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-data-pulse" />
            <p className="text-xs text-slate-400" style={{ fontFamily: "'Geist', sans-serif" }}>System Online</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative z-10">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

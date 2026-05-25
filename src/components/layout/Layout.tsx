import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: '数据总览', icon: '📊' },
  { to: '/upload', label: '上传数据', icon: '📤' },
  { to: '/analysis', label: '数据分析', icon: '🔍' },
  { to: '/compare', label: '周期对比', icon: '📋' },
  { to: '/after-sales', label: '售后分析', icon: '🔧' },
  { to: '/records', label: '运营记录', icon: '📝' },
  { to: '/data-manage', label: '数据管理', icon: '⚙️' },
  { to: '/influencer', label: '达人建联', icon: '🤝' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600">TikTok 运营看板</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

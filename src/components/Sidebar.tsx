import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Cherry,
  LayoutDashboard,
  ListChecks,
  Package,
  ShoppingCart,
  Wallet,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
};

export default function Sidebar({ collapsed, onToggleCollapse, isMobile = false, isOpen = false }: SidebarProps) {
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/listas', label: 'Minhas Listas', icon: ListChecks },
    { path: '/dispensa', label: 'Dispensa', icon: Package },
    { path: '/dia-compra', label: 'Dia de Compra', icon: ShoppingCart },
    { path: '/financeiro', label: 'Financeiro', icon: Wallet },
    { path: '/perfil', label: 'Perfil', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <aside
        className={`relative bg-white border-r border-gray-200 transition-all duration-[240ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 p-[14px]">
            <div className="bg-[#ffd400] rounded-lg w-9 h-9 flex items-center justify-center">
              <Cherry className="w-5 h-5 text-black" />
            </div>
            {!collapsed && <span className="text-[15px] font-semibold text-black">Cherry</span>}
          </div>

          <nav className="mt-2 flex flex-col gap-1.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer select-none ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ffd400]/12 to-transparent text-black'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <div className="w-7 h-7 flex items-center justify-center text-base">
                    <Icon className="w-5 h-5" />
                  </div>
                  {!collapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto p-2 border-t border-gray-200">
            {!collapsed && (
              <div className="mb-3 px-3 py-2.5 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium text-black truncate">
                  {profile?.name || user?.email}
                </p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Sair' : undefined}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="text-sm">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      <button
        onClick={onToggleCollapse}
        className={`fixed bg-white rounded-full p-1.5 w-10 h-10 shadow-lg items-center justify-center transition-all duration-[240ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] cursor-pointer border border-gray-200 hover:bg-[#ffd400] z-50 ${
          isMobile ? (isOpen ? 'flex' : 'hidden') : 'flex'
        }`}
        style={{
          left: isMobile ? 'auto' : (collapsed ? 'calc(68px - 22px)' : 'calc(260px - 22px)'),
          right: isMobile ? '14px' : 'auto',
          top: isMobile ? '14px' : '12px',
        }}
        aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        aria-expanded={isMobile ? isOpen : !collapsed}
      >
        {collapsed || isMobile ? (
          <ChevronRight className="w-4 h-4 text-black" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-black" />
        )}
      </button>
    </>
  );
}
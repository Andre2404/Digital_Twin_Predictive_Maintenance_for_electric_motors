'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MechasenseLogo } from './Logo';
import { useRealtimeSensorData } from '@/hooks/useRealtimeSensorData';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'AI Center', href: '/ai-center' },
  // { label: 'Settings', href: '/settings' }, // Hidden for now
];

// TODO: In production, allow user to select motor
const DEFAULT_MOTOR_ID = 'motor_1';

export function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useRealtimeSensorData(DEFAULT_MOTOR_ID);
  
  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-white">Mechasense</span>
          </Link>
          
          {/* Navigation Menu */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-white ${
                  pathname === item.href
                    ? 'text-white border-b-2 border-white pb-1'
                    : 'text-lightgray'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* ESP Status Indicator - Real-time dari Firebase */}
            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-secondary rounded-full">
              <div className={`status-dot ${isConnected ? 'bg-status-normal animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-white font-medium">
                ESP: {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}


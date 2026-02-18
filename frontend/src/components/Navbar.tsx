'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Home', href: '/', icon: '🏠' },
  { name: 'My Jobs', href: '/jobs', icon: '📋' },
  { name: 'Hunter', href: '/hunter', icon: '🔍' },
  { name: 'Outreach', href: '/outreach', icon: '📧' },
  { name: 'Referrals', href: '/referrals', icon: '🤝' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3 ${
      scrolled ? 'bg-black/40 backdrop-blur-lg border-b border-white/10 shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            JobSearchAI
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isActive 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="flex md:hidden items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`p-2 rounded-full text-sm flex items-center justify-center transition-all duration-200 ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/60'
                }`}
                title={item.name}
              >
                <span>{item.icon}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

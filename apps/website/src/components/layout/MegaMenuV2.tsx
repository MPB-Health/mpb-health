import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Layers,
  Users,
  Building2,
  Briefcase,
  GitCompare,
  CircleHelp,
  Sparkles,
  Award,
  BookOpen,
  Newspaper,
  Library,
  Mic2,
  Calendar,
  Heart,
  HelpCircle,
  Info,
  Mail,
  LayoutDashboard,
  Wrench,
  ExternalLink,
  FileText,
  UserCog,
  Zap,
  UserPlus,
  MessageSquare,
  Star,
  Phone,
  LifeBuoy,
  ClipboardList,
  UserMinus,
  UserCircle,
  Shield,
  MapPin,
  Calculator,
  MessageCircle,
  Edit3,
  CreditCard,
  Pill,
  XCircle,
  PartyPopper,
  Book,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: string;
  external: boolean;
  badge?: string;
  children?: NavigationItem[];
}

interface MegaMenuV2Props {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (itemId: string) => void;
  columns?: 2 | 3 | 4;
  featuredContent?: React.ReactNode;
}

// Icon map for navigation-driven dynamic icon rendering (avoids wildcard import)
const navIconMap: Record<string, LucideIcon> = {
  Home, Layers, Users, Building2, Briefcase, GitCompare, CircleHelp,
  Sparkles, Award, BookOpen, Newspaper, Library, Mic2, Calendar, Heart,
  HelpCircle, Info, Mail, LayoutDashboard, Wrench, ExternalLink, FileText,
  UserCog, Zap, UserPlus, UserCircle, MessageSquare, Star, Phone, LifeBuoy,
  ClipboardList, UserMinus, Shield, MapPin, Calculator, MessageCircle,
  Edit3, CreditCard, Pill, XCircle, PartyPopper, Book,
};

/** Resolves string keys from nav config; falls back so every link keeps a visible icon */
const getIconComponent = (iconName?: string): LucideIcon => {
  if (!iconName) return FileText;
  return navIconMap[iconName] ?? FileText;
};

export const MegaMenuV2: React.FC<MegaMenuV2Props> = ({
  items,
  isOpen,
  onClose,
  onItemClick,
  columns = 3,
  featuredContent,
}) => {
  if (!isOpen) return null;

  const firstItem = items[0];
  const childCount = firstItem?.children?.length || 0;

  const autoColumns = childCount <= 2 ? 2 : childCount <= 4 ? 2 : childCount <= 6 ? 3 : 4;
  const actualColumns = columns || autoColumns;

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-4',
  };

  const handleItemClick = (itemId: string) => {
    onItemClick?.(itemId);
    onClose();
  };

  const widthClasses = {
    2: 'w-[600px]',
    3: 'w-[900px]',
    4: 'w-[1100px]',
  };

  return (
    <div className={cn(
      "absolute left-1/2 -translate-x-1/2 mt-2 bg-white border-t-2 border-blue-600 shadow-2xl animate-fade-in z-[60] rounded-lg max-w-[calc(100vw-2rem)]",
      widthClasses[actualColumns as keyof typeof widthClasses]
    )}>
      <div className="px-6 py-8">
        {featuredContent && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            {featuredContent}
          </div>
        )}

        <div className={cn('grid gap-x-8 gap-y-6', gridCols[actualColumns as keyof typeof gridCols])}>
          {items.map((item) => {
            const Icon = getIconComponent(item.icon);

            if (item.children && item.children.length > 0) {
              return (
                <div key={item.id} className="space-y-4">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                    {item.label}
                  </h3>
                  <ul className="space-y-3">
                    {item.children.map((child) => {
                      const ChildIcon = getIconComponent(child.icon);
                      const content = (
                        <div className="flex items-start space-x-3 group">
                          <ChildIcon className="h-5 w-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                                {child.label}
                              </span>
                              {child.badge && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full whitespace-nowrap">
                                  {child.badge}
                                </span>
                              )}
                            </div>
                            {child.description && (
                              <p className="text-xs text-neutral-600 mt-1 leading-relaxed line-clamp-2 pr-4">
                                {child.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );

                      if (child.external) {
                        return (
                          <li key={child.id}>
                            <a
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block py-2 px-3 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:shadow-sm"
                              onClick={() => handleItemClick(child.id)}
                            >
                              {content}
                            </a>
                          </li>
                        );
                      }

                      return (
                        <li key={child.id}>
                          <Link
                            to={child.href}
                            className="block py-2 px-3 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:shadow-sm"
                            onClick={() => handleItemClick(child.id)}
                          >
                            {content}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }

            const content = (
              <div className="flex items-start space-x-3 group">
                <Icon className="h-5 w-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );

            if (item.external) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                  onClick={() => handleItemClick(item.id)}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.href}
                className="block py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => handleItemClick(item.id)}
              >
                {content}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 text-center">
            Need help finding something? <Link to="/support" className="text-blue-600 hover:text-blue-700 font-medium transition-colors" onClick={onClose}>Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

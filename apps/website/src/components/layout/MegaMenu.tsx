import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface MegaMenuItem {
  title: string;
  description?: string;
  icon?: LucideIcon;
  href: string;
  external?: boolean;
}

interface MegaMenuSection {
  title: string;
  items: MegaMenuItem[];
}

interface MegaMenuProps {
  sections: MegaMenuSection[];
  isOpen: boolean;
  onClose: () => void;
}

const MegaMenuComponent: React.FC<MegaMenuProps> = ({
  sections,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const midPoint = Math.ceil(sections.length / 2);
  const leftColumn = sections.slice(0, midPoint);
  const rightColumn = sections.slice(midPoint);

  return (
    <div className="absolute left-0 right-0 mt-2 bg-white border-t-2 border-primary shadow-2xl animate-fade-in z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 lg:divide-x lg:divide-neutral-200">
          <div className="space-y-8 lg:pr-12">
            {leftColumn.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b-2 border-primary/20 pb-3">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const content = (
                      <div className="flex items-start space-x-3 group">
                        {Icon && (
                          <Icon className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-neutral-900 group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          {item.description && (
                            <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );

                    if (item.external) {
                      return (
                        <li key={itemIdx}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block py-2 px-3 rounded-lg hover:bg-neutral-50 transition-colors"
                            onClick={onClose}
                          >
                            {content}
                          </a>
                        </li>
                      );
                    }

                    return (
                      <li key={itemIdx}>
                        <Link
                          to={item.href}
                          className="block py-2 px-3 rounded-lg hover:bg-neutral-50 transition-colors"
                          onClick={onClose}
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="space-y-8 lg:pl-12">
            {rightColumn.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b-2 border-primary/20 pb-3">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const content = (
                      <div className="flex items-start space-x-3 group">
                        {Icon && (
                          <Icon className="h-5 w-5 text-primary mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-neutral-900 group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          {item.description && (
                            <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );

                    if (item.external) {
                      return (
                        <li key={itemIdx}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block py-2 px-3 rounded-lg hover:bg-neutral-50 transition-colors"
                            onClick={onClose}
                          >
                            {content}
                          </a>
                        </li>
                      );
                    }

                    return (
                      <li key={itemIdx}>
                        <Link
                          to={item.href}
                          className="block py-2 px-3 rounded-lg hover:bg-neutral-50 transition-colors"
                          onClick={onClose}
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MegaMenu = memo(MegaMenuComponent);

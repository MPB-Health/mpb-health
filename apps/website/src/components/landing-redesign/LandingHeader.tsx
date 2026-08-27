import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  useSiteNav,
  getAccountRoute,
  getIconComponent,
  signInRedirect,
  type SiteNavItem,
} from '../../lib/useSiteNav';

type MenuKey = 'memberships' | 'resources' | 'members' | 'about';

const PLAIN_LINKS = [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Features', to: '/features' },
  { label: 'Advisor Directory', to: '/advisor-directory' },
];

function DropdownPanel({
  items,
  wide,
  onNavigate,
}: {
  items: SiteNavItem[];
  wide?: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className={wide ? 'lr-menu lr-menu--wide' : 'lr-menu'} role="menu">
      <div className="lr-menu__grid">
        {items.map((group) => {
          const GroupIcon = getIconComponent(group.icon);
          return (
            <div key={group.id} className="lr-menu__group">
              <h3 className="lr-menu__heading">
                <GroupIcon size={14} aria-hidden="true" />
                {group.label}
              </h3>
              <ul className="lr-menu__items">
                {(group.children ?? []).map((child) => {
                  const ChildIcon = getIconComponent(child.icon);
                  const body = (
                    <>
                      <ChildIcon className="lr-menu__icon" size={18} aria-hidden="true" />
                      <span className="lr-menu__text">
                        <span className="lr-menu__label">{child.label}</span>
                        {child.description ? (
                          <span className="lr-menu__desc">{child.description}</span>
                        ) : null}
                      </span>
                    </>
                  );
                  return (
                    <li key={child.id}>
                      {child.external ? (
                        <a
                          href={child.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lr-menu__link"
                          onClick={onNavigate}
                        >
                          {body}
                        </a>
                      ) : (
                        <Link to={child.href} className="lr-menu__link" onClick={onNavigate}>
                          {body}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LandingHeader({ floating = false }: { floating?: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [openSection, setOpenSection] = useState<MenuKey | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { isAuthenticated, userRole, membershipItems, resourcesItems, memberServicesItems, aboutItems } =
    useSiteNav();

  const dropdowns: Array<{ key: MenuKey; label: string; items: SiteNavItem[]; wide?: boolean }> = [
    { key: 'memberships', label: 'Memberships', items: membershipItems },
    { key: 'resources', label: 'Resources', items: resourcesItems },
    { key: 'members', label: 'Members', items: memberServicesItems, wide: true },
    { key: 'about', label: 'About', items: aboutItems },
  ];

  // Pill order: Memberships ▾ · How It Works · Features · Advisor Directory · Resources ▾ · Members ▾ · About ▾
  const pillOrder: Array<
    | { type: 'dropdown'; key: MenuKey }
    | { type: 'link'; label: string; to: string }
  > = [
    { type: 'dropdown', key: 'memberships' },
    ...PLAIN_LINKS.map((l) => ({ type: 'link' as const, label: l.label, to: l.to })),
    { type: 'dropdown', key: 'resources' },
    { type: 'dropdown', key: 'members' },
    { type: 'dropdown', key: 'about' },
  ];

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [openMenu]);

  const accountRoute = getAccountRoute(userRole);
  const accountIsExternal = accountRoute.startsWith('http');

  return (
    <header
      className={`lr-header ${floating || drawerOpen ? 'lr-header--pill' : 'lr-header--overlay'}`}
    >
      <div className="lr-header__bar">
      <Link to="/" className="lr-header__logo" aria-label="MPB Health Home">
        <img
          className="lr-header__logo-color"
          src="/assets/MPB-Health-No-background.webp"
          alt="MPB Health"
          width={1101}
          height={231}
          decoding="async"
        />
        <img
          className="lr-header__logo-white"
          src="/assets/logo.png"
          alt=""
          width={500}
          height={120}
          decoding="async"
        />
      </Link>

      <nav className="lr-header__nav" aria-label="Primary" ref={navRef}>
        <ul className="lr-header__list">
          {pillOrder.map((entry) => {
            if (entry.type === 'link') {
              return (
                <li key={entry.to}>
                  <Link to={entry.to} className="lr-header__link">
                    {entry.label}
                  </Link>
                </li>
              );
            }
            const dropdown = dropdowns.find((d) => d.key === entry.key)!;
            const isOpen = openMenu === dropdown.key;
            return (
              <li key={dropdown.key}>
                <button
                  type="button"
                  className={`lr-header__link lr-header__link--trigger${isOpen ? ' is-open' : ''}`}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  onClick={() => setOpenMenu(isOpen ? null : dropdown.key)}
                >
                  {dropdown.label}
                  <ChevronDown className="lr-header__chevron" size={14} aria-hidden="true" />
                </button>
                {isOpen ? (
                  <DropdownPanel
                    items={dropdown.items}
                    wide={dropdown.wide}
                    onNavigate={() => setOpenMenu(null)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="lr-header__actions">
        {isAuthenticated ? (
          accountIsExternal ? (
            <a href={accountRoute} className="lr-header__link lr-header__link--signin">
              My Account
            </a>
          ) : (
            <Link to={accountRoute} className="lr-header__link lr-header__link--signin">
              My Account
            </Link>
          )
        ) : (
          <button
            type="button"
            className="lr-header__link lr-header__link--signin"
            onClick={() => void signInRedirect()}
          >
            Sign In
          </button>
        )}
        <a className="lr-header__cta" href="#estimate">
          Get Your Quote
        </a>
      </div>

      <button
        type="button"
        className={`lr-header__burger${drawerOpen ? ' is-open' : ''}`}
        aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      </div>

      <div className={`lr-header__drawer${drawerOpen ? ' is-open' : ''}`}>
        {dropdowns.slice(0, 1).map((section) => (
          <DrawerSection
            key={section.key}
            section={section}
            open={openSection === section.key}
            onToggle={() =>
              setOpenSection((prev) => (prev === section.key ? null : section.key))
            }
            onNavigate={() => setDrawerOpen(false)}
          />
        ))}
        {PLAIN_LINKS.map((item) => (
          <Link key={item.to} to={item.to} onClick={() => setDrawerOpen(false)}>
            {item.label}
          </Link>
        ))}
        {dropdowns.slice(1).map((section) => (
          <DrawerSection
            key={section.key}
            section={section}
            open={openSection === section.key}
            onToggle={() =>
              setOpenSection((prev) => (prev === section.key ? null : section.key))
            }
            onNavigate={() => setDrawerOpen(false)}
          />
        ))}
        {isAuthenticated ? (
          accountIsExternal ? (
            <a href={accountRoute}>My Account</a>
          ) : (
            <Link to={accountRoute} onClick={() => setDrawerOpen(false)}>
              My Account
            </Link>
          )
        ) : (
          <button
            type="button"
            className="lr-drawer__signin"
            onClick={() => {
              setDrawerOpen(false);
              void signInRedirect();
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

function DrawerSection({
  section,
  open,
  onToggle,
  onNavigate,
}: {
  section: { key: MenuKey; label: string; items: SiteNavItem[] };
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="lr-drawer__section">
      <button type="button" className="lr-drawer__toggle" aria-expanded={open} onClick={onToggle}>
        {section.label}
        <ChevronDown className={`lr-header__chevron${open ? ' is-open' : ''}`} size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className="lr-drawer__panel">
          {section.items.map((group) => (
            <div key={group.id} className="lr-drawer__group">
              <div className="lr-drawer__heading">{group.label}</div>
              {(group.children ?? []).map((child) =>
                child.external ? (
                  <a
                    key={child.id}
                    href={child.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lr-drawer__link"
                    onClick={onNavigate}
                  >
                    {child.label}
                  </a>
                ) : (
                  <Link key={child.id} to={child.href} className="lr-drawer__link" onClick={onNavigate}>
                    {child.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

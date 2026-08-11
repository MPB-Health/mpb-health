import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const NAV: Array<{ label: string; to: string; signIn?: boolean }> = [
  { label: 'Memberships', to: '/plans' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Features', to: '/features' },
  { label: 'Advisor Directory', to: '/advisor-directory' },
  { label: 'Resources', to: '/resources' },
  { label: 'Member', to: '/member' },
  { label: 'Sign In', to: '/login', signIn: true },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="lr-header">
      <Link to="/" className="lr-header__logo" aria-label="MPB Health Home">
        <img src="/assets/logo.png" alt="MPB Health" width={500} height={120} decoding="async" />
      </Link>

      <nav className="lr-header__nav" aria-label="Primary">
        <ul className="lr-header__list">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={item.signIn ? 'lr-header__link lr-header__link--signin' : 'lr-header__link'}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        className={`lr-header__burger${open ? ' is-open' : ''}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`lr-header__drawer${open ? ' is-open' : ''}`}>
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

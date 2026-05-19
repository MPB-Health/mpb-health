import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/admin/AdminLayout';

function cmsActiveView(pathname: string): string {
  if (pathname.startsWith('/admin/cms/pages')) return 'cms-pages';
  if (pathname.startsWith('/admin/cms/media')) return 'cms-media';
  if (pathname.startsWith('/admin/cms/blog')) return 'cms-blog';
  if (pathname.startsWith('/admin/cms/templates')) return 'cms-templates';
  if (pathname.startsWith('/admin/cms/theme')) return 'cms-theme';
  if (pathname.startsWith('/admin/cms/forms')) return 'cms-forms';
  if (pathname.startsWith('/admin/cms/popups')) return 'cms-popups';
  if (pathname.startsWith('/admin/cms/redirects')) return 'cms-redirects';
  if (pathname.startsWith('/admin/cms/calendar')) return 'cms-calendar';
  if (pathname.startsWith('/admin/cms/seo')) return 'cms-seo';
  if (pathname.startsWith('/admin/cms/permissions')) return 'cms-permissions';
  return 'cms-hub';
}

/** Full-bleed editors need the full main area (no max-width padding). */
function isFullBleed(pathname: string): boolean {
  return (
    pathname.startsWith('/admin/cms/pages/') ||
    pathname.startsWith('/admin/cms/forms/') ||
    (pathname.startsWith('/admin/cms/popups/') && pathname !== '/admin/cms/popups')
  );
}

export default function CmsAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AdminLayout
      activeView={cmsActiveView(location.pathname)}
      onViewChange={(view) => navigate(`/admin?view=${view}`)}
      fullBleed={isFullBleed(location.pathname)}
    >
      <Outlet />
    </AdminLayout>
  );
}

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppDownloadSection } from '../blocks/AppDownloadSection';
import { BackToTop } from './BackToTop';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-[130px]">
        <Outlet />
      </main>
      <AppDownloadSection />
      <Footer />
      <BackToTop />
    </div>
  );
};

export { Layout };
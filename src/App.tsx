/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import InteractiveColumn from './components/GameCenter';
import LegalPortal from './components/LegalPortal';
import AIServices from './components/AIServices';
import LawyerServices from './components/LawyerServices';
import ToolboxAndCampus from './components/ToolboxAndCampus';
import Footer from './components/Footer';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Community from './components/Community';
import AIChat from './components/AIChat';
import AIAgentQA from './components/AIAgentQA';
import ContractScanner from './components/ContractScanner';
import ContractBuilder from './components/ContractBuilder';
import GamePlayer from './components/GamePlayer';
import LawyerDetail from './components/LawyerDetail';
import InternshipZone from './components/InternshipZone';
import PostDetail from './components/PostDetail';
import CreatePost from './components/CreatePost';
import DataCenter from './components/DataCenter';
import ArticleDetail from './components/ArticleDetail';
import LegalExamService from './components/LegalExamService';
import LegalExamQuestionBank from './components/LegalExamQuestionBank';
import LegalTrendsPage from './components/LegalTrendsPage';
import HeadlinesPage from './components/HeadlinesPage';
import Login from './components/Login';
import LawyerConsole from './components/LawyerConsole';
import { getAuthUser, isLoggedIn } from './lib/auth';
import { applyAppearancePrefs, loadAppearancePrefs } from './lib/userPreferences';

function SystemThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const prefs = loadAppearancePrefs();
      if (prefs.theme === 'system') {
        applyAppearancePrefs(prefs);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return null;
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // 切页默认回到顶部；若存在 hash，则保留锚点行为。
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search, hash]);

  return null;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RequireStudent({ children }: { children: JSX.Element }) {
  const authUser = getAuthUser();
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  if (authUser.role === 'lawyer') {
    return <Navigate to="/lawyer-console" replace />;
  }
  return children;
}

function RequireLawyer({ children }: { children: JSX.Element }) {
  const authUser = getAuthUser();
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  if (authUser.role !== 'lawyer') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppShell() {
  const location = useLocation();
  const authUser = getAuthUser();
  const isLawyerRoute = location.pathname.startsWith('/lawyer-console');
  const hideCommonLayout = location.pathname === '/login' || isLawyerRoute;
  const defaultHome = authUser?.role === 'lawyer' ? '/lawyer-console' : '/';

  return (
    <div className="overflow-x-hidden bg-background text-on-surface font-body min-h-screen flex flex-col">
      {!hideCommonLayout ? <Header /> : null}
      <main className={hideCommonLayout ? 'flex-grow' : 'pt-20 flex-grow'}>
        <Routes>
          <Route path="/login" element={isLoggedIn() ? <Navigate to={defaultHome} replace /> : <Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireStudent>
                  <>
                    <Hero />
                    <LegalPortal />
                  </>
                </RequireStudent>
              </RequireAuth>
            }
          />
          <Route path="/interactive-column" element={<RequireAuth><RequireStudent><InteractiveColumn /></RequireStudent></RequireAuth>} />
          <Route path="/ai-services" element={<RequireAuth><RequireStudent><AIServices /></RequireStudent></RequireAuth>} />
          <Route path="/legal-exam" element={<RequireAuth><RequireStudent><LegalExamService /></RequireStudent></RequireAuth>} />
          <Route path="/legal-exam-bank" element={<RequireAuth><RequireStudent><LegalExamQuestionBank /></RequireStudent></RequireAuth>} />
          <Route path="/legal-trends" element={<RequireAuth><RequireStudent><LegalTrendsPage /></RequireStudent></RequireAuth>} />
          <Route path="/headlines" element={<RequireAuth><RequireStudent><HeadlinesPage /></RequireStudent></RequireAuth>} />
          <Route path="/lawyer-services" element={<RequireAuth><RequireStudent><LawyerServices /></RequireStudent></RequireAuth>} />
          <Route path="/campus" element={<RequireAuth><RequireStudent><ToolboxAndCampus /></RequireStudent></RequireAuth>} />
          <Route path="/community" element={<RequireAuth><RequireStudent><Community /></RequireStudent></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><RequireStudent><Profile /></RequireStudent></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><RequireStudent><Settings /></RequireStudent></RequireAuth>} />
          <Route path="/ai-chat" element={<RequireAuth><RequireStudent><AIChat /></RequireStudent></RequireAuth>} />
          <Route path="/ai-agent-qa" element={<RequireAuth><RequireStudent><AIAgentQA /></RequireStudent></RequireAuth>} />
          <Route path="/scanner" element={<RequireAuth><RequireStudent><ContractScanner /></RequireStudent></RequireAuth>} />
          <Route path="/contract-builder" element={<RequireAuth><RequireStudent><ContractBuilder /></RequireStudent></RequireAuth>} />
          <Route path="/play/:id" element={<RequireAuth><RequireStudent><GamePlayer /></RequireStudent></RequireAuth>} />
          <Route path="/lawyer/:id" element={<RequireAuth><RequireStudent><LawyerDetail /></RequireStudent></RequireAuth>} />
          <Route path="/internship-zone" element={<RequireAuth><RequireStudent><InternshipZone /></RequireStudent></RequireAuth>} />
          <Route path="/post/:id" element={<RequireAuth><RequireStudent><PostDetail /></RequireStudent></RequireAuth>} />
          <Route path="/community/new" element={<RequireAuth><RequireStudent><CreatePost /></RequireStudent></RequireAuth>} />
          <Route path="/admin/data" element={<RequireAuth><RequireStudent><DataCenter /></RequireStudent></RequireAuth>} />
          <Route path="/admin/import" element={<RequireAuth><RequireStudent><Navigate to="/admin/data?tab=import" replace /></RequireStudent></RequireAuth>} />
          <Route path="/article/:id" element={<RequireAuth><RequireStudent><ArticleDetail /></RequireStudent></RequireAuth>} />
          <Route path="/lawyer-console" element={<RequireAuth><RequireLawyer><LawyerConsole /></RequireLawyer></RequireAuth>} />
          <Route path="*" element={<Navigate to={defaultHome} replace />} />
        </Routes>
      </main>
      {!hideCommonLayout ? <Footer /> : null}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SystemThemeSync />
      <AppShell />
    </BrowserRouter>
  );
}

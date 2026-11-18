import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import BottomNav from './components/BottomNav.jsx';
import LessonPage from './components/LessonPlayer.jsx';
import TutorChat from './components/tutor/TutorChat.jsx';
import AdventurePage from './pages/AdventurePage.jsx';
import City3DPage from './pages/City3DPage.jsx';
import FreePlanePage from './pages/FreePlanePage.jsx';
import HomePage from './pages/HomePage.jsx';
import MissionsPage from './pages/MissionsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PretestPage from './pages/PretestPage.jsx';
import QuestHomePage from './pages/QuestHomePage.jsx';
import QuestPlayPage from './pages/QuestPlayPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import TrialPage from './pages/TrialPage.jsx';
import { ProgressProvider } from './state/ProgressContext.jsx';

const TeacherPage = lazy(() => import('./pages/TeacherPage.jsx'));

const ROUTES = [
  { path: '/', title: 'cartes.play', wide: true, element: <AdventurePage /> },
  { path: '/modul', title: 'Modul Belajar', back: true, wide: true, element: <HomePage /> },
  { path: '/cek-awal', title: 'Cek Awal', back: true, theme: 'panel', element: <PretestPage /> },
  { path: '/belajar/:moduleId', title: 'Belajar', back: true, theme: 'panel', element: <LessonPage /> },
  { path: '/misi', title: 'Misi Bangun Kota', element: <MissionsPage /> },
  { path: '/misi/:missionId', title: 'Misi', back: true, element: <MissionsPage /> },
  { path: '/quest', title: 'Quest', wide: true, element: <QuestHomePage /> },
  { path: '/quest/:levelId', title: 'Quest', back: true, wide: true, theme: 'cosmic', element: <QuestPlayPage /> },
  { path: '/latihan', title: 'Kuis', element: <QuizPage /> },
  { path: '/bidang-bebas', title: 'Bidang Bebas', wide: true, element: <FreePlanePage /> },
  { path: '/kota-3d', title: 'Kota 3D', back: true, wide: true, element: <City3DPage /> },
  { path: '/uji-coba', title: 'Ikut Uji Coba', back: true, theme: 'panel', element: <TrialPage /> },
  { path: '/guru', title: 'Mode Guru', back: true, theme: 'panel', element: <TeacherPage /> },
  { path: '*', title: 'Tidak ditemukan', back: true, theme: 'panel', element: <NotFoundPage /> },
];

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {ROUTES.map(({ path, title, back, wide, theme, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <AppShell title={title} back={back} wide={wide} theme={theme}>
                  <Suspense fallback={<p className="muted">Memuat…</p>}>{element}</Suspense>
                </AppShell>
              }
            />
          ))}
        </Routes>
        <BottomNav />
        <TutorChat />
      </HashRouter>
    </ProgressProvider>
  );
}

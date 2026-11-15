import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import BottomNav from './components/BottomNav.jsx';
import LessonPage from './components/LessonPlayer.jsx';
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
  { path: '/', title: 'c-quest.sn25', wide: true, element: <HomePage /> },
  { path: '/cek-awal', title: 'Cek Awal', back: true, element: <PretestPage /> },
  { path: '/belajar/:moduleId', title: 'Belajar', back: true, element: <LessonPage /> },
  { path: '/misi', title: 'Misi Bangun Kota', element: <MissionsPage /> },
  { path: '/misi/:missionId', title: 'Misi', back: true, element: <MissionsPage /> },
  { path: '/quest', title: 'Quest', wide: true, element: <QuestHomePage /> },
  { path: '/quest/:levelId', title: 'Quest', back: true, wide: true, element: <QuestPlayPage /> },
  { path: '/latihan', title: 'Latihan Soal', element: <QuizPage /> },
  { path: '/bidang-bebas', title: 'Bidang Bebas', element: <FreePlanePage /> },
  { path: '/kota-3d', title: 'Kota 3D', back: true, element: <City3DPage /> },
  { path: '/uji-coba', title: 'Ikut Uji Coba', back: true, element: <TrialPage /> },
  { path: '/guru', title: 'Mode Guru', back: true, element: <TeacherPage /> },
  { path: '*', title: 'Tidak ditemukan', back: true, element: <NotFoundPage /> },
];

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {ROUTES.map(({ path, title, back, wide, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <AppShell title={title} back={back} wide={wide}>
                  <Suspense fallback={<p className="muted">Memuat…</p>}>{element}</Suspense>
                </AppShell>
              }
            />
          ))}
        </Routes>
        <BottomNav />
      </HashRouter>
    </ProgressProvider>
  );
}

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/user';
import { searchApi } from '@/services';
import Layout from './components/Layout';
import Loading from './components/common/Loading';

const Home = lazy(() => import('./pages/Home'));
const Works = lazy(() => import('./pages/Works'));
const WorkDetail = lazy(() => import('./pages/WorkDetail'));
const Notes = lazy(() => import('./pages/Notes'));
const Statistics = lazy(() => import('./pages/Statistics'));
const AnnualReport = lazy(() => import('./pages/AnnualReport'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useUserStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

function App() {
  const { restoreAuth, setChineseColors, isAuthenticated } = useUserStore();

  useEffect(() => {
    restoreAuth();
    searchApi.colors().then(setChineseColors).catch(() => {});
  }, [restoreAuth, setChineseColors]);

  useEffect(() => {
    if (isAuthenticated) {
      searchApi.colors().then(setChineseColors).catch(() => {});
    }
  }, [isAuthenticated, setChineseColors]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="works" element={<Works />} />
          <Route path="works/:id" element={<WorkDetail />} />
          <Route path="notes" element={<Notes />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="annual-report/:year" element={<AnnualReport />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

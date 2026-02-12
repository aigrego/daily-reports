import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewReport from './pages/NewReport';
import Summary from './pages/Summary';
import Projects from './pages/Projects';
import Members from './pages/Members';

// Protected route wrapper
function ProtectedRoute() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Permission-based route wrapper
function PermissionRoute({
  canAccess,
  redirectTo = '/dashboard',
}: {
  canAccess: boolean;
  redirectTo?: string;
}) {
  if (!canAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

function AppRoutes() {
  const { canManageProjects, canManageMembers } = useApp();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report/new" element={<NewReport />} />
        <Route path="/summary" element={<Summary />} />

        <Route element={<PermissionRoute canAccess={canManageProjects()} />}>
          <Route path="/projects" element={<Projects />} />
        </Route>

        <Route element={<PermissionRoute canAccess={canManageMembers()} />}>
          <Route path="/members" element={<Members />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ApiKeysPage from './pages/ApiKeysPage';
import DeploymentsPage from './pages/DeploymentsPage';
import JobsPage from './pages/JobsPage';
import UsagePage from './pages/UsagePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/api-keys" replace />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="deployments" element={<DeploymentsPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="usage" element={<UsagePage />} />
      </Route>
    </Routes>
  );
}

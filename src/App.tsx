import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import ComparePage from './pages/ComparePage';
import RecordsPage from './pages/RecordsPage';
import DataManagePage from './pages/DataManagePage';
import AfterSalesPage from './pages/AfterSalesPage';
import InfluencerPage from './pages/InfluencerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/analysis/:periodId" element={<AnalysisPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/data-manage" element={<DataManagePage />} />
          <Route path="/after-sales" element={<AfterSalesPage />} />
          <Route path="/influencer" element={<InfluencerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

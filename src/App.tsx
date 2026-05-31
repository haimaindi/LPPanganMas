import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProdukKatalog from './pages/ProdukKatalog';
import CabangMagelangPage from './pages/CabangMagelangPage';
import CabangMalangPage from './pages/CabangMalangPage';
import KontakPage from './pages/KontakPage';
import DetailPesan from './pages/DetailPesan';
import CompanyProfileDetail from './pages/CompanyProfileDetail';
import CompanyProfileForm from './pages/CompanyProfileForm';
import AdminBranchForm from './pages/AdminBranchForm';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/produk" element={<ProdukKatalog />} />
        <Route path="/admin/inbox/:id" element={<DetailPesan />} />
        <Route path="/admin/profil" element={<CompanyProfileForm />} />
        <Route path="/admin/branch/:id" element={<AdminBranchForm />} />
        <Route path="/cabang/magelang" element={<CabangMagelangPage />} />
        <Route path="/cabang/malang" element={<CabangMalangPage />} />
        <Route path="/kontak" element={<KontakPage />} />
        <Route path="/profil" element={<CompanyProfileDetail />} />
      </Routes>
    </Router>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import PaymentsPage from "./pages/PaymentsPage";
import PricingPage from "./pages/PricingPage";
import AuditsPage from "./pages/AuditsPage";
import TransitairesPage from "./pages/TransitairesPage";
import DocumentsPage from "./pages/DocumentsPage";
import ClientsPage from "./pages/ClientsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import SuiviPage from "./pages/SuiviPage";
import NewShipmentPage from "./pages/NewShipmentPage";
import HistoriquePage from "./pages/HistoriquePage";
import AgendaPage from "./pages/AgendaPage";
import ContactsPage from "./pages/ContactsPage";
import CommissionsPage from "./pages/CommissionsPage";
import TresoreriePage from "./pages/TresoreriePage";
import NotificationsPage from "./pages/NotificationsPage";
import ModulesPage from "./pages/ModulesPage";

function Protected({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Protected><AdminLayout /></Protected>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/shipments" element={<ShipmentsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/audits" element={<AuditsPage />} />
          <Route path="/transporteurs" element={<TransitairesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/suivi" element={<SuiviPage />} />
          <Route path="/nouveau-colis" element={<NewShipmentPage />} />
          <Route path="/historique" element={<HistoriquePage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/commissions" element={<CommissionsPage />} />
          <Route path="/tresorerie" element={<TresoreriePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/modules" element={<ModulesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
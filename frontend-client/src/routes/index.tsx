import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { TransitaireLayout } from "@/layouts/TransitaireLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { GuestRoute } from "@/components/layout/GuestRoute";
import { TransitaireRoute } from "@/components/layout/TransitaireRoute";
import { HomePage } from "@/pages/public/HomePage";
import { CatalogPage } from "@/pages/public/CatalogPage";
import { ProductDetailPage } from "@/pages/public/ProductDetailPage";
import { CartPage } from "@/pages/public/CartPage";
import { CheckoutPage } from "@/pages/public/CheckoutPage";
import { ServicesPage } from "@/pages/public/ServicesPage";
import { PricingPage } from "@/pages/public/PricingPage";
import { TrackingPage } from "@/pages/public/TrackingPage";
import { AboutPage } from "@/pages/public/AboutPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { MyShipmentsPage } from "@/pages/dashboard/MyShipmentsPage";
import { CreateShipmentPage } from "@/pages/dashboard/CreateShipmentPage";
import { ShipmentDetailPage } from "@/pages/dashboard/ShipmentDetailPage";
import { DashboardTrackingPage } from "@/pages/dashboard/DashboardTrackingPage";
import { PaymentsPage } from "@/pages/dashboard/PaymentsPage";
import { DocumentsPage } from "@/pages/dashboard/DocumentsPage";
import { ProfilePage } from "@/pages/dashboard/ProfilePage";
import { SupportPage } from "@/pages/dashboard/SupportPage";
import { TransitaireDashboardPage } from "@/pages/transitaire/TransitaireDashboardPage";
import { TransitaireShipmentsPage } from "@/pages/transitaire/TransitaireShipmentsPage";
import { TransitaireClientsPage } from "@/pages/transitaire/TransitaireClientsPage";
import { TransitairePaymentsPage } from "@/pages/transitaire/TransitairePaymentsPage";
import { TransitaireRatesPage } from "@/pages/transitaire/TransitaireRatesPage";
import { TransitaireMonitoringPage } from "@/pages/transitaire/TransitaireMonitoringPage";
import { TransitaireReportsPage } from "@/pages/transitaire/TransitaireReportsPage";
import { TransitaireDocumentsPage } from "@/pages/transitaire/TransitaireDocumentsPage";
import { TransitaireTeamPage } from "@/pages/transitaire/TransitaireTeamPage";
import { TransitaireSupportPage } from "@/pages/transitaire/TransitaireSupportPage";
import { TransitaireNewShipmentPage } from "@/pages/transitaire/TransitaireNewShipmentPage";
import { TransitaireHistoryPage } from "@/pages/transitaire/TransitaireHistoryPage";
import { TransitaireAgendaPage } from "@/pages/transitaire/TransitaireAgendaPage";
import { TransitaireContactsPage } from "@/pages/transitaire/TransitaireContactsPage";
import { TransitaireCommissionsPage } from "@/pages/transitaire/TransitaireCommissionsPage";
import { TransitaireTresoreriePage } from "@/pages/transitaire/TransitaireTresoreriePage";
import { TransitaireExportPage } from "@/pages/transitaire/TransitaireExportPage";
import { TransitaireNotificationsPage } from "@/pages/transitaire/TransitaireNotificationsPage";
import { TransitaireJournalPage } from "@/pages/transitaire/TransitaireJournalPage";
import { TransitaireSettingsPage } from "@/pages/transitaire/TransitaireSettingsPage";
import { TransitaireModulesPage } from "@/pages/transitaire/TransitaireModulesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="catalogue" element={<CatalogPage />} />
        <Route path="produit/:id" element={<ProductDetailPage />} />
        <Route path="panier" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="tarifs" element={<PricingPage />} />
        <Route path="suivi" element={<TrackingPage />} />
        <Route path="a-propos" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      /* Espace transitaire : réservé au rôle TRANSITAIRE (gardiens de rôle dédiés) */
      <Route element={<TransitaireRoute />}>
        <Route element={<TransitaireLayout />}>
          <Route path="espace-transitaire" element={<TransitaireDashboardPage />} />
          <Route path="espace-transitaire/monitoring" element={<TransitaireMonitoringPage />} />
          <Route path="espace-transitaire/agenda" element={<TransitaireAgendaPage />} />
          <Route path="espace-transitaire/journal" element={<TransitaireJournalPage />} />
          <Route path="espace-transitaire/notifications" element={<TransitaireNotificationsPage />} />
          <Route path="espace-transitaire/new-shipment" element={<TransitaireNewShipmentPage />} />
          <Route path="espace-transitaire/shipments" element={<TransitaireShipmentsPage />} />
          <Route path="espace-transitaire/history" element={<TransitaireHistoryPage />} />
          <Route path="espace-transitaire/reports" element={<TransitaireReportsPage />} />
          <Route path="espace-transitaire/export" element={<TransitaireExportPage />} />
          <Route path="espace-transitaire/clients" element={<TransitaireClientsPage />} />
          <Route path="espace-transitaire/contacts" element={<TransitaireContactsPage />} />
          <Route path="espace-transitaire/payments" element={<TransitairePaymentsPage />} />
          <Route path="espace-transitaire/commissions" element={<TransitaireCommissionsPage />} />
          <Route path="espace-transitaire/tresorerie" element={<TransitaireTresoreriePage />} />
          <Route path="espace-transitaire/documents" element={<TransitaireDocumentsPage />} />
          <Route path="espace-transitaire/team" element={<TransitaireTeamPage />} />
          <Route path="espace-transitaire/settings" element={<TransitaireSettingsPage />} />
          <Route path="espace-transitaire/modules" element={<TransitaireModulesPage />} />
          <Route path="espace-transitaire/support" element={<TransitaireSupportPage />} />
          <Route path="espace-transitaire/tarifs" element={<TransitaireRatesPage />} />
          <Route path="espace-transitaire/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/shipments" element={<MyShipmentsPage />} />
          <Route path="dashboard/shipments/create" element={<CreateShipmentPage />} />
          <Route path="dashboard/shipments/:id" element={<ShipmentDetailPage />} />
          <Route path="dashboard/tracking" element={<DashboardTrackingPage />} />
          <Route path="dashboard/payments" element={<PaymentsPage />} />
          <Route path="dashboard/documents" element={<DocumentsPage />} />
          <Route path="dashboard/profile" element={<ProfilePage />} />
          <Route path="dashboard/support" element={<SupportPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
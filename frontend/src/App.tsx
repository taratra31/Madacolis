import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Shipments from "./pages/Shipments";
import Payments from "./pages/Payments";
import Pricing from "./pages/Pricing";
import Audits from "./pages/Audits";
import Layout from "./components/Layout";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, user, refresh } = useAuth();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <div className="flex h-screen items-center justify-center">Chargement…</div>;
  if (user.role !== "ADMIN" && user.role !== "AGENT") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="payments" element={<Payments />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="audits" element={<Audits />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
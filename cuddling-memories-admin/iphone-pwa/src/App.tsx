import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./providers/AuthProvider";
import AppShell from "./components/AppShell";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Bookings from "./screens/Bookings";
import BookingDetail from "./screens/BookingDetail";
import Install from "./screens/Install";
import More from "./screens/More";
import Calendar from "./screens/Calendar";
import Notifications from "./screens/Notifications";
import ModuleList from "./screens/ModuleList";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin } = useAuth();
  if (loading) return <div className="p-6 text-sm text-coffee/60">Laden...</div>;
  if (!session || !isAdmin) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/install" element={<Install />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
      <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
      <Route path="/bookings/:id" element={<PrivateRoute><BookingDetail /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/more" element={<PrivateRoute><More /></PrivateRoute>} />
      <Route path="/availability" element={<PrivateRoute><ModuleList moduleId="availability" /></PrivateRoute>} />
      <Route path="/month-planning" element={<PrivateRoute><ModuleList moduleId="month-planning" /></PrivateRoute>} />
      <Route path="/packages" element={<PrivateRoute><ModuleList moduleId="packages" /></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><ModuleList moduleId="clients" /></PrivateRoute>} />
      <Route path="/waitlist" element={<PrivateRoute><ModuleList moduleId="waitlist" /></PrivateRoute>} />
      <Route path="/mini-sessions" element={<PrivateRoute><ModuleList moduleId="mini-sessions" /></PrivateRoute>} />
      <Route path="/giftcards" element={<PrivateRoute><ModuleList moduleId="giftcards" /></PrivateRoute>} />
      <Route path="/galleries" element={<PrivateRoute><ModuleList moduleId="galleries" /></PrivateRoute>} />
      <Route path="/portfolio-photos" element={<PrivateRoute><ModuleList moduleId="portfolio-photos" /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><ModuleList moduleId="settings" /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

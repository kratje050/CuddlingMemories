import { Navigate, Route, Routes } from "react-router-dom";
import AdminAuthProvider from "./components/AdminAuthProvider.jsx";
import RequireAdmin from "./utils/adminGuard.js";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminBookings from "./pages/AdminBookings.jsx";
import AdminBookingDetail from "./pages/AdminBookingDetail.jsx";
import AdminBookingNew from "./pages/AdminBookingNew.jsx";
import AdminAvailability from "./pages/AdminAvailability.jsx";
import AdminBlockedPeriods from "./pages/AdminBlockedPeriods.jsx";
import AdminManualSlots from "./pages/AdminManualSlots.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import AdminPages from "./pages/AdminPages.jsx";
import AdminAlbums from "./pages/AdminAlbums.jsx";
import AdminPortfolio from "./pages/AdminPortfolio.jsx";
import AdminPackages from "./pages/AdminPackages.jsx";
import AdminReviews from "./pages/AdminReviews.jsx";
import AdminFaq from "./pages/AdminFaq.jsx";
import AdminModelGezocht from "./pages/AdminModelGezocht.jsx";
import AdminSeo from "./pages/AdminSeo.jsx";

export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          path="dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="bookings"
          element={
            <RequireAdmin>
              <AdminBookings />
            </RequireAdmin>
          }
        />
        <Route
          path="bookings/nieuw"
          element={
            <RequireAdmin>
              <AdminBookingNew />
            </RequireAdmin>
          }
        />
        <Route
          path="bookings/:id"
          element={
            <RequireAdmin>
              <AdminBookingDetail />
            </RequireAdmin>
          }
        />
        <Route
          path="beschikbaarheid"
          element={
            <RequireAdmin>
              <AdminAvailability />
            </RequireAdmin>
          }
        />
        <Route
          path="geblokkeerde-dagen"
          element={
            <RequireAdmin>
              <AdminBlockedPeriods />
            </RequireAdmin>
          }
        />
        <Route
          path="tijdslots"
          element={
            <RequireAdmin>
              <AdminManualSlots />
            </RequireAdmin>
          }
        />
        <Route
          path="settings"
          element={
            <RequireAdmin>
              <AdminSettings />
            </RequireAdmin>
          }
        />
        <Route
          path="pages"
          element={
            <RequireAdmin>
              <AdminPages />
            </RequireAdmin>
          }
        />
        <Route
          path="albums"
          element={
            <RequireAdmin>
              <AdminAlbums />
            </RequireAdmin>
          }
        />
        <Route
          path="portfolio"
          element={
            <RequireAdmin>
              <AdminPortfolio />
            </RequireAdmin>
          }
        />
        <Route
          path="packages"
          element={
            <RequireAdmin>
              <AdminPackages />
            </RequireAdmin>
          }
        />
        <Route
          path="reviews"
          element={
            <RequireAdmin>
              <AdminReviews />
            </RequireAdmin>
          }
        />
        <Route
          path="faq"
          element={
            <RequireAdmin>
              <AdminFaq />
            </RequireAdmin>
          }
        />
        <Route
          path="model-gezocht"
          element={
            <RequireAdmin>
              <AdminModelGezocht />
            </RequireAdmin>
          }
        />
        <Route
          path="seo"
          element={
            <RequireAdmin>
              <AdminSeo />
            </RequireAdmin>
          }
        />
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}

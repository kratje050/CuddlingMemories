import { Navigate, Route, Routes } from "react-router-dom";
import AdminAuthProvider from "./components/AdminAuthProvider.jsx";
import RequireAdmin from "./utils/adminGuard.js";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminBookings from "./pages/AdminBookings.jsx";
import AdminPayments from "./pages/AdminPayments.jsx";
import AdminBookingDetail from "./pages/AdminBookingDetail.jsx";
import AdminBookingNew from "./pages/AdminBookingNew.jsx";
import AdminCustomers from "./pages/AdminCustomers.jsx";
import AdminAvailability from "./pages/AdminAvailability.jsx";
import AdminBlockedPeriods from "./pages/AdminBlockedPeriods.jsx";
import AdminManualSlots from "./pages/AdminManualSlots.jsx";
import AdminMonthPlanning from "./pages/AdminMonthPlanning.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import AdminPages from "./pages/AdminPages.jsx";
import AdminAlbums from "./pages/AdminAlbums.jsx";
import AdminPortfolio from "./pages/AdminPortfolio.jsx";
import AdminPackages from "./pages/AdminPackages.jsx";
import AdminReviews from "./pages/AdminReviews.jsx";
import AdminFaq from "./pages/AdminFaq.jsx";
import AdminModelGezocht from "./pages/AdminModelGezocht.jsx";
import AdminSeo from "./pages/AdminSeo.jsx";
import AdminGalleries from "./pages/AdminGalleries.jsx";
import AdminGalleryDetail from "./pages/AdminGalleryDetail.jsx";
import AdminGalleryPhotos from "./pages/AdminGalleryPhotos.jsx";
import AdminEmailTemplates from "./pages/AdminEmailTemplates.jsx";
import AdminEmailControl from "./pages/AdminEmailControl.jsx";
import AdminWaitlist from "./pages/AdminWaitlist.jsx";
import AdminGiftcards from "./pages/AdminGiftcards.jsx";
import AdminMiniSessions from "./pages/AdminMiniSessions.jsx";
import AdminMiniSessionDetail from "./pages/AdminMiniSessionDetail.jsx";

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
          path="betalingen"
          element={
            <RequireAdmin>
              <AdminPayments />
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
          path="klantgegevens"
          element={
            <RequireAdmin>
              <AdminCustomers />
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
          path="maandplanning"
          element={
            <RequireAdmin>
              <AdminMonthPlanning />
            </RequireAdmin>
          }
        />
        <Route
          path="galleries"
          element={
            <RequireAdmin>
              <AdminGalleries />
            </RequireAdmin>
          }
        />
        <Route
          path="galleries/new"
          element={
            <RequireAdmin>
              <AdminGalleryDetail />
            </RequireAdmin>
          }
        />
        <Route
          path="galleries/:id"
          element={
            <RequireAdmin>
              <AdminGalleryDetail />
            </RequireAdmin>
          }
        />
        <Route
          path="galleries/:id/photos"
          element={
            <RequireAdmin>
              <AdminGalleryPhotos />
            </RequireAdmin>
          }
        />
        <Route
          path="email-templates"
          element={
            <RequireAdmin>
              <AdminEmailTemplates />
            </RequireAdmin>
          }
        />
        <Route
          path="email-control"
          element={
            <RequireAdmin>
              <AdminEmailControl />
            </RequireAdmin>
          }
        />
        <Route
          path="waitlist"
          element={
            <RequireAdmin>
              <AdminWaitlist />
            </RequireAdmin>
          }
        />
        <Route
          path="giftcards"
          element={
            <RequireAdmin>
              <AdminGiftcards />
            </RequireAdmin>
          }
        />
        <Route
          path="mini-shoots"
          element={
            <RequireAdmin>
              <AdminMiniSessions />
            </RequireAdmin>
          }
        />
        <Route
          path="mini-shoots/new"
          element={
            <RequireAdmin>
              <AdminMiniSessionDetail />
            </RequireAdmin>
          }
        />
        <Route
          path="mini-shoots/:id"
          element={
            <RequireAdmin>
              <AdminMiniSessionDetail />
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

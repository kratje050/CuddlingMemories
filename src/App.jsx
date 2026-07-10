import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Packages from "./pages/Packages.jsx";
import About from "./pages/About.jsx";
import Process from "./pages/Process.jsx";
import ModelCall from "./pages/ModelCall.jsx";
import Contact from "./pages/Contact.jsx";
import Booking from "./pages/Booking.jsx";
import Thanks from "./pages/Thanks.jsx";
import Privacy from "./pages/Privacy.jsx";
import GiftCard from "./pages/GiftCard.jsx";
import Faq from "./pages/Faq.jsx";
import MiniSessions from "./pages/MiniSessions.jsx";
import MiniSessionDetail from "./pages/MiniSessionDetail.jsx";
import GalleryAccess from "./pages/GalleryAccess.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminRoutes from "./admin/AdminRoutes.jsx";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";
import AlbumDetail from "./pages/AlbumDetail.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

function PublicSite() {
  return (
    <SiteSettingsProvider>
      <div className="min-h-screen bg-cream text-coffee">
        <Navbar />
        <ScrollToTop />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:slug" element={<AlbumDetail />} />
            <Route path="/pakketten" element={<Packages />} />
            <Route path="/over-demy" element={<About />} />
            <Route path="/werkwijze" element={<Process />} />
            <Route path="/model-gezocht" element={<ModelCall />} />
            <Route path="/boek-een-shoot" element={<Booking />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cadeaubon" element={<GiftCard />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/mini-shoots" element={<MiniSessions />} />
            <Route path="/mini-shoots/:slug" element={<MiniSessionDetail />} />
            <Route path="/galerij/:secureToken" element={<GalleryAccess />} />
            <Route path="/bedankt" element={<Thanks />} />
            <Route path="/privacybeleid" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </SiteSettingsProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/*" element={<PublicSite />} />
    </Routes>
  );
}

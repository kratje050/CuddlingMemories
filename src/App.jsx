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
import Thanks from "./pages/Thanks.jsx";
import NotFound from "./pages/NotFound.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="min-h-screen bg-cream text-coffee">
      <Navbar />
      <ScrollToTop />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/pakketten" element={<Packages />} />
          <Route path="/over-demy" element={<About />} />
          <Route path="/werkwijze" element={<Process />} />
          <Route path="/model-gezocht" element={<ModelCall />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/bedankt" element={<Thanks />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Search from "./pages/Search";
import PGDetail from "./pages/PGDetail";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/pg/:id" element={<PGDetail />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
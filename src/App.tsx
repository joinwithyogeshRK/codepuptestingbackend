import "./App.css";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
// import Hackathon from "./pages/Hackathon";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import HackathonShowcase from "./components/HackathonShowcase";
import ProjectGallery from "./components/ProjectGallery";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chatPage" element={<ChatPage />} />
          {/* <Route path="/hackathon" element={<Hackathon />} /> */}

          <Route path="/hackathon" element={<HackathonShowcase />} />
          <Route path="/gallery" element={<ProjectGallery />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

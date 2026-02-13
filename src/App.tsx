import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HomeV2 from './pages/Home-v2';
import HomeV3 from './pages/Home-v3';
import EventDetailPage from './pages/event-detail';
import ComponentsStylePage from './pages/components-style';
import AgentChatPage from './pages/agent-chat';
import CuviaLinkPage from './pages/cuvia-link';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/v2" element={<HomeV2 />} />
      <Route path="/v3" element={<HomeV3 />} />
      <Route path="/event/:eventId" element={<EventDetailPage />} />
      <Route path="/components-style" element={<ComponentsStylePage />} />
      <Route path="/agent-chat" element={<AgentChatPage />} />
      <Route path="/cuvia-link" element={<CuviaLinkPage />} />
    </Routes>
  );
}

export default App;

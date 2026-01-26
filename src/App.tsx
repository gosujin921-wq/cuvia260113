import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HomeV2 from './pages/Home-v2';
import EventDetailPage from './pages/event-detail';
import ComponentsStylePage from './pages/components-style';
import AgentChatPage from './pages/agent-chat';
import AgentHubPage from './pages/agent-hub';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/v2" element={<HomeV2 />} />
      <Route path="/event/:eventId" element={<EventDetailPage />} />
      <Route path="/components-style" element={<ComponentsStylePage />} />
      <Route path="/agent-chat" element={<AgentChatPage />} />
      <Route path="/agent-hub" element={<AgentHubPage />} />
    </Routes>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EventDetailPage from './pages/event-detail';
import ComponentsStylePage from './pages/components-style';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/event/:eventId" element={<EventDetailPage />} />
      <Route path="/components-style" element={<ComponentsStylePage />} />
    </Routes>
  );
}

export default App;

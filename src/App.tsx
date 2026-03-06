import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import HomeV2 from "./pages/Home-v2";
import HomeV3 from "./pages/Home-v3";
import HomeV4 from "./pages/Home-v4";
import HomeAgent from "./pages/Home-agent";
import HomeWithLink from "./pages/Home-with-link";
import ComponentsStylePage from "./pages/components-style";
import AgentChatPage from "./pages/agent-chat";
import CuviaLinkPage from "./pages/cuvia-link";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/tutorial" replace />} />
            <Route path="/live" element={<Home />} />
            <Route path="/tutorial" element={<HomeV2 />} />
            <Route path="/v3" element={<HomeV3 />} />
            <Route path="/v4" element={<HomeV4 />} />
            <Route path="/agent" element={<HomeAgent />} />
            <Route path="/link" element={<HomeWithLink />} />
            <Route path="/components-style" element={<ComponentsStylePage />} />
            <Route path="/agent-chat" element={<AgentChatPage />} />
            <Route path="/workspace" element={<CuviaLinkPage />} />
        </Routes>
    );
}

export default App;

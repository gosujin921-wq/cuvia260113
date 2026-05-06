import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import HomeV2 from "./pages/Home-v2";
import HomeSk from "./pages/Home-sk";
import HomeV3 from "./pages/Home-v3";
import HomeV4 from "./pages/Home-v4";
import HomeAgent from "./pages/Home-agent";
import HomeWithLink from "./pages/Home-with-link";
import ComponentsStylePage from "./pages/components-style";
import AgentChatPage from "./pages/agent-chat";
import CuviaLinkPage from "./pages/cuvia-link";
import BackwallPage from "./pages/backwall";
import Backwall2Page from "./pages/backwall2";
import Backwall3Page from "./pages/backwall3";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/tutorial" replace />} />
            <Route path="/live" element={<Home />} />
            <Route path="/tutorial" element={<HomeV2 />} />
            <Route path="/sk" element={<HomeSk />} />
            <Route path="/demo-v2" element={<HomeV3 />} />
            <Route path="/demo-v1" element={<HomeV4 />} />
            <Route path="/agent" element={<HomeAgent />} />
            <Route path="/link" element={<HomeWithLink trafficLayerMode="wmts" />} />
            <Route path="/link-v2" element={<HomeWithLink trafficLayerMode="wms" />} />
            <Route path="/components-style" element={<ComponentsStylePage />} />
            <Route path="/agent-chat" element={<AgentChatPage />} />
            <Route path="/workspace" element={<CuviaLinkPage />} />
            <Route path="/backwall" element={<BackwallPage />} />
            <Route path="/backwall2" element={<Backwall2Page />} />
            <Route path="/backwall3" element={<Backwall3Page />} />
        </Routes>
    );
}

export default App;

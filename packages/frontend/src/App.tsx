import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MagicMode } from './pages/MagicMode';
import { GuidedMode } from './pages/GuidedMode';
import { ProMode } from './pages/ProMode';
import { ProjectView } from './pages/ProjectView';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<MagicMode />} />
        <Route path="/guided" element={<GuidedMode />} />
        <Route path="/pro" element={<ProMode />} />
        <Route path="/project/:id" element={<ProjectView />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import MatchDetail from './pages/MatchDetail';
import Join from './pages/Join';
import ProtectedRoute from './components/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<Join />} />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <Groups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute>
            <GroupDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId/matches/:matchId"
        element={
          <ProtectedRoute>
            <MatchDetail />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<div className="p-6">페이지를 찾을 수 없어요.</div>} />
    </Routes>
  );
}

import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import MatchDetail from './pages/MatchDetail';
import Join from './pages/Join';
import MatchInvite from './pages/MatchInvite';
import KakaoCallback from './pages/KakaoCallback';
import Admin from './pages/Admin';
import AdminFeedback from './pages/AdminFeedback';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<Join />} />
      <Route path="/match-invite" element={<MatchInvite />} />
      <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
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
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <AdminRoute>
            <AdminFeedback />
          </AdminRoute>
        }
      />
      <Route path="*" element={<div className="p-6">페이지를 찾을 수 없어요.</div>} />
    </Routes>
  );
}

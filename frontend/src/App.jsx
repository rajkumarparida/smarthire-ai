import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login    from './pages/Login';
import Register from './pages/Register';

// Placeholder dashboards (we'll build these next)
const RecruiterDashboard = () => <h2 style={{textAlign:'center', marginTop:80}}>Recruiter Dashboard 🚀</h2>;
const CandidateDashboard = () => <h2 style={{textAlign:'center', marginTop:80}}>Candidate Dashboard 🎯</h2>;

// Protected route
const Protected = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/"         element={<Navigate to={user ? (user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard') : '/login'} />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recruiter/dashboard" element={<Protected role="recruiter"><RecruiterDashboard /></Protected>} />
      <Route path="/candidate/dashboard" element={<Protected role="candidate"><CandidateDashboard /></Protected>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
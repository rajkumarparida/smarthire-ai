import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login              from './pages/Login';
import Register           from './pages/Register';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PostJob            from './pages/recruiter/PostJob';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import JobList            from './pages/candidate/JobList';
import TakeExam  from './pages/candidate/TakeExam';
import Applicants from './pages/recruiter/Applicants';
import ApplicationDetail from './pages/candidate/ApplicationDetail';
import Navbar from './components/Navbar';

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

      <Route path="*" element={
  <div style={{ textAlign:'center', marginTop: 100 }}>
    <p style={{ fontSize: 64 }}>🤖</p>
    <h2>Page Not Found</h2>
    <button onClick={() => window.history.back()}
      style={{ padding:'10px 24px', background:'#4f46e5', color:'#fff',
               border:'none', borderRadius:8, cursor:'pointer', fontSize:15 }}>
      Go Back
    </button>
  </div>
} />

      <Route path="/" element={
        <Navigate to={user
          ? (user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')
          : '/login'}
        />}
      />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Recruiter */}
      <Route path="/recruiter/dashboard" element={<Protected role="recruiter"><RecruiterDashboard /></Protected>} />
      <Route path="/recruiter/post-job"  element={<Protected role="recruiter"><PostJob /></Protected>} />

      {/* Candidate */}
      <Route path="/candidate/dashboard" element={<Protected role="candidate"><CandidateDashboard /></Protected>} />
      <Route path="/candidate/jobs"      element={<Protected role="candidate"><JobList /></Protected>} />

      <Route path="/exam/:jobId"                  element={<Protected role="candidate"><TakeExam /></Protected>} />
      <Route path="/recruiter/applicants/:jobId"  element={<Protected role="recruiter"><Applicants /></Protected>} />

      <Route path="/candidate/application/:appId" element={<Protected role="candidate"><ApplicationDetail /></Protected>} />

    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
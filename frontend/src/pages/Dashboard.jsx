import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <h1>🧠 NeuroChat</h1>
        </div>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome to NeuroChat, {user?.name}!</h2>
          <p className="welcome-tagline">Your Intelligent Conversation Partner</p>
          <div className="welcome-info">
            <p>🎉 You are successfully authenticated.</p>
            <p>💬 Chat functionality will be available in the next phase.</p>
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>NeuroChat &copy; 2026 — BCA 5th Semester Field Project</p>
      </footer>
    </div>
  );
};

export default Dashboard;

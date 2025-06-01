import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const [myPolls, setMyPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState([]);
  const [favoritePolls, setFavoritePolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [myRes, votedRes, favRes] = await Promise.all([
          axios.get("/api/polls/my"),
          axios.get("/api/polls/voted"),
          axios.get("/api/polls/favorites"),
        ]);
        setMyPolls(myRes.data.polls || []);
        setVotedPolls(votedRes.data.votedPolls?.map((v) => v.poll) || []);
        setFavoritePolls(favRes.data.favoritePolls || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handlePrivatePollClick = async (poll) => {
    if (poll.isPublic) {
      navigate(`/poll/${poll._id}`);
      return;
    }
    // Instead of prompt, just navigate to the poll invite page, which will show the password UI
    navigate(`/poll/invite/${poll.inviteToken}`);
  };

  if (loading)
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="spinner"></div>Loading...
        </div>
      </div>
    );

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="page-header">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Manage your polls and view your activity</p>
        </div>

        <div className="dashboard-grid">
          {/* Created Polls Stat Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>My Polls</h3>
              <i className="fas fa-poll"></i>
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-stat">
                <span className="stat-number">{myPolls.length}</span>
                <span className="stat-label">Created</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => setShowList("created")}
              >
                View List
              </button>
            </div>
          </div>

          {/* Voted Polls Stat Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>Voted Polls</h3>
              <i className="fas fa-vote-yea"></i>
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-stat">
                <span className="stat-number">{votedPolls.length}</span>
                <span className="stat-label">Participated</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => setShowList("voted")}
              >
                View List
              </button>
            </div>
          </div>

          {/* Favorite Polls Stat Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>Favorites</h3>
              <i className="fas fa-heart"></i>
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-stat">
                <span className="stat-number">{favoritePolls.length}</span>
                <span className="stat-label">Favourites</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => setShowList("favorites")}
              >
                View List
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/create")}
            >
              <i className="fas fa-plus"></i>
              Create New Poll
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/polls")}
            >
              <i className="fas fa-eye"></i>
              Browse Public Polls
            </button>
          </div>
        </div>

        {/* List Modal/Section */}
        {showList && (
          <div
            className="dashboard-list-modal"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.35)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                background: "var(--modal-bg, #fff)",
                color: "var(--modal-fg, #222)",
                borderRadius: 12,
                padding: 28,
                minWidth: 320,
                maxWidth: 420,
                boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                position: "relative",
                border: "1px solid var(--modal-border, #eee)",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <button
                style={{
                  position: "absolute",
                  top: 8,
                  right: 12,
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
                onClick={() => setShowList(null)}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
              <h3 style={{ marginBottom: 16 }}>
                {showList === "created" && "My Created Polls"}
                {showList === "voted" && "Participated Polls"}
                {showList === "favorites" && "Favourite Polls"}
              </h3>
              <ul
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  padding: 0,
                  listStyle: "none",
                }}
              >
                {(showList === "created"
                  ? myPolls
                  : showList === "voted"
                  ? votedPolls
                  : favoritePolls
                ).length === 0 ? (
                  <li style={{ color: "#888" }}>No polls found.</li>
                ) : (
                  (showList === "created"
                    ? myPolls
                    : showList === "voted"
                    ? votedPolls
                    : favoritePolls
                  ).map((poll) => {
                    // Defensive: handle null/undefined poll
                    if (!poll) return null;
                    return (
                      <li
                        key={poll._id}
                        style={{
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Link
                            to="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePrivatePollClick(poll);
                            }}
                          >
                            {poll.title}
                          </Link>
                          {poll.pollType && (
                            <span
                              style={{
                                marginLeft: 8,
                                padding: "2px 6px",
                                fontSize: 11,
                                backgroundColor:
                                  poll.pollType === "business"
                                    ? "#e3f2fd"
                                    : "#f3e5f5",
                                color:
                                  poll.pollType === "business"
                                    ? "#1976d2"
                                    : "#7b1fa2",
                                borderRadius: 4,
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              {poll.pollType}
                            </span>
                          )}
                          {poll.isPublic === false && (
                            <i
                              className="fas fa-lock"
                              title="Private Poll"
                              style={{
                                marginLeft: 8,
                                color: "#888",
                                fontSize: 15,
                              }}
                            ></i>
                          )}
                        </div>
                        {showList === "created" && (
                          <>
                            <button
                              className="btn btn-danger btn-xs"
                              style={{ marginLeft: 12 }}
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this poll? This action cannot be undone."
                                  )
                                ) {
                                  try {
                                    await axios.delete(
                                      `/api/polls/${poll._id}`
                                    );
                                    setMyPolls((prev) =>
                                      prev.filter((p) => p._id !== poll._id)
                                    );
                                  } catch (err) {
                                    alert("Failed to delete poll.");
                                  }
                                }
                              }}
                              title="Delete Poll"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

// Add to your CSS (components.css or globals.css):
// :root {
//   --modal-bg: #fff;
//   --modal-fg: #222;
//   --modal-border: #eee;
// }
// [data-theme="dark"] {
//   --modal-bg: #23272f;
//   --modal-fg: #f3f3f3;
//   --modal-border: #333a44;
// }

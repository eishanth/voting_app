import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const PublicPolls = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [favoritePolls, setFavoritePolls] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPolls();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      axios.get("/api/polls/favorites").then((res) => {
        setFavoritePolls(res.data.favoritePolls || []);
      });
    }
  }, [user]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/polls/public?page=${currentPage}&limit=12`
      );
      setPolls(response.data.polls);
      setPagination(response.data.pagination);
    } catch (error) {
      setError("Failed to load polls");
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (pollId) => {
    try {
      const res = await axios.post(`/api/polls/${pollId}/favorite`);
      setFavoritePolls((prev) => {
        if (res.data.isFavorite) {
          // Add to favorites
          const poll = polls.find((p) => p._id === pollId);
          return poll ? [...prev, poll] : prev;
        } else {
          // Remove from favorites
          return prev.filter((p) => p._id !== pollId);
        }
      });
    } catch (err) {
      // handle error
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filtered polls based on search
  const filteredPolls = polls.filter((poll) =>
    poll.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="public-polls-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading polls...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-polls-page">
      <div className="container">
        <div className="page-header">
          <h1>Browse Public Polls</h1>
          <p>Discover and participate in polls created by the community</p>
          <input
            type="text"
            className="form-input"
            placeholder="Search polls by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginTop: 16, maxWidth: 320 }}
          />
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {filteredPolls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-poll"></i>
            </div>
            <h3>No Public Polls Yet</h3>
            <p>Be the first to create a public poll for everyone to see!</p>
            <Link to="/create" className="btn btn-primary">
              <i className="fas fa-plus"></i>
              Create First Poll
            </Link>
          </div>
        ) : (
          <>
            <div className="polls-grid">
              {filteredPolls.map((poll) => {
                const isFavorite = favoritePolls.some(
                  (f) => f._id === poll._id
                );
                return (
                  <div
                    key={poll._id}
                    className="poll-card-item"
                    style={{ position: "relative" }}
                  >
                    <div className="poll-card-header">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <h3>{poll.title}</h3>
                        {poll.pollType && (
                          <span
                            style={{
                              padding: "4px 8px",
                              fontSize: 12,
                              backgroundColor:
                                poll.pollType === "business"
                                  ? "#e3f2fd"
                                  : "#f3e5f5",
                              color:
                                poll.pollType === "business"
                                  ? "#1976d2"
                                  : "#7b1fa2",
                              borderRadius: 6,
                              textTransform: "uppercase",
                              fontWeight: 600,
                              letterSpacing: "0.5px",
                            }}
                          >
                            {poll.pollType}
                          </span>
                        )}
                      </div>
                      {poll.description && (
                        <p className="poll-description">{poll.description}</p>
                      )}
                    </div>

                    <div className="poll-card-body">
                      <div className="poll-meta">
                        <div className="poll-creator">
                          <i className="fas fa-user"></i>
                          <span>{poll.creator?.name || "Anonymous"}</span>
                        </div>
                        <div className="poll-date">
                          <i className="fas fa-calendar"></i>
                          <span>{formatDate(poll.createdAt)}</span>
                        </div>
                      </div>

                      <div className="poll-stats">
                        <div className="stat">
                          <i className="fas fa-chart-bar"></i>
                          <span>{poll.totalResponses} responses</span>
                        </div>
                        <div className="stat">
                          <i className="fas fa-question-circle"></i>
                          <span>{poll.questions?.length || 0} questions</span>
                        </div>
                      </div>
                    </div>

                    <div className="poll-card-footer">
                      <Link
                        to={`/poll/${poll._id}`}
                        className="btn btn-primary btn-sm btn-full"
                      >
                        <i className="fas fa-vote-yea"></i>
                        View & Vote
                      </Link>
                    </div>
                    {user && (
                      <button
                        className="favorite-fab"
                        onClick={() => handleToggleFavorite(poll._id)}
                        title={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        style={{
                          position: "absolute",
                          right: 16,
                          bottom: 16,
                          background: "#fff",
                          borderRadius: "50%",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          padding: 8,
                          zIndex: 2,
                          border: "none",
                          outline: "none",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className={`fas fa-heart${isFavorite ? "" : "-o"}`}
                          style={{
                            color: isFavorite ? "#e74c3c" : "#bbb",
                            fontSize: 24,
                          }}
                        ></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm"
                >
                  <i className="fas fa-chevron-left"></i>
                  Previous
                </button>

                <span className="pagination-info">
                  Page {currentPage} of {pagination.pages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.pages)
                    )
                  }
                  disabled={currentPage === pagination.pages}
                  className="btn btn-outline btn-sm"
                >
                  Next
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublicPolls;

// Add this CSS to your global or components.css for the floating favorite icon
// .favorite-fab {
//   position: absolute;
//   right: 16px;
//   bottom: 16px;
//   background: #fff;
//   border-radius: 50%;
//   box-shadow: 0 2px 8px rgba(0,0,0,0.08);
//   padding: 8px;
//   z-index: 2;
//   border: none;
//   outline: none;
//   cursor: pointer;
//   transition: background 0.2s;
// }
// .favorite-fab:hover {
//   background: #ffeaea;
// }

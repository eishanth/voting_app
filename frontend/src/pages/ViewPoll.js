import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "../styles/ViewPoll.css";

const ViewPoll = () => {
  const { id, token } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [visibleFollowUps, setVisibleFollowUps] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [passwordPrompt, setPasswordPrompt] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pollPassword, setPollPassword] = useState("");
  const [showVoters, setShowVoters] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      fetchPoll();
    }
  // eslint-disable-next-line
  }, [id, token, authLoading]);

  const fetchPoll = async (password) => {
    try {
      setLoading(true);
      let response;
      if (token) {
        response = await axios.post(`/api/polls/invite/${token}/verify`, {
          password,
        });
      } else {
        response = await axios.get(`/api/polls/${id}`);
      }
      setPoll(response.data.poll);
      setHasVoted(response.data.hasVoted || false);

      // Initialize answers
      const initialAnswers = {};
      response.data.poll.questions.forEach((question) => {
        initialAnswers[question._id] = null;
      });
      setAnswers(initialAnswers);
      setShowPasswordInput(false);
      setPasswordPrompt("");
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setShowPasswordInput(true);
        setPasswordPrompt("Enter the poll password to view this private poll.");
      } else {
        setError(error.response?.data?.message || "Failed to load poll");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    await fetchPoll(pollPassword);
  };

  // --- Update: handleAnswerChange to clear unrelated follow-up answers for single-choice ---
  const handleAnswerChange = (questionId, answer, hasFollowUp = false) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // For single-choice, clear all follow-up answers except for the selected option
    setFollowUpAnswers((prev) => {
      const newAnswers = { ...prev };
      if (newAnswers[questionId]) {
        Object.keys(newAnswers[questionId]).forEach((optIdx) => {
          if (parseInt(optIdx) !== answer) {
            delete newAnswers[questionId][optIdx];
          }
        });
      }
      return newAnswers;
    });

    // Show/hide follow-up
    setVisibleFollowUps((prev) => ({
      ...prev,
      [questionId]: hasFollowUp,
    }));
  };

  const handleFollowUpAnswerChange = (questionId, optionIndex, answer) => {
    setFollowUpAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [optionIndex]: answer,
      },
    }));
  };

  const handleSubmitVote = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");

      // Validate answers
      const hasUnansweredRequired = poll.questions.some((question) => {
        const answer = answers[question._id];
        if (!question.required) return false;

        // For single choice
        if (question.type === "single-choice") {
          return answer === null || answer === undefined;
        }
        // For multiple choice
        if (question.type === "multiple-choice") {
          return !Array.isArray(answer) || answer.length === 0;
        }
        return false;
      });

      if (hasUnansweredRequired) {
        setError("Please answer all required questions");
        setSubmitting(false);
        return;
      }

      // --- Fix: handleSubmitVote follow-up validation for single-choice ---
      const hasUnansweredFollowUps = poll.questions.some((question) => {
        const answer = answers[question._id];
        if (answer === null || answer === undefined) return false;
        // For single choice
        if (!Array.isArray(answer)) {
          const option = question.options[answer];
          if (option?.followUp) {
            // Fix: check followUpAnswers[question._id]?.[answer] for the selected option index
            const followUpAnswer =
              followUpAnswers[question._id] &&
              followUpAnswers[question._id][answer];
            return followUpAnswer === undefined || followUpAnswer === null;
          }
        } else {
          // For multiple choice, only require follow-up for selected options with followUp
          return answer.some((optionIndex) => {
            const option = question.options[optionIndex];
            if (option?.followUp) {
              const followUpAnswer =
                followUpAnswers[question._id] &&
                followUpAnswers[question._id][optionIndex];
              return followUpAnswer === undefined || followUpAnswer === null;
            }
            return false;
          });
        }
        return false;
      });

      if (hasUnansweredFollowUps) {
        setError("Please answer all follow-up questions");
        setSubmitting(false);
        return;
      }

      // Transform answers to match backend expectations
      const transformedAnswers = poll.questions
        .map((question) => {
          const answer = answers[question._id];
          if (answer === null || answer === undefined) return null;

          const transformedAnswer = {
            questionId: question._id,
            answer: answer,
            followUpAnswers: [],
          };

          // Handle follow-up answers
          if (Array.isArray(answer)) {
            // Multiple choice
            answer.forEach((optionIndex) => {
              if (followUpAnswers[question._id]?.[optionIndex] !== undefined) {
                transformedAnswer.followUpAnswers.push({
                  optionIndex,
                  answer: followUpAnswers[question._id][optionIndex],
                });
              }
            });
          } else {
            // Single choice
            if (followUpAnswers[question._id]?.[answer] !== undefined) {
              transformedAnswer.followUpAnswers.push({
                optionIndex: answer,
                answer: followUpAnswers[question._id][answer],
              });
            }
          }

          return transformedAnswer;
        })
        .filter(Boolean);

      const response = await axios.post(`/api/polls/${poll._id}/vote`, {
        answers: transformedAnswers,
      });

      setHasVoted(true);
      setPoll(response.data.poll);
      setShowResults(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      setError(
        error.response?.data?.message ||
          "Failed to submit vote. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  // Show invite link if private poll and ?showInvite=1 in query
  const showInvite =
    poll &&
    poll.isPublic === false &&
    poll.inviteToken &&
    new URLSearchParams(location.search).get("showInvite") === "1";

  if (loading) {
    return (
      <div className="view-poll-page">
        <div className="container-sm">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading poll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-poll-page">
        <div className="container-sm">
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordInput) {
    return (
      <div className="view-poll-page">
        <div className="container-sm">
          <div className="alert alert-warning">
            <i className="fas fa-lock"></i>
            {passwordPrompt}
          </div>
          <form
            onSubmit={handlePasswordSubmit}
            style={{ maxWidth: 400, margin: "0 auto" }}
          >
            <input
              type="password"
              className="form-input"
              placeholder="Poll password"
              value={pollPassword}
              onChange={(e) => setPollPassword(e.target.value)}
              required
              style={{ marginBottom: 12 }}
            />
            <button type="submit" className="btn btn-primary btn-full">
              Unlock Poll
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="view-poll-page">
      <div className="container-sm">
        {showInvite && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <i className="fas fa-link"></i>
            Invite link:{" "}
            <a
              href={`${window.location.origin}/poll/invite/${poll.inviteToken}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {window.location.origin}/poll/invite/{poll.inviteToken}
            </a>
          </div>
        )}

        <div className="poll-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <h1>{poll.title}</h1>
            {poll.pollType && (
              <span
                style={{
                  padding: "6px 12px",
                  fontSize: 14,
                  backgroundColor:
                    poll.pollType === "business" ? "#e3f2fd" : "#f3e5f5",
                  color: poll.pollType === "business" ? "#1976d2" : "#7b1fa2",
                  borderRadius: 8,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                {poll.pollType}
              </span>
            )}
          </div>
          {poll.description && <p>{poll.description}</p>}

          <div className="poll-meta">
            <div className="poll-creator">
              <i className="fas fa-user"></i>
              <span>Created by {poll.creator?.name || "Anonymous"}</span>
            </div>
            <div className="poll-stats">
              <span>
                <i className="fas fa-chart-bar"></i> {poll.totalResponses}{" "}
                responses
              </span>
              <span style={{ marginLeft: "16px" }}>
                <i
                  className={`fas fa-${
                    poll.settings?.showUserDetails ? "eye" : "eye-slash"
                  }`}
                ></i>
                {poll.settings?.showUserDetails
                  ? "User details visible to creator"
                  : "User details hidden from creator"}
              </span>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            <i className="fas fa-lock"></i>
            You must be signed in to vote in this poll.
          </div>
        ) : !hasVoted ? (
          <form onSubmit={handleSubmitVote} className="poll-form">
            {poll.questions.map((question, index) => (
              <div key={question._id} className="question-container">
                <h3>Question {index + 1}</h3>
                <p className="question-text">{question.question}</p>

                <div className="options-container">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="option-label">
                      <input
                        type="radio"
                        name={question._id}
                        value={optionIndex}
                        onChange={(e) =>
                          handleAnswerChange(
                            question._id,
                            parseInt(e.target.value),
                            option.followUp !== null
                          )
                        }
                        required={question.required}
                      />
                      <span className="option-text">{option.text}</span>
                    </label>
                  ))}
                </div>

                {/* Render follow-up question if visible */}
                {visibleFollowUps[question._id] &&
                  !Array.isArray(answers[question._id]) &&
                  question.options[answers[question._id]]?.followUp && (
                    <div className="follow-up-container">
                      <div className="follow-up-question">
                        <p className="question-text">
                          {
                            question.options[answers[question._id]].followUp
                              .question
                          }
                        </p>
                        <div className="options-container">
                          {question.options[
                            answers[question._id]
                          ].followUp.options.map(
                            (followUpOption, followUpOptionIndex) => (
                              <label
                                key={followUpOptionIndex}
                                className="option-label"
                              >
                                <input
                                  type="radio"
                                  name={`${question._id}-followup`}
                                  value={followUpOptionIndex}
                                  checked={
                                    followUpAnswers[question._id]?.[
                                      answers[question._id]
                                    ] === followUpOptionIndex
                                  }
                                  onChange={(e) =>
                                    handleFollowUpAnswerChange(
                                      question._id,
                                      answers[question._id],
                                      parseInt(e.target.value)
                                    )
                                  }
                                  required={
                                    question.options[answers[question._id]]
                                      .followUp.required
                                  }
                                />
                                <span className="option-text">
                                  {followUpOption.text}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ))}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-vote-yea"></i>
                  Submit Vote
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="poll-results">
            <div className="results-header">
              <h2>Results</h2>
              <p>Thank you for voting! Here are the current results:</p>
            </div>

            {poll.questions.map((question, index) => (
              <div key={question._id} className="question-results">
                <h3>Question {index + 1}</h3>
                <p className="question-text">{question.question}</p>

                <div className="results-container">
                  {question.options.map((option, optionIndex) => {
                    const percentage = calculatePercentage(
                      option.votes,
                      poll.totalResponses
                    );
                    return (
                      <div key={optionIndex} className="result-option">
                        <div className="result-header">
                          <span className="option-text">{option.text}</span>
                          <span className="result-percentage">
                            {percentage}%
                          </span>
                        </div>
                        <div className="result-bar">
                          <div
                            className="result-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div
                          className={
                            poll.settings?.showUserDetails && user?._id === poll.creator?._id && option.votes > 0
                              ? "result-votes clickable-votes"
                              : "result-votes"
                          }
                          onClick={() => {
                            if (poll.settings?.showUserDetails && user?._id === poll.creator?._id && option.votes > 0) {
                              setShowVoters({ questionId: question._id, optionIndex });
                            }
                          }}
                        >
                          {option.votes} votes
                        </div>
                        {/* Voter modal for poll creator */}
                        {showVoters && showVoters.questionId === question._id && showVoters.optionIndex === optionIndex && poll.settings?.showUserDetails && user?._id === poll.creator?._id && (
                          <div className="voter-modal-overlay" onClick={() => setShowVoters(null)}>
                            <div className="voter-modal" onClick={e => e.stopPropagation()}>
                              <h4>Voters for "{option.text}"</h4>
                              <ul>
                                {poll.responses
                                  .filter(response =>
                                    response.answers.some(ans =>
                                      ans.questionId === question._id &&
                                      (Array.isArray(ans.answer)
                                        ? ans.answer.includes(optionIndex)
                                        : ans.answer === optionIndex)
                                    )
                                  )
                                  .map(response => (
                                    <li key={response._id}>
                                      <i className="fas fa-user"></i> {response.user?.name || 'Anonymous'}
                                    </li>
                                  ))}
                              </ul>
                              <button className="btn btn-secondary" onClick={() => setShowVoters(null)}>Close</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewPoll;

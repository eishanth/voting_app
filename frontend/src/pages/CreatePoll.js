import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreatePoll = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pollType: "personal",
    isPublic: true,
    questions: [
      {
        type: "single-choice",
        question: "",
        options: [
          { text: "", followUp: null },
          { text: "", followUp: null },
        ],
        required: true,
      },
    ],
    settings: {
      showUserDetails: false,
      showResults: "all",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteLink("");

    try {
      // Transform the data to match backend expectations
      const transformedData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        pollType: formData.pollType,
        isPublic: formData.isPublic,
        questions: formData.questions
          .map((question) => ({
            type: question.type,
            question: question.question.trim(),
            required: question.required,
            options: question.options
              .map((option) => ({
                text: option.text.trim(),
                votes: 0,
                voters: [],
                followUp: option.followUp
                  ? {
                      questionText: option.followUp.question.trim(),
                      options: option.followUp.options
                        .map((followUpOption) => ({
                          text: followUpOption.text.trim(),
                          followUp: null,
                        }))
                        .filter((followUpOption) => followUpOption.text !== ""),
                    }
                  : null,
              }))
              .filter((option) => option.text !== ""),
          }))
          .filter(
            (question) =>
              question.question.trim() !== "" &&
              question.options.length >= 2 &&
              question.options.every(
                (option) =>
                  !option.followUp ||
                  (option.followUp.questionText.trim() !== "" &&
                    option.followUp.options.filter(
                      (opt) => opt.text.trim() !== ""
                    ).length >= 2)
              )
          ),
        settings: {
          showResults:
            formData.settings.showResults === "all"
              ? "always"
              : formData.settings.showResults === "poll-creator"
              ? "after-vote"
              : "never",
          showUserDetails: formData.settings.showUserDetails,
          collectEmail: false,
          endDate: null,
        },
        isActive: true,
        totalResponses: 0,
        responses: [],
        password:
          formData.isPublic === false ? formData.pollPassword : undefined,
      };

      // Validate that we have at least one valid question
      if (transformedData.questions.length === 0) {
        setError("Please add at least one question with at least 2 options");
        setLoading(false);
        return;
      }

      // Validate follow-up questions
      const hasInvalidFollowUps = transformedData.questions.some((question) =>
        question.options.some(
          (option) =>
            option.followUp &&
            (option.followUp.questionText.trim() === "" ||
              option.followUp.options.filter((opt) => opt.text.trim() !== "")
                .length < 2)
        )
      );

      if (hasInvalidFollowUps) {
        setError(
          "All follow-up questions must have a question text and at least 2 options"
        );
        setLoading(false);
        return;
      }

      console.log("Submitting poll data:", transformedData); // Debug log

      const response = await axios.post("/api/polls", transformedData);

      // If private poll, show invite link
      if (
        transformedData.isPublic === false &&
        response.data.poll.inviteToken
      ) {
        const baseUrl = window.location.origin;
        setInviteLink(
          `${baseUrl}/poll/invite/${response.data.poll.inviteToken}`
        );
      } else {
        navigate(`/poll/${response.data.poll._id}`);
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      setError(
        error.response?.data?.message ||
          "Failed to create poll. Please check your input and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested settings object
    if (name.startsWith("settings.")) {
      const settingName = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index][field] = value;
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex].text = value;
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push({ text: "", followUp: null });
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[questionIndex].options.length > 2) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      setFormData({
        ...formData,
        questions: updatedQuestions,
      });
    }
  };

  const addFollowUpQuestion = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex].followUp = {
      type: "single-choice",
      question: "",
      options: [
        { text: "", followUp: null },
        { text: "", followUp: null },
      ],
      required: true,
    };
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const removeFollowUpQuestion = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex].followUp = null;
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const handleFollowUpQuestionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex].followUp.question =
      value;
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const handleFollowUpOptionChange = (
    questionIndex,
    optionIndex,
    followUpOptionIndex,
    value
  ) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex].followUp.options[
      followUpOptionIndex
    ].text = value;
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const addFollowUpOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex].followUp.options.push({
      text: "",
      followUp: null,
    });
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
  };

  const removeFollowUpOption = (
    questionIndex,
    optionIndex,
    followUpOptionIndex
  ) => {
    const updatedQuestions = [...formData.questions];
    if (
      updatedQuestions[questionIndex].options[optionIndex].followUp.options
        .length > 2
    ) {
      updatedQuestions[questionIndex].options[
        optionIndex
      ].followUp.options.splice(followUpOptionIndex, 1);
      setFormData({
        ...formData,
        questions: updatedQuestions,
      });
    }
  };

  return (
    <div className="create-poll-page">
      <div className="container-sm">
        <div className="page-header">
          <h1>Create New Poll</h1>
          <p>Build an engaging poll to collect responses from your audience</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {inviteLink && (
          <div className="alert alert-success" style={{ marginTop: 16 }}>
            <i className="fas fa-link"></i>
            Private poll created! Share this invite link with participants:
            <br />
            <a href={inviteLink} target="_blank" rel="noopener noreferrer">
              {inviteLink}
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-poll-form">
          <div className="form-section">
            <h3>Poll Details</h3>

            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Poll Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your poll title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input form-textarea"
                placeholder="Describe your poll (optional)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Poll Type</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label>
                  <input
                    type="radio"
                    name="pollType"
                    value="personal"
                    checked={formData.pollType === "personal"}
                    onChange={handleInputChange}
                  />
                  <b>Personal</b>{" "}
                  <span style={{ color: "#888", fontWeight: 400 }}>
                    For personal use, friends, and family.
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="pollType"
                    value="business"
                    checked={formData.pollType === "business"}
                    onChange={handleInputChange}
                  />
                  <b>Business</b>{" "}
                  <span style={{ color: "#888", fontWeight: 400 }}>
                    For work, teams, and professional use.
                  </span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Poll Visibility</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.isPublic === true}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        isPublic: true,
                      })
                    }
                  />
                  <b>Public</b>{" "}
                  <span style={{ color: "#888", fontWeight: 400 }}>
                    Appears in browse section, anyone can vote
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.isPublic === false}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        isPublic: false,
                      })
                    }
                  />
                  <b>Private</b>{" "}
                  <span style={{ color: "#888", fontWeight: 400 }}>
                    Only invited users can access via invite link
                  </span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="settings.showUserDetails"
                  checked={formData.settings.showUserDetails}
                  onChange={handleInputChange}
                />
                Show user details to poll creator
              </label>
              <small className="form-text">
                When enabled, poll creator can see who voted and their responses
              </small>
            </div>

            <div className="form-group">
              <label>Results Visibility</label>
              <select
                name="settings.showResults"
                value={formData.settings.showResults}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="all">All</option>
                <option value="poll-creator">Poll Creator</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </div>

            <div
              className="form-group"
              style={{
                display: formData.isPublic === false ? "block" : "none",
              }}
            >
              <label htmlFor="pollPassword" className="form-label">
                Private Poll Password
              </label>
              <input
                type="password"
                id="pollPassword"
                name="pollPassword"
                value={formData.pollPassword || ""}
                onChange={(e) =>
                  setFormData({ ...formData, pollPassword: e.target.value })
                }
                className="form-input"
                placeholder="Set a password for this private poll"
                minLength={1}
                required={formData.isPublic === false}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Questions</h3>

            {formData.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="question-builder">
                <div className="form-group">
                  <label className="form-label">
                    Question {questionIndex + 1} *
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) =>
                      handleQuestionChange(
                        questionIndex,
                        "question",
                        e.target.value
                      )
                    }
                    className="form-input"
                    placeholder="Enter your question"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Options</label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="option-container">
                      <div className="option-input">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) =>
                            handleOptionChange(
                              questionIndex,
                              optionIndex,
                              e.target.value
                            )
                          }
                          className="form-input"
                          placeholder={`Option ${optionIndex + 1}`}
                          required
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeOption(questionIndex, optionIndex)
                            }
                            className="btn btn-danger btn-sm"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>

                      {option.followUp ? (
                        <div className="follow-up-question">
                          <div className="form-group">
                            <label className="form-label">
                              Follow-up Question
                            </label>
                            <div className="option-input">
                              <input
                                type="text"
                                value={option.followUp.question}
                                onChange={(e) =>
                                  handleFollowUpQuestionChange(
                                    questionIndex,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                className="form-input"
                                placeholder="Enter follow-up question"
                                required
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeFollowUpQuestion(
                                    questionIndex,
                                    optionIndex
                                  )
                                }
                                className="btn btn-danger btn-sm"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Follow-up Options
                            </label>
                            {option.followUp.options.map(
                              (followUpOption, followUpOptionIndex) => (
                                <div
                                  key={followUpOptionIndex}
                                  className="option-input"
                                >
                                  <input
                                    type="text"
                                    value={followUpOption.text}
                                    onChange={(e) =>
                                      handleFollowUpOptionChange(
                                        questionIndex,
                                        optionIndex,
                                        followUpOptionIndex,
                                        e.target.value
                                      )
                                    }
                                    className="form-input"
                                    placeholder={`Option ${
                                      followUpOptionIndex + 1
                                    }`}
                                    required
                                  />
                                  {option.followUp.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeFollowUpOption(
                                          questionIndex,
                                          optionIndex,
                                          followUpOptionIndex
                                        )
                                      }
                                      className="btn btn-danger btn-sm"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  )}
                                </div>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                addFollowUpOption(questionIndex, optionIndex)
                              }
                              className="btn btn-outline btn-sm"
                            >
                              <i className="fas fa-plus"></i>
                              Add Follow-up Option
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            addFollowUpQuestion(questionIndex, optionIndex)
                          }
                          className="btn btn-outline btn-sm"
                          style={{ marginTop: 8 }}
                        >
                          <i className="fas fa-plus"></i>
                          Add Follow-up Question
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addOption(questionIndex)}
                    className="btn btn-outline btn-sm"
                  >
                    <i className="fas fa-plus"></i>
                    Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Create Poll
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;

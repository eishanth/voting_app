const express = require("express");
const Poll = require("../models/Poll");
const User = require("../models/User");
const { auth, optionalAuth } = require("../middleware/auth");
const crypto = require("crypto");
const router = express.Router();

// @route   GET /api/polls/public
// @desc    Get all public polls
// @access  Public
router.get("/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const polls = await Poll.find({
      isPublic: true,
      isActive: true,
    })
      .populate("creator", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Poll.countDocuments({ isPublic: true, isActive: true });

    res.json({
      polls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get public polls error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/polls/my
// @desc    Get user's polls
// @access  Private
router.get("/my", auth, async (req, res) => {
  try {
    const polls = await Poll.find({ creator: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ polls });
  } catch (error) {
    console.error("Get my polls error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/polls/voted
// @desc    Get polls user has voted on
// @access  Private
router.get("/voted", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "votedPolls.poll",
      populate: {
        path: "creator",
        select: "name avatar",
      },
    });

    const votedPolls = user.votedPolls.map((item) => ({
      poll: item.poll,
      votedAt: item.votedAt,
    }));

    res.json({ votedPolls });
  } catch (error) {
    console.error("Get voted polls error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/polls/favorites
// @desc    Get user's favorite polls
// @access  Private
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favoritePolls",
      populate: {
        path: "creator",
        select: "name avatar",
      },
    });

    res.json({ favoritePolls: user.favoritePolls });
  } catch (error) {
    console.error("Get favorite polls error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/polls
// @desc    Create a new poll
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      questions,
      isPublic,
      pollType,
      settings,
      password,
    } = req.body;

    // Validation
    if (!title || !questions || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Title and at least one question are required" });
    }

    const poll = new Poll({
      title,
      description,
      creator: req.user._id,
      questions,
      pollType: pollType || "personal", // Default to personal
      isPublic: isPublic !== undefined ? isPublic : true,
      settings: settings || {},
      password: isPublic === false ? password : undefined,
      inviteToken:
        isPublic === false ? crypto.randomBytes(16).toString("hex") : undefined,
    });

    await poll.save();

    // Add to user's created polls
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdPolls: poll._id },
    });

    await poll.populate("creator", "name avatar");

    res.status(201).json({
      message: "Poll created successfully",
      poll,
    });
  } catch (error) {
    console.error("Create poll error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/polls/:id
// @desc    Get poll by ID or shareable URL
// @access  Public
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by shareable URL
    let poll = await Poll.findById(id).populate("creator", "name avatar");

    if (!poll) {
      poll = await Poll.findOne({ shareableUrl: id }).populate(
        "creator",
        "name avatar"
      );
    }

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if poll is accessible
    if (
      !poll.isPublic &&
      (!req.user || poll.creator._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user has already voted
    let hasVoted = false;
    if (req.user) {
      hasVoted = poll.responses.some(
        (response) =>
          response.user && response.user.toString() === req.user._id.toString()
      );
    }

    // Conditionally populate user details in responses and options
    let pollObj = poll.toObject();
    if (
      poll.settings?.showUserDetails &&
      req.user &&
      poll.creator._id.toString() === req.user._id.toString()
    ) {
      // Populate user field in responses
      pollObj.responses = await Promise.all(
        poll.responses.map(async (resp) => {
          if (resp.user) {
            const user = await User.findById(resp.user).select("name");
            return { ...resp.toObject(), user, _id: resp._id };
          }
          return { ...resp.toObject(), _id: resp._id };
        })
      );
      // Populate voters for each option and follow-up option
      for (const question of pollObj.questions) {
        for (const option of question.options) {
          if (option.voters && option.voters.length > 0) {
            option.voters = await Promise.all(
              option.voters.map(async (v) => {
                if (v.user) {
                  const user = await User.findById(v.user).select("name");
                  return { ...v, user };
                }
                return v;
              })
            );
          }
          // Follow-up options
          if (option.followUp && option.followUp.options) {
            for (const followUpOption of option.followUp.options) {
              if (followUpOption.voters && followUpOption.voters.length > 0) {
                followUpOption.voters = await Promise.all(
                  followUpOption.voters.map(async (v) => {
                    if (v.user) {
                      const user = await User.findById(v.user).select("name");
                      return { ...v, user };
                    }
                    return v;
                  })
                );
              }
            }
          }
        }
      }
    } else {
      // Remove user field from responses
      pollObj.responses = poll.responses.map((resp) => {
        const r = resp.toObject();
        delete r.user;
        return { ...r, _id: resp._id };
      });
      // Remove voters from options for non-creator or if not visible
      for (const question of pollObj.questions) {
        for (const option of question.options) {
          option.voters = [];
          if (option.followUp && option.followUp.options) {
            for (const followUpOption of option.followUp.options) {
              followUpOption.voters = [];
            }
          }
        }
      }
    }

    res.json({ poll: pollObj, hasVoted });
  } catch (error) {
    console.error("Get poll error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/polls/invite/:token
// @desc    Get private poll by invite token
// @access  Public (token required)
router.get("/invite/:token", optionalAuth, async (req, res) => {
  try {
    const poll = await Poll.findOne({ inviteToken: req.params.token }).populate(
      "creator",
      "name avatar"
    );
    if (!poll || poll.isPublic) {
      return res
        .status(404)
        .json({ message: "Invalid or expired invite link" });
    }

    // Check if user has already voted (if authenticated)
    let hasVoted = false;
    if (req.user) {
      hasVoted = poll.responses.some(
        (response) =>
          response.user && response.user.toString() === req.user._id.toString()
      );
    }

    // Conditionally populate user details in responses
    let pollObj = poll.toObject();
    if (
      poll.settings?.showUserDetails &&
      req.user &&
      poll.creator._id.toString() === req.user._id.toString()
    ) {
      pollObj.responses = await Promise.all(
        poll.responses.map(async (resp) => {
          if (resp.user) {
            const user = await User.findById(resp.user).select("name");
            return { ...resp.toObject(), user, _id: resp._id };
          }
          return { ...resp.toObject(), _id: resp._id };
        })
      );
    } else {
      pollObj.responses = poll.responses.map((resp) => {
        const r = resp.toObject();
        delete r.user;
        return { ...r, _id: resp._id };
      });
    }

    res.json({ poll: pollObj, hasVoted });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/polls/invite/:token/verify
// @desc    Verify password for private poll by invite token
// @access  Public
router.post("/invite/:token/verify", optionalAuth, async (req, res) => {
  try {
    const poll = await Poll.findOne({ inviteToken: req.params.token }).populate(
      "creator",
      "name avatar"
    );
    if (!poll || poll.isPublic) {
      return res
        .status(404)
        .json({ message: "Invalid or expired invite link" });
    }
    const { password } = req.body;
    if (!password || poll.password !== password) {
      return res
        .status(401)
        .json({ message: "Incorrect password or error verifying password" });
    }

    // Check if user has already voted (if authenticated)
    let hasVoted = false;
    if (req.user) {
      hasVoted = poll.responses.some(
        (response) =>
          response.user && response.user.toString() === req.user._id.toString()
      );
    }

    // Conditionally populate user details in responses
    let pollObj = poll.toObject();
    if (
      poll.settings?.showUserDetails &&
      req.user &&
      poll.creator._id.toString() === req.user._id.toString()
    ) {
      pollObj.responses = await Promise.all(
        poll.responses.map(async (resp) => {
          if (resp.user) {
            const user = await User.findById(resp.user).select("name");
            return { ...resp.toObject(), user, _id: resp._id };
          }
          return { ...resp.toObject(), _id: resp._id };
        })
      );
    } else {
      pollObj.responses = poll.responses.map((resp) => {
        const r = resp.toObject();
        delete r.user;
        return { ...r, _id: resp._id };
      });
    }

    res.json({ poll: pollObj, hasVoted });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/polls/:id/vote
// @desc    Submit vote/response to poll
// @access  Private (must be signed in)
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (!poll.isActive) {
      return res.status(400).json({ message: "Poll is no longer active" });
    }

    // Check if user has already voted (if authenticated)
    if (!poll.allowMultipleResponses) {
      const hasVoted = poll.responses.some(
        (response) =>
          response.user && response.user.toString() === req.user._id.toString()
      );

      if (hasVoted) {
        return res
          .status(400)
          .json({ message: "You have already voted on this poll" });
      }
    }

    // Process answers and update vote counts
    const response = {
      user: req.user._id,
      answers: [],
      ipAddress: req.ip,
    };

    // Update vote counts for each question
    answers.forEach((answer) => {
      const question = poll.questions.id(answer.questionId);
      if (!question) return;

      const processedAnswer = {
        questionId: answer.questionId,
        answer: answer.answer,
        followUpAnswers: [],
      };

      if (
        question.type === "single-choice" ||
        question.type === "multiple-choice"
      ) {
        if (Array.isArray(answer.answer)) {
          // Multiple choice
          answer.answer.forEach((optionIndex) => {
            if (question.options[optionIndex]) {
              question.options[optionIndex].votes += 1;
              // Add user to voters array if not already present
              if (!question.options[optionIndex].voters.some(v => v.user && v.user.toString() === req.user._id.toString())) {
                question.options[optionIndex].voters.push({ user: req.user._id });
              }
              // Handle follow-up question if exists
              if (
                question.options[optionIndex].followUp &&
                answer.followUpAnswers
              ) {
                const followUpAnswer = answer.followUpAnswers.find(
                  (fa) => fa.optionIndex === optionIndex
                );
                if (followUpAnswer) {
                  const followUpQuestion =
                    question.options[optionIndex].followUp;
                  if (followUpQuestion.options[followUpAnswer.answer]) {
                    followUpQuestion.options[followUpAnswer.answer].votes += 1;
                    // Add user to follow-up option voters array
                    if (!followUpQuestion.options[followUpAnswer.answer].voters.some(v => v.user && v.user.toString() === req.user._id.toString())) {
                      followUpQuestion.options[followUpAnswer.answer].voters.push({ user: req.user._id });
                    }
                    processedAnswer.followUpAnswers.push({
                      optionIndex,
                      answer: followUpAnswer.answer,
                    });
                  }
                }
              }
            }
          });
        } else {
          // Single choice
          if (question.options[answer.answer]) {
            question.options[answer.answer].votes += 1;
            // Add user to voters array if not already present
            if (!question.options[answer.answer].voters.some(v => v.user && v.user.toString() === req.user._id.toString())) {
              question.options[answer.answer].voters.push({ user: req.user._id });
            }
            // Handle follow-up question if exists
            if (
              question.options[answer.answer].followUp &&
              answer.followUpAnswers
            ) {
              const followUpAnswer = answer.followUpAnswers.find(
                (fa) => fa.optionIndex === answer.answer
              );
              if (followUpAnswer) {
                const followUpQuestion =
                  question.options[answer.answer].followUp;
                if (followUpQuestion.options[followUpAnswer.answer]) {
                  followUpQuestion.options[followUpAnswer.answer].votes += 1;
                  // Add user to follow-up option voters array
                  if (!followUpQuestion.options[followUpAnswer.answer].voters.some(v => v.user && v.user.toString() === req.user._id.toString())) {
                    followUpQuestion.options[followUpAnswer.answer].voters.push({ user: req.user._id });
                  }
                  processedAnswer.followUpAnswers.push({
                    optionIndex: answer.answer,
                    answer: followUpAnswer.answer,
                  });
                }
              }
            }
          }
        }
      }

      response.answers.push(processedAnswer);
    });

    poll.responses.push(response);
    poll.totalResponses += 1;
    await poll.save();

    // Add to user's voted polls
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: {
        votedPolls: {
          poll: poll._id,
          votedAt: new Date(),
        },
      },
    });

    // Emit real-time update
    req.app.get("io").to(poll._id.toString()).emit("voteUpdate", {
      pollId: poll._id,
      totalResponses: poll.totalResponses,
      questions: poll.questions,
    });

    res.json({
      message: "Vote submitted successfully",
      poll: {
        _id: poll._id,
        totalResponses: poll.totalResponses,
        questions: poll.questions,
      },
    });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/polls/:id/favorite
// @desc    Toggle favorite status of a poll
// @access  Private
router.post("/:id/favorite", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const user = await User.findById(req.user._id);
    const isFavorite = user.favoritePolls.includes(id);

    if (isFavorite) {
      user.favoritePolls.pull(id);
    } else {
      user.favoritePolls.push(id);
    }

    await user.save();

    res.json({
      message: isFavorite ? "Removed from favorites" : "Added to favorites",
      isFavorite: !isFavorite,
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/polls/:id
// @desc    Update poll
// @access  Private (creator only)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if user is the creator
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update poll
    Object.assign(poll, updates);
    await poll.save();

    res.json({ message: "Poll updated successfully", poll });
  } catch (error) {
    console.error("Update poll error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/polls/:id
// @desc    Delete poll
// @access  Private (creator only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if user is the creator
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Poll.findByIdAndDelete(id);

    // Remove from user's created polls
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { createdPolls: id },
    });

    res.json({ message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Delete poll error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

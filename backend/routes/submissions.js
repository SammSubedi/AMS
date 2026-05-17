const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/submissions/my
// @desc    Get all submissions by the logged-in student
// @access  Private (Student only)
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate({
        path: 'assignment',
        populate: { path: 'teacher', select: 'name email' },
      })
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/submissions
// @desc    Submit an assignment
// @access  Private (Student only)
router.post(
  '/',
  protect,
  authorize('student'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { assignmentId, content } = req.body;

      if (!assignmentId) {
        return res.status(400).json({ message: 'Assignment ID is required' });
      }

      if (!content && !req.file) {
        return res
          .status(400)
          .json({ message: 'Please provide text content or upload a file' });
      }

      // Check assignment exists and is active
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      if (assignment.status === 'closed') {
        return res.status(400).json({ message: 'This assignment is closed' });
      }

      // Check for duplicate submission
      const existing = await Submission.findOne({
        assignment: assignmentId,
        student: req.user._id,
      });

      if (existing) {
        return res
          .status(409)
          .json({ message: 'You have already submitted this assignment' });
      }

      // Determine if late
      const isLate = new Date() > new Date(assignment.dueDate);

      const submissionData = {
        assignment: assignmentId,
        student: req.user._id,
        content: content || '',
        status: isLate ? 'late' : 'submitted',
      };

      if (req.file) {
        submissionData.fileUrl = `/uploads/${req.file.filename}`;
        submissionData.fileName = req.file.originalname;
      }

      const submission = await Submission.create(submissionData);
      await submission.populate([
        { path: 'student', select: 'name email' },
        { path: 'assignment', select: 'title subject dueDate totalMarks' },
      ]);

      res.status(201).json({ message: 'Assignment submitted successfully', submission });
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ message: 'You have already submitted this assignment' });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route   GET /api/submissions/:id
// @desc    Get a single submission
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email')
      .populate({
        path: 'assignment',
        populate: { path: 'teacher', select: 'name email' },
      });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Students can only view their own submissions
    if (
      req.user.role === 'student' &&
      submission.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Teachers can only view submissions for their assignments
    if (
      req.user.role === 'teacher' &&
      submission.assignment.teacher._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/submissions/:id/grade
// @desc    Grade a submission
// @access  Private (Teacher only)
router.put('/:id/grade', protect, authorize('teacher'), async (req, res) => {
  try {
    const { marks, feedback } = req.body;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ message: 'Marks are required' });
    }

    const submission = await Submission.findById(req.params.id).populate({
      path: 'assignment',
      populate: { path: 'teacher', select: '_id' },
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher owns the assignment
    if (
      submission.assignment.teacher._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (marks < 0 || marks > submission.assignment.totalMarks) {
      return res.status(400).json({
        message: `Marks must be between 0 and ${submission.assignment.totalMarks}`,
      });
    }

    submission.marks = Number(marks);
    submission.feedback = feedback || '';
    submission.status = 'graded';
    await submission.save();

    await submission.populate('student', 'name email');

    res.json({ message: 'Submission graded', submission });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

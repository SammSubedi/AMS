const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/assignments
// @desc    Get all assignments (teacher: own, student: all active)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    const assignments = await Assignment.find(query)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    // For students, attach submission status
    if (req.user.role === 'student') {
      const assignmentIds = assignments.map((a) => a._id);
      const submissions = await Submission.find({
        student: req.user._id,
        assignment: { $in: assignmentIds },
      }).select('assignment status marks');

      const submissionMap = {};
      submissions.forEach((s) => {
        submissionMap[s.assignment.toString()] = s;
      });

      const enriched = assignments.map((a) => ({
        ...a.toObject(),
        submission: submissionMap[a._id.toString()] || null,
      }));

      return res.json(enriched);
    }

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      'teacher',
      'name email'
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Teacher can only view their own assignments
    if (
      req.user.role === 'teacher' &&
      assignment.teacher._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private (Teacher only)
router.post(
  '/',
  protect,
  authorize('teacher'),
  upload.single('attachment'),
  async (req, res) => {
    try {
      const { title, description, subject, dueDate, totalMarks } = req.body;

      if (!title || !description || !subject || !dueDate || !totalMarks) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const assignmentData = {
        title,
        description,
        subject,
        dueDate: new Date(dueDate),
        totalMarks: Number(totalMarks),
        teacher: req.user._id,
      };

      if (req.file) {
        assignmentData.attachmentUrl = `/uploads/${req.file.filename}`;
        assignmentData.attachmentName = req.file.originalname;
      }

      const assignment = await Assignment.create(assignmentData);
      await assignment.populate('teacher', 'name email');

      res.status(201).json({ message: 'Assignment created', assignment });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(', ') });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route   PUT /api/assignments/:id
// @desc    Update an assignment
// @access  Private (Teacher only, own assignments)
router.put(
  '/:id',
  protect,
  authorize('teacher'),
  upload.single('attachment'),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      if (assignment.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { title, description, subject, dueDate, totalMarks, status } = req.body;

      if (title) assignment.title = title;
      if (description) assignment.description = description;
      if (subject) assignment.subject = subject;
      if (dueDate) assignment.dueDate = new Date(dueDate);
      if (totalMarks) assignment.totalMarks = Number(totalMarks);
      if (status) assignment.status = status;

      if (req.file) {
        assignment.attachmentUrl = `/uploads/${req.file.filename}`;
        assignment.attachmentName = req.file.originalname;
      }

      await assignment.save();
      await assignment.populate('teacher', 'name email');

      res.json({ message: 'Assignment updated', assignment });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route   DELETE /api/assignments/:id
// @desc    Delete an assignment
// @access  Private (Teacher only, own assignments)
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all related submissions
    await Submission.deleteMany({ assignment: req.params.id });
    await assignment.deleteOne();

    res.json({ message: 'Assignment and related submissions deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/assignments/:id/submissions
// @desc    Get all submissions for an assignment (teacher only)
// @access  Private (Teacher only)
router.get('/:id/submissions', protect, authorize('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

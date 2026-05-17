const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users/stats
// @desc    Get dashboard stats for the logged-in user
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const totalAssignments = await Assignment.countDocuments({
        teacher: req.user._id,
      });

      const activeAssignments = await Assignment.countDocuments({
        teacher: req.user._id,
        status: 'active',
      });

      // Get all assignment IDs for this teacher
      const assignments = await Assignment.find({ teacher: req.user._id }).select('_id');
      const assignmentIds = assignments.map((a) => a._id);

      const totalSubmissions = await Submission.countDocuments({
        assignment: { $in: assignmentIds },
      });

      const gradedSubmissions = await Submission.countDocuments({
        assignment: { $in: assignmentIds },
        status: 'graded',
      });

      const pendingSubmissions = await Submission.countDocuments({
        assignment: { $in: assignmentIds },
        status: { $in: ['submitted', 'late'] },
      });

      return res.json({
        totalAssignments,
        activeAssignments,
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions,
      });
    }

    // Student stats
    const totalAssignments = await Assignment.countDocuments({ status: 'active' });

    const mySubmissions = await Submission.countDocuments({
      student: req.user._id,
    });

    const gradedSubmissions = await Submission.countDocuments({
      student: req.user._id,
      status: 'graded',
    });

    const lateSubmissions = await Submission.countDocuments({
      student: req.user._id,
      status: 'late',
    });

    // Calculate average marks
    const gradedDocs = await Submission.find({
      student: req.user._id,
      status: 'graded',
    }).populate('assignment', 'totalMarks');

    let averageScore = 0;
    if (gradedDocs.length > 0) {
      const totalPercent = gradedDocs.reduce((sum, s) => {
        return sum + (s.marks / s.assignment.totalMarks) * 100;
      }, 0);
      averageScore = Math.round(totalPercent / gradedDocs.length);
    }

    res.json({
      totalAssignments,
      submitted: mySubmissions,
      graded: gradedSubmissions,
      lateSubmissions,
      pending: totalAssignments - mySubmissions,
      averageScore,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/users/students
// @desc    Get all students (teacher only)
// @access  Private (Teacher only)
router.get('/students', protect, authorize('teacher'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    req.user.name = name.trim();
    await req.user.save();

    res.json({ message: 'Profile updated', user: req.user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,12}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be 6–12 characters and include uppercase, lowercase, and a number',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

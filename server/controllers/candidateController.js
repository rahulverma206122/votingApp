const User      = require('../models/user');
const Candidate = require('../models/candidate');

// ─── Helper ───────────────────────────────────────────────
const isAdmin = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user?.role === 'admin';
  } catch {
    return false;
  }
};

// ─── ADD CANDIDATE ────────────────────────────────────────
exports.addCandidate = async (req, res) => {
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({
        success: false,
        message: 'User does not have admin role',
      });
    }

    const { name, party, age, imageUrl } = req.body;

    if (!name || !party || !age) {
      return res.status(400).json({
        success: false,
        message: 'Missing required candidate fields',
      });
    }

    const newCandidate = new Candidate({ name, party, age, imageUrl });
    const saved        = await newCandidate.save();

    res.status(201).json({
      success   : true,
      message   : 'Candidate added successfully',
      candidate : saved,
    });
  } catch (err) {
    console.error('Add candidate error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ─── UPDATE CANDIDATE ─────────────────────────────────────
exports.updateCandidate = async (req, res) => {
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({
        success: false,
        message: 'User does not have admin role',
      });
    }

    const { candidateID } = req.params;

    const updated = await Candidate.findByIdAndUpdate(
      candidateID,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    res.status(200).json({
      success   : true,
      message   : 'Candidate updated successfully',
      candidate : updated,
    });
  } catch (err) {
    console.error('Update candidate error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ─── DELETE CANDIDATE ─────────────────────────────────────
exports.deleteCandidate = async (req, res) => {
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({
        success: false,
        message: 'User does not have admin role',
      });
    }

    const { candidateID } = req.params;
    const deleted         = await Candidate.findByIdAndDelete(candidateID);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    res.status(200).json({
      success : true,
      message : 'Candidate deleted successfully',
    });
  } catch (err) {
    console.error('Delete candidate error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ─── CAST VOTE ────────────────────────────────────────────
exports.castVote = async (req, res) => {
  try {
    const { candidateID } = req.params;
    const userId          = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot vote' });
    }
    if (user.isVoted) {
      return res.status(400).json({ success: false, message: 'You have already voted' });
    }

    const candidate = await Candidate.findById(candidateID);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    candidate.votes.push({ user: userId });
    candidate.voteCount += 1;
    await candidate.save();

    user.isVoted = true;
    await user.save();

    res.status(200).json({
      success : true,
      message : 'Vote recorded successfully',
    });
  } catch (err) {
    console.error('Cast vote error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ─── GET RESULTS ──────────────────────────────────────────
exports.getResults = async (req, res) => {
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({
        success: false,
        message: 'User does not have admin role',
      });
    }

    const results = await Candidate.find().sort({ voteCount: -1 });

    res.status(200).json({
      success : true,
      results : results.map((c) => ({
        name  : c.name,
        party : c.party,
        votes : c.voteCount,
      })),
    });
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ─── LIST CANDIDATES ──────────────────────────────────────
exports.listCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find(
      {},
      'name party age imageUrl voteCount'
    );

    res.status(200).json({
      success    : true,
      candidates : candidates,
    });
  } catch (err) {
    console.error('List candidates error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// or we can do like this 
// export all at bottom in one place

// module.exports = {
//   addCandidate,
//   deleteCandidate,
//   updateCandidate,
//   castVote,
//   getResults,
//   listCandidates,
// };

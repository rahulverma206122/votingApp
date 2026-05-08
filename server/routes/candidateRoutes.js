const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/auth'); // ✅
const {
  addCandidate,
  updateCandidate,
  deleteCandidate,
  castVote,
  getResults,
  listCandidates,
} = require('../controllers/candidateController');

router.get('/',                              listCandidates);
router.post('/',        jwtAuthMiddleware,   addCandidate);
router.put('/:candidateID', jwtAuthMiddleware, updateCandidate);
router.delete('/:candidateID', jwtAuthMiddleware, deleteCandidate);
router.post('/vote/:candidateID', jwtAuthMiddleware, castVote);
router.get('/results',  jwtAuthMiddleware,   getResults);

module.exports = router;
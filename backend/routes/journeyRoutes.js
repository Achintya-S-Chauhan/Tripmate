import express from 'express';
import {
  getJourneys,
  getJourneyById,
  createJourney,
  updateJourney,
  deleteJourney,
  addSegment,
  updateSegment,
  deleteSegment,
} from '../controllers/journeyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All journey routes require authentication
router.use(protect);

router.route('/').get(getJourneys).post(createJourney);
router.route('/:id').get(getJourneyById).put(updateJourney).delete(deleteJourney);
router.route('/:id/segments').post(addSegment);
router.route('/:id/segments/:segmentId').put(updateSegment).delete(deleteSegment);

export default router;


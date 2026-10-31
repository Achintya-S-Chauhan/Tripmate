import express from 'express';
import {
  getSavedPlaces,
  createSavedPlace,
  updateSavedPlace,
  deleteSavedPlace,
} from '../controllers/savedPlaceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getSavedPlaces).post(createSavedPlace);
router.route('/:id').put(updateSavedPlace).delete(deleteSavedPlace);

export default router;


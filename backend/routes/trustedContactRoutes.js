import express from 'express';
import {
  getTrustedContacts,
  createTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
} from '../controllers/trustedContactController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getTrustedContacts).post(createTrustedContact);
router.route('/:id').put(updateTrustedContact).delete(deleteTrustedContact);

export default router;


import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { savePlaceSchema } from '../../validations/listing/location.validation';
import { savePlaceLocation } from '../../controllers/listing/location.controller';

const router = Router();

// Public / Authenticated route to persist resolved Google location from frontend
router.post('/save-place', validate(savePlaceSchema), savePlaceLocation);

export default router;

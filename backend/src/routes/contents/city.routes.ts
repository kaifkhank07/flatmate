import { Router } from 'express';
import { authenticateAdmin } from '../../middlewares/admin.middleware';
import { uploadSingleImage, uploadSingleCsv } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCitySchema,
  updateCitySchema,
  toggleCityStatusSchema,
} from '../../validations/contents/city.validation';
import {
  createCity,
  getCities,
  getCityById,
  getCityBySlug,
  updateCity,
  deleteCity,
  toggleCityStatus,
  importCities,
} from '../../controllers/contents/city.controller';

const router = Router();

// Public read-only routes
router.get('/', getCities);
router.get('/slug/:slug', getCityBySlug);
router.get('/:cityId', getCityById);

// Admin-only routes
router.post('/import', authenticateAdmin, uploadSingleCsv, importCities);
router.post('/', authenticateAdmin, uploadSingleImage, validate(createCitySchema), createCity);
router.put('/:cityId', authenticateAdmin, uploadSingleImage, validate(updateCitySchema), updateCity);
router.patch('/:cityId', authenticateAdmin, uploadSingleImage, validate(updateCitySchema), updateCity);
router.delete('/:cityId', authenticateAdmin, deleteCity);
router.patch('/:cityId/status', authenticateAdmin, validate(toggleCityStatusSchema), toggleCityStatus);

export default router;

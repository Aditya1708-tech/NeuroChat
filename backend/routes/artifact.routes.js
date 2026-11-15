import { Router } from 'express';
import {
  list,
  getById,
  create,
  update,
  remove,
  download,
} from '../controllers/artifact.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listArtifactsQuerySchema,
  createArtifactSchema,
  updateArtifactSchema,
  artifactIdParamSchema,
} from '../validators/artifact.schemas.js';

const router = Router();

// All artifact endpoints require authentication
router.use(requireAuth);

// List artifacts in Library
router.get('/', validate(listArtifactsQuerySchema, 'query'), asyncHandler(list));

// Create / Save artifact to Library
router.post('/', validate(createArtifactSchema), asyncHandler(create));

// Download artifact file
router.get('/:id/download', validate(artifactIdParamSchema, 'params'), asyncHandler(download));

// Get single artifact
router.get('/:id', validate(artifactIdParamSchema, 'params'), asyncHandler(getById));

// Update artifact
router.put(
  '/:id',
  validate(artifactIdParamSchema, 'params'),
  validate(updateArtifactSchema),
  asyncHandler(update)
);

// Delete artifact from Library
router.delete('/:id', validate(artifactIdParamSchema, 'params'), asyncHandler(remove));

export default router;


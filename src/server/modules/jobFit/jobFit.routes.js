import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/apiResponse.js';
import { ROLES } from '../../../shared/constants/roles.js';
import * as jobFit from './jobFit.service.js';

// Students only: preview how well their resume fits open jobs.
const router = Router();

router.use(authenticate, authorize(ROLES.CANDIDATE));

router.get('/', asyncHandler(async (req, res) => ok(res, await jobFit.listFits(req.user.id))));
router.post('/:jobId', asyncHandler(async (req, res) => ok(res, { fit: await jobFit.detailedFit(req.user.id, req.params.jobId) })));

export default router;

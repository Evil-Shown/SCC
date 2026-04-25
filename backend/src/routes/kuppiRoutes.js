import express from "express";
import { 
  checkKuppiEndpoint,
  createKuppiPost,
  updateKuppiPost,
  addMeetingLink,
  applyToKuppi,
  getKuppiApplicants,
  exportKuppiApplicants,
  getKuppiPosts,
  getMyKuppiLogs,
  deleteKuppiPost
} from "../controllers/kuppiController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @openapi
 * /api/kuppi/check:
 *   get:
 *     tags: [Kuppi]
 *     summary: Check Kuppi endpoint health
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kuppi endpoint is working
 */
router.get("/kuppi/check", protect, checkKuppiEndpoint);

/**
 * @openapi
 * /api/kuppi:
 *   post:
 *     tags: [Kuppi]
 *     summary: Create a kuppi post
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Kuppi post created successfully
 */
router.post("/kuppi", protect, createKuppiPost);

/**
 * @openapi
 * /api/kuppi/{postId}:
 *   put:
 *     tags: [Kuppi]
 *     summary: Update a kuppi post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kuppi post updated
 */
router.put("/kuppi/:postId", protect, updateKuppiPost);

/**
 * @openapi
 * /api/kuppi:
 *   get:
 *     tags: [Kuppi]
 *     summary: Get kuppi posts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kuppi posts fetched successfully
 */
router.get("/kuppi", protect, getKuppiPosts);

/**
 * @openapi
 * /api/kuppi/my/logs:
 *   get:
 *     tags: [Kuppi]
 *     summary: Get my kuppi logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User kuppi logs fetched
 */
router.get("/kuppi/my/logs", protect, getMyKuppiLogs);

/**
 * @openapi
 * /api/kuppi/apply:
 *   post:
 *     tags: [Kuppi]
 *     summary: Apply to a kuppi post
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Applied successfully
 */
router.post("/kuppi/apply", protect, applyToKuppi);

/**
 * @openapi
 * /api/kuppi/{postId}/link:
 *   patch:
 *     tags: [Kuppi]
 *     summary: Add or update kuppi meeting link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting link updated
 */
router.patch("/kuppi/:postId/link", protect, addMeetingLink);

/**
 * @openapi
 * /api/kuppi/{postId}:
 *   delete:
 *     tags: [Kuppi]
 *     summary: Delete a kuppi post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kuppi post deleted
 */
router.delete("/kuppi/:postId", protect, deleteKuppiPost);

/**
 * @openapi
 * /api/kuppi/applicants/{postId}:
 *   get:
 *     tags: [Kuppi]
 *     summary: Get applicants for a kuppi post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applicants fetched
 */
router.get("/kuppi/applicants/:postId", protect, getKuppiApplicants);

/**
 * @openapi
 * /api/kuppi/export/{postId}:
 *   get:
 *     tags: [Kuppi]
 *     summary: Export kuppi applicants as Excel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export file generated
 */
router.get("/kuppi/export/:postId", protect, exportKuppiApplicants);

export default router;

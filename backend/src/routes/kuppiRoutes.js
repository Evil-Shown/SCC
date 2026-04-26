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
 * components:
 *   schemas:
 *     KuppiCreateRequest:
 *       type: object
 *       required: [title, description, eventDate]
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         subject:
 *           type: string
 *         eventDate:
 *           type: string
 *           format: date-time
 *         meetingLink:
 *           type: string
 *     KuppiUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         subject:
 *           type: string
 *         eventDate:
 *           type: string
 *           format: date-time
 *         meetingLink:
 *           type: string
 *     KuppiApplyRequest:
 *       type: object
 *       required: [postId]
 *       properties:
 *         postId:
 *           type: string
 *     KuppiMeetingLinkRequest:
 *       type: object
 *       required: [meetingLink]
 *       properties:
 *         meetingLink:
 *           type: string
 */

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KuppiCreateRequest'
 *           example:
 *             title: DBMS Revision Session
 *             description: Discussion on indexing and normalization
 *             subject: Database Systems
 *             eventDate: 2026-05-01T10:00:00.000Z
 *             meetingLink: https://meet.google.com/abc-defg-hij
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KuppiUpdateRequest'
 *           example:
 *             title: Updated DBMS Revision Session
 *             description: Updated scope with ER diagrams
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KuppiApplyRequest'
 *           example:
 *             postId: 64f1abc1234567890def1234
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KuppiMeetingLinkRequest'
 *           example:
 *             meetingLink: https://meet.google.com/new-link-room
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

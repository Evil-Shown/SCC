import Notification from "../models/Notification.js";

/**
 * Create an in-app notification
 * @param {Object} options
 * @param {string} options.userId - Recipient user ID
 * @param {string} options.type - Notification type (kuppi_scheduled, note_reaction, note_comment, general)
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.relatedId] - Related document ID
 * @param {string} [options.relatedModel] - Related model name (Note, KuppiPost, Comment, Reaction)
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async ({
    userId,
    type,
    title,
    message,
    relatedId = null,
    relatedModel = null
}) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            relatedId,
            relatedModel
        });
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

/**
 * Create notifications for multiple users
 * @param {Array<string>} userIds - Array of recipient user IDs
 * @param {Object} notificationData - Notification data (type, title, message, relatedId, relatedModel)
 * @returns {Promise<Array>} Created notifications
 */
export const createBulkNotifications = async (userIds, notificationData) => {
    try {
        const notifications = await Notification.insertMany(
            userIds.map(userId => ({
                userId,
                ...notificationData
            }))
        );
        return notifications;
    } catch (error) {
        console.error("Error creating bulk notifications:", error);
        throw error;
    }
};

export default {
    createNotification,
    createBulkNotifications
};

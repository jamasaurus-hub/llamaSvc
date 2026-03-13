/**
 * Mount all API routes.
 * Protected routes use requireExtensionToken (backend-issued JWT); identity in req.user.id.
 */
const express = require('express');
const { requireExtensionToken } = require('../middleware/requireExtensionToken');
const { handleTranslate } = require('./translate');
const { handleSaveTermsBatch } = require('./learningItems');
const { handleGetUserCollections } = require('./collections');
const { handleAuthStatus, handleAuthToken } = require('./authApi');

const router = express.Router();

// Auth API (session-based; extension calls with credentials).
router.get('/auth/status', handleAuthStatus);
router.post('/auth/token', handleAuthToken);

router.post('/translate', handleTranslate);

router.get('/collections', requireExtensionToken, handleGetUserCollections);
router.post('/collections', requireExtensionToken, handleGetUserCollections);
router.post('/learning-items/batch', requireExtensionToken, handleSaveTermsBatch);

module.exports = router;

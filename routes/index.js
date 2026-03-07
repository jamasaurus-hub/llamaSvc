/**
 * Mount all API routes.
 * Protected routes use requireAuth; identity comes from JWT (req.user).
 */
const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { handleTranslate } = require('./translate');
const { handleSaveTermsBatch } = require('./learningItems');
const { handleGetUserCollections } = require('./collections');

const router = express.Router();

router.post('/translate', handleTranslate);

router.get('/collections', requireAuth, handleGetUserCollections);
router.post('/collections', requireAuth, handleGetUserCollections);
router.post('/learning-items/batch', requireAuth, handleSaveTermsBatch);

module.exports = router;

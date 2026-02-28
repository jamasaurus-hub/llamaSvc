/**
 * Mount all API routes.
 */
const express = require('express');
const { handleTranslate } = require('./translate');
const { handleSaveTermsBatch } = require('./learningItems');
const { handleGetUserCollections } = require('./collections');

const router = express.Router();

router.post('/translate', handleTranslate);
router.post('/learning-items/batch', handleSaveTermsBatch);
router.get('/collections', handleGetUserCollections);
router.post('/collections', handleGetUserCollections);

module.exports = router;

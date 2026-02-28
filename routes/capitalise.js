/**
 * POST /api/capitalise – query: CapitaliseText
 */
const { execute: capitaliseQuery } = require('../queries/capitalise');
const appConfig = require('../config/app');

function handleCapitalise(req, res) {
  const text = req.body?.text ?? '';
  if (text.length > appConfig.maxInputLength) {
    return res.status(400).json({
      error: `Input must be at most ${appConfig.maxInputLength} characters`,
    });
  }
  const result = capitaliseQuery({ text });
  res.type('text/plain').send(result);
}

module.exports = { handleCapitalise };

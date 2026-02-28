/**
 * Application configuration (env, limits, defaults).
 */
module.exports = {
  port: Number(process.env.PORT) || 5000,
  maxInputLength: 255,
  maxContextLength: 2000,
  maxTermLength: 500,
};

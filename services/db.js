/**
 * Prisma client singleton for use across the app.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = { prisma };

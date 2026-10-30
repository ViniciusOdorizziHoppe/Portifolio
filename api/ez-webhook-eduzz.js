// POST /api/ez-webhook-eduzz
import { tratarWebhook } from './_ez-webhook-handler.js';

export default function handler(req, res) {
  return tratarWebhook(req, res, 'eduzz');
}

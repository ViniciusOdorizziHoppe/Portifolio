// POST /api/ez-webhook-kirvano
import { tratarWebhook } from './_ez-webhook-handler.js';

export default function handler(req, res) {
  return tratarWebhook(req, res, 'kirvano');
}

// POST /api/ez-webhook-hotmart
import { tratarWebhook } from './_ez-webhook-handler.js';

export default function handler(req, res) {
  return tratarWebhook(req, res, 'hotmart');
}

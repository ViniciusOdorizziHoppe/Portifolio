// POST /api/ez-webhook-kiwify
import { tratarWebhook } from './_ez-webhook-handler.js';

export default function handler(req, res) {
  return tratarWebhook(req, res, 'kiwify');
}

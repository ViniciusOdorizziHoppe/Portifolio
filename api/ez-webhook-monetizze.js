// POST /api/ez-webhook-monetizze
import { tratarWebhook } from './_ez-webhook-handler.js';

export default function handler(req, res) {
  return tratarWebhook(req, res, 'monetizze');
}

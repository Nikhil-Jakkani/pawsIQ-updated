import express from 'express';
import { userAuth } from '../middlewares/user.auth.js';
import { db } from '../../config/db.js';
import httpStatus from 'http-status';
import { randomUUID } from 'crypto';

const router = express.Router();

router.post('/signed-upload', userAuth as any, async (req: any, res) => {
  const { bucket, entity, entity_id, file_ext } = req.body || {};
  if (!bucket || !entity || !entity_id || !file_ext) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'bucket, entity, entity_id and file_ext are required' });
  }

  const cleanExt = String(file_ext).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const uid = randomUUID();
  const path = `${req.user.user_id}/${entity}/${entity_id}/${uid}.${cleanExt}`;

  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error?.message || 'Failed to create signed upload URL' });
  }

  return res.status(httpStatus.OK).send({ bucket, path, token: data.token, signedUrl: data.signedUrl });
});

router.get('/signed-url', userAuth as any, async (req: any, res) => {
  const { bucket, path, expiresIn } = req.query as any;
  if (!bucket || !path) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'bucket and path are required' });
  }
  const exp = Math.min(60 * 60 * 24 * 7, Math.max(60, Number(expiresIn) || 60 * 60 * 24));
  const transform = (req.query && (req.query as any).transform) ? JSON.parse(String((req.query as any).transform)) : undefined;

  const { data, error } = await db.storage
    .from(String(bucket))
    .createSignedUrl(String(path), exp, transform ? { transform } : undefined);

  if (error || !data) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error?.message || 'Failed to create signed URL' });
  }
  res.setHeader('Cache-Control', 'private, max-age=300');
  return res.status(httpStatus.OK).send({ url: data.signedUrl });
});

router.post('/signed-urls', userAuth as any, async (req: any, res) => {
  const { bucket, paths, expiresIn, transform } = req.body || {};
  if (!bucket || !Array.isArray(paths) || paths.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'bucket and paths[] are required' });
  }
  const exp = Math.min(60 * 60 * 24 * 7, Math.max(60, Number(expiresIn) || 60 * 60 * 24));
  try {
    const results = await Promise.all(
      paths.map(async (p: string) => {
        const { data, error } = await db.storage
          .from(String(bucket))
          .createSignedUrl(String(p), exp, transform ? { transform } : undefined);
        if (error || !data) return [p, null] as const;
        return [p, data.signedUrl] as const;
      })
    );
    const urls: Record<string, string | null> = Object.fromEntries(results);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(httpStatus.OK).send({ urls });
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e?.message || 'Failed to create signed URLs' });
  }
});

export default router;

import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, ProfileCreate, ProfileUpdate, BatchActionRequest } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    const getStub = (c: any) => c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
    // --- Asset Routes ---
    app.get('/api/assets', async (c) => {
        const stub = getStub(c);
        const data = await stub.getAssets();
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.get('/api/assets/:id', async (c) => {
        const id = c.req.param('id');
        const stub = getStub(c);
        const data = await stub.getAssetDetails(id);
        if (!data) return c.json({ success: false, error: 'Asset not found' }, 404);
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.post('/api/assets', async (c) => {
        const body = await c.req.json() as { filename: string; size: number; profile_id?: string };
        const stub = getStub(c);
        const data = await stub.createAsset(body.filename, body.size, body.profile_id);
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.post('/api/assets/:id/transform', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json() as { targetProfileId: string };
        const stub = getStub(c);
        const data = await stub.transformAsset(id, body.targetProfileId);
        if (!data) return c.json({ success: false, error: 'Transformation failed or asset not found' }, 404);
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.get('/api/assets/:id/variants', async (c) => {
        const id = c.req.param('id');
        const stub = getStub(c);
        const allAssets = await stub.getAssets();
        const variants = allAssets.filter(a => a.parent_id === id);
        return c.json({ success: true, data: variants } satisfies ApiResponse);
    });
    // --- Batch Operations ---
    app.post('/api/assets/batch', async (c) => {
        const { assetIds, action, targetProfileId } = await c.req.json() as BatchActionRequest;
        const stub = getStub(c);
        if (action === 'delete') {
            await stub.deleteAssets(assetIds);
        } else if (action === 'validate') {
            await stub.batchValidate(assetIds, targetProfileId);
        } else if (action === 'transform' && targetProfileId) {
            for (const id of assetIds) {
                await stub.transformAsset(id, targetProfileId);
            }
        }
        return c.json({ success: true } satisfies ApiResponse);
    });
    // --- Profile Routes ---
    app.get('/api/profiles', async (c) => {
        const stub = getStub(c);
        const data = await stub.getProfiles();
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.post('/api/profiles', async (c) => {
        const body = await c.req.json() as ProfileCreate;
        const stub = getStub(c);
        const data = await stub.createProfile(body);
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.patch('/api/profiles/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json() as ProfileUpdate;
        const stub = getStub(c);
        const data = await stub.updateProfile(id, body);
        if (!data) return c.json({ success: false, error: 'Profile not found' }, 404);
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.delete('/api/profiles/:id', async (c) => {
        const id = c.req.param('id');
        const stub = getStub(c);
        await stub.deleteProfile(id);
        return c.json({ success: true } satisfies ApiResponse);
    });
}
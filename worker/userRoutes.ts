import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/assets', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getAssets();
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.get('/api/assets/:id', async (c) => {
        const id = c.req.param('id');
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getAssetDetails(id);
        if (!data) return c.json({ success: false, error: 'Asset not found' }, 404);
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.post('/api/assets', async (c) => {
        const body = await c.req.json() as { filename: string; size: number };
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.createAsset(body.filename, body.size);
        return c.json({ success: true, data } satisfies ApiResponse);
    });
    app.get('/api/profiles', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getProfiles();
        return c.json({ success: true, data } satisfies ApiResponse);
    });
}
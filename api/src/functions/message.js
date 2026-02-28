import { app } from '@azure/functions';

app.http('message', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            context.log(`Function processed for ${request.method} ${request.url}`);
            const name = request.query.get('name') ||
                         typeof await request.text() ||
                        'Unknown';
            context.log(`name: ${name}`);
            return {
                status: 200, // default to 200
                jsonBody: { name, timestamp: Date.now().toLocaleString() }
            };
        } catch (err) {
            context.error(`${err}`);
        }
    }
});
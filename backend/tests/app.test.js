const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
    it('should return health status', async () => {
        const res = await request(app).get('/health');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'OK');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
    });
});

describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123456',
                name: 'Test User',
                birthday: '1990-01-01'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data).toHaveProperty('token');
        });

        it('should not register user with invalid email', async () => {
            const userData = {
                username: 'testuser2',
                email: 'invalid-email',
                password: 'Test123456',
                name: 'Test User',
                birthday: '1990-01-01'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});

describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/unknown-route');

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
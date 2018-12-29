const request = require('supertest');
const app = require('./app');

beforeAll(async () => {
    await require('./models').sequelize.sync({ force: true, logging: false });
});

afterAll(async () => {
    await require('./models').sequelize.close();
});

describe('GET /', () => {
    it('returns 200 on GET /', async () => {
        const resp = await request(app).get('/');
        expect(resp.status).toBe(200);
    });

    it('returns 404 on GET wrong url', async () => {
        const resp = await request(app).get('/__I_HOPE_THIS_WILL_ALWAYS_WILL_BE_INVALID__');
        expect(resp.status).toBe(404);
    });

    it('GET /__OOPS__ raises exception', async () => {
        const resp = await request(app).get('/__OOPS__');
        expect(resp.status).toBe(500);
    });
});

describe('GET /api', () => {
    it('returns 200 on GET /api', async () => {
        const resp = await request(app).get('/api');
        expect(resp.status).toBe(200);
    });
});

describe('POST /api/users', () => {
    it('creates "test" user and does not allow to do that again', async () => {
        const resp = await request(app)
            .post('/api/users')
            .send({ username: 'test', password: 'test123' });

        expect(resp.status).toBe(201);
        expect(resp.body.message).toBe('User test was created.');

        const response2 = await request(app)
            .post('/api/users')
            .send({ username: 'test', password: 'test123' });
        expect(response2.status).toBe(409);
    });
});

const request = require('supertest');
const app = require('./app');
const crypto = require('crypto');

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

const createUser = async () => {
    const username = crypto.randomBytes(20).toString('hex');
    const resp = await request(app)
        .post('/api/users')
        .send({ username, password: username });

    if (resp.status !== 201) {
        throw 'Failed to create user.';
    }

    return username;
};

describe('POST /api/tokens', () => {
    it('gets token for user', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        expect(resp.body).toEqual(
            expect.objectContaining({
                access_token: expect.any(String),
                refresh_token: expect.any(String),
            }),
        );

        const access_token = resp.body.access_token;

        resp = await request(app)
            .get('/api/auth')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);

        resp = await request(app)
            .post('/api/tokens')
            .send({ username: username + username, password: username });

        expect(resp.status).toBe(404);

        resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: 'meh' });

        expect(resp.status).toBe(400);
    });
});

describe('Test access tokens', () => {
    it('gets access token using refresh token', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const refresh_token = resp.body.refresh_token;

        resp = await request(app)
            .post('/api/access_tokens')
            .set('Authorization', 'Bearer ' + refresh_token)
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        expect('access_token' in resp.body).toBeTruthy();
    });

    it('deletes tokens', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const access_token = resp.body.access_token;
        const refresh_token = resp.body.refresh_token;

        resp = await request(app)
            .delete('/api/access_tokens')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/refresh_tokens')
            .set('Authorization', 'Bearer ' + refresh_token);

        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/auth')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(401);

        resp = await request(app)
            .post('/api/access_tokens')
            .set('Authorization', 'Bearer ' + refresh_token);

        expect(resp.status).toBe(401);
    });

    it('tries to access protected resources without token', async () => {
        let resp = await request(app).get('/api/auth');

        expect(resp.status).toBe(403);

        resp = await request(app).post('/api/access_tokens');

        expect(resp.status).toBe(403);
    });

    it('tries to access protected resources with fake token', async () => {
        let resp = await request(app)
            .get('/api/auth')
            .set('Authorization', 'Bearer fake_token');

        expect(resp.status).toBe(500);

        resp = await request(app)
            .post('/api/access_tokens')
            .set('Authorization', 'Bearer fake_token');

        expect(resp.status).toBe(500);
    });

    it('tries to access protected resources with wrong type of token', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const access_token = resp.body.access_token;
        const refresh_token = resp.body.refresh_token;

        resp = await request(app)
            .get('/api/auth')
            .set('Authorization', 'Bearer ' + refresh_token);

        expect(resp.status).toBe(403);

        resp = await request(app)
            .post('/api/access_tokens')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(403);
    });
});

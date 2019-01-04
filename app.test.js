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

const getToken = async username => {
    let resp = await request(app)
        .post('/api/tokens')
        .send({ username, password: username });

    if (resp.status !== 200) {
        throw 'Failed to get Token.';
    }

    return resp.body.access_token;
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

describe('Test games', () => {
    it('runs game life-cycle', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const access_token = resp.body.access_token;

        // Create game
        resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + access_token)
            .send({ name: 'test game' });
        expect(resp.status).toBe(201);
        expect('game_id' in resp.body).toBeTruthy();

        const game_id = resp.body.game_id;
        // Get all games

        resp = await request(app)
            .get('/api/games')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);

        expect(resp.body['games']).toHaveLength(1);
        expect(resp.body['games'][0]['name']).toEqual('test game');
        expect(resp.body['games'][0]['id']).toEqual(game_id);

        // Get game

        resp = await request(app)
            .get('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);

        expect(resp.body['name']).toEqual('test game');
        expect(resp.body['id']).toEqual(game_id);

        // Update game

        resp = await request(app)
            .put('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token)
            .send({ name: 'test game 2' });
        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.body['name']).toEqual('test game 2');
        expect(resp.body['id']).toEqual(game_id);

        // Delete game

        resp = await request(app)
            .delete('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token);
        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token);
        expect(resp.status).toBe(404);

        resp = await request(app)
            .get('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(404);

        resp = await request(app)
            .put('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token)
            .send({ name: 'test game 3' });
        expect(resp.status).toBe(404);
    });
});

describe('Test cardsets', () => {
    it('runs cardsets life-cycle', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const access_token = resp.body.access_token;

        // Create game
        resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + access_token)
            .send({ name: 'test cardset' });
        expect(resp.status).toBe(201);
        expect('game_id' in resp.body).toBeTruthy();

        const game_id = resp.body.game_id;

        // Create cardset
        resp = await request(app)
            .post('/api/cardsets')
            .set('Authorization', 'Bearer ' + access_token)
            .send({ name: 'test cardset', data: '{}', game_id });
        expect(resp.status).toBe(201);
        expect('cardset_id' in resp.body).toBeTruthy();

        const cardset_id = resp.body.cardset_id;

        // Get all cardsets

        resp = await request(app)
            .get('/api/games/' + game_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.body['cardsets']).toHaveLength(1);
        expect(resp.body['cardsets'][0]['name']).toEqual('test cardset');
        expect(resp.body['cardsets'][0]['id']).toEqual(cardset_id);
        expect('data' in resp.body['cardsets'][0]).toBeFalsy();

        // Get cardset

        resp = await request(app)
            .get('/api/cardsets/' + cardset_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.body['name']).toEqual('test cardset');
        expect(resp.body['id']).toEqual(cardset_id);
        expect(resp.body['game_id']).toEqual(game_id);

        // Update game

        resp = await request(app)
            .put('/api/cardsets/' + cardset_id)
            .set('Authorization', 'Bearer ' + access_token)
            .send({ name: 'test cardset 2', data: '{"data": "updated"}' });
        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/cardsets/' + cardset_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.body['name']).toEqual('test cardset 2');
        expect(resp.body['data']).toEqual('{"data": "updated"}');
        expect(resp.body['id']).toEqual(cardset_id);

        resp = await request(app)
            .delete('/api/cardsets/' + cardset_id)
            .set('Authorization', 'Bearer ' + access_token);
        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/cardsets/' + cardset_id)
            .set('Authorization', 'Bearer ' + access_token);
        expect(resp.status).toBe(404);

        resp = await request(app)
            .get('/api/cardsets/' + cardset_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(404);

        resp = await request(app)
            .put('/api/cardsets/' + cardset_id)
            .set('Authorization', 'Bearer ' + access_token)
            .send({ name: 'test cardset 3', data: '{}' });
        expect(resp.status).toBe(404);
    });
});

describe('Test images', () => {
    it('runs images life-cycle', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const access_token = resp.body.access_token;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + access_token)
            .field('global', 'true')
            .field('name', 'test_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('image_id' in resp.body).toBeTruthy();

        const image_id = resp.body.image_id;

        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + access_token)
            .field('global', 'true')
            .field('name', 'test_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(409);

        // Get all images

        resp = await request(app)
            .get('/api/images')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['name']).toEqual('test_fly.svg');
        expect(resp.body['images'][0]['id']).toEqual(image_id);

        // Get image

        resp = await request(app)
            .get('/api/images/' + image_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.header['content-disposition']).toEqual('attachment; filename=test_fly.svg');
        expect(resp.header['content-type']).toEqual('image/svg+xml');

        // Delete image

        resp = await request(app)
            .delete('/api/images/' + image_id)
            .set('Authorization', 'Bearer ' + access_token);
        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/images/' + image_id)
            .set('Authorization', 'Bearer ' + access_token);
        expect(resp.status).toBe(404);

        resp = await request(app)
            .get('/api/images/' + image_id)
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(404);
    });

    it('Get all filters images properly', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const access_token = resp.body.access_token;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + access_token)
            .field('global', 'true')
            .field('name', 'test_filter_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('image_id' in resp.body).toBeTruthy();

        const image_id = resp.body.image_id;

        // Get only requested image

        resp = await request(app)
            .get('/api/images?name=filter_fly')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['name']).toEqual('test_filter_fly.svg');
        expect(resp.body['images'][0]['id']).toEqual(image_id);

        resp = await request(app)
            .get('/api/images?name=zzzzz')
            .set('Authorization', 'Bearer ' + access_token);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(0);
    });

    it('User can access global images created by another user', async () => {
        const username = await createUser();
        const access_token = await getToken(username);

        // Create image
        let resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + access_token)
            .field('global', 'true')
            .field('name', username + 'test_filter_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('image_id' in resp.body).toBeTruthy();

        const image_id = resp.body.image_id;

        // Get created image with another user
        const username2 = await createUser();
        const access_token2 = await getToken(username2);

        resp = await request(app)
            .get('/api/images/' + image_id)
            .set('Authorization', 'Bearer ' + access_token2);

        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/images?name=' + username)
            .set('Authorization', 'Bearer ' + access_token2);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['id']).toEqual(image_id);
    });

    it('User can not access non global images created by another user', async () => {
        const username = await createUser();
        const access_token = await getToken(username);

        // Create image
        let resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + access_token)
            .field('name', username + 'test_filter_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('image_id' in resp.body).toBeTruthy();

        const image_id = resp.body.image_id;

        // Get created image with another user
        const username2 = await createUser();
        const access_token2 = await getToken(username2);

        resp = await request(app)
            .get('/api/images/' + image_id)
            .set('Authorization', 'Bearer ' + access_token2);

        expect(resp.status).toBe(404);

        resp = await request(app)
            .get('/api/images?name=' + username)
            .set('Authorization', 'Bearer ' + access_token2);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(0);
    });
});

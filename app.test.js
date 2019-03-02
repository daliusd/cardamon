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

    it('returns 200 on GET /games', async () => {
        const resp = await request(app).get('/games');
        expect(resp.status).toBe(200);
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

    return resp.body.accessToken;
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
                accessToken: expect.any(String),
                refreshToken: expect.any(String),
            }),
        );

        const accessToken = resp.body.accessToken;

        resp = await request(app)
            .get('/api/auth')
            .set('Authorization', 'Bearer ' + accessToken);

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
        const refreshToken = resp.body.refreshToken;

        resp = await request(app)
            .post('/api/access_tokens')
            .set('Authorization', 'Bearer ' + refreshToken)
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        expect('accessToken' in resp.body).toBeTruthy();
    });

    it('deletes tokens', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const accessToken = resp.body.accessToken;
        const refreshToken = resp.body.refreshToken;

        resp = await request(app)
            .delete('/api/access_tokens')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/refresh_tokens')
            .set('Authorization', 'Bearer ' + refreshToken);

        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/auth')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(401);

        resp = await request(app)
            .post('/api/access_tokens')
            .set('Authorization', 'Bearer ' + refreshToken);

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
        const accessToken = resp.body.accessToken;
        const refreshToken = resp.body.refreshToken;

        resp = await request(app)
            .get('/api/auth')
            .set('Authorization', 'Bearer ' + refreshToken);

        expect(resp.status).toBe(403);

        resp = await request(app)
            .post('/api/access_tokens')
            .set('Authorization', 'Bearer ' + accessToken);

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
        const accessToken = resp.body.accessToken;

        // Create game
        resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test game' });
        expect(resp.status).toBe(201);
        expect('gameId' in resp.body).toBeTruthy();

        const gameId = resp.body.gameId;
        // Get all games

        resp = await request(app)
            .get('/api/games')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);

        expect(resp.body['games']).toHaveLength(1);
        expect(resp.body['games'][0]['name']).toEqual('test game');
        expect(resp.body['games'][0]['id']).toEqual(gameId);

        // Get game

        resp = await request(app)
            .get('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);

        expect(resp.body['name']).toEqual('test game');
        expect(resp.body['id']).toEqual(gameId);

        // Update game

        resp = await request(app)
            .put('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test game 2' });
        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['name']).toEqual('test game 2');
        expect(resp.body['id']).toEqual(gameId);

        // Delete game

        resp = await request(app)
            .delete('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(resp.status).toBe(404);

        resp = await request(app)
            .get('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(404);

        resp = await request(app)
            .put('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test game 3' });
        expect(resp.status).toBe(404);
    });

    it('User cannot access game created by another user', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const accessToken = resp.body.accessToken;

        // Create game
        resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test game' });
        expect(resp.status).toBe(201);
        expect('gameId' in resp.body).toBeTruthy();

        const gameId = resp.body.gameId;

        // Get game with another user
        const username2 = await createUser();
        const accessToken2 = await getToken(username2);

        resp = await request(app)
            .get('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken2);
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
        const accessToken = resp.body.accessToken;

        // Create game
        resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test cardset' });
        expect(resp.status).toBe(201);
        expect('gameId' in resp.body).toBeTruthy();

        const gameId = resp.body.gameId;

        // Create cardset
        resp = await request(app)
            .post('/api/cardsets')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test cardset', data: '{}', gameId });
        expect(resp.status).toBe(201);
        expect('cardsetId' in resp.body).toBeTruthy();

        const cardsetId = resp.body.cardsetId;

        // Get all cardsets

        resp = await request(app)
            .get('/api/games/' + gameId)
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['cardsets']).toHaveLength(1);
        expect(resp.body['cardsets'][0]['name']).toEqual('test cardset');
        expect(resp.body['cardsets'][0]['id']).toEqual(cardsetId);
        expect('data' in resp.body['cardsets'][0]).toBeFalsy();

        // Get cardset

        resp = await request(app)
            .get('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['name']).toEqual('test cardset');
        expect(resp.body['id']).toEqual(cardsetId);
        expect(resp.body['gameId']).toEqual(gameId);

        // Update game

        resp = await request(app)
            .put('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test cardset 2', data: '{"data": "updated"}' });
        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['name']).toEqual('test cardset 2');
        expect(resp.body['data']).toEqual('{"data": "updated"}');
        expect(resp.body['id']).toEqual(cardsetId);

        resp = await request(app)
            .delete('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(resp.status).toBe(404);

        resp = await request(app)
            .get('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(404);

        resp = await request(app)
            .put('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test cardset 3', data: '{}' });
        expect(resp.status).toBe(404);
    });

    it('User cannot access cardset created by another user', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const accessToken = resp.body.accessToken;

        // Create game
        resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test cardset' });
        expect(resp.status).toBe(201);
        expect('gameId' in resp.body).toBeTruthy();

        const gameId = resp.body.gameId;

        // Create cardset
        resp = await request(app)
            .post('/api/cardsets')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test cardset', data: '{}', gameId });
        expect(resp.status).toBe(201);
        expect('cardsetId' in resp.body).toBeTruthy();

        const cardsetId = resp.body.cardsetId;

        // Get cardset with another user

        const username2 = await createUser();
        const accessToken2 = await getToken(username2);

        resp = await request(app)
            .get('/api/cardsets/' + cardsetId)
            .set('Authorization', 'Bearer ' + accessToken2);
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
        const accessToken = resp.body.accessToken;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('global', 'true')
            .field('name', 'test_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        const imageId = resp.body.imageId;

        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('global', 'true')
            .field('name', 'test_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(200);

        // Get all images

        resp = await request(app)
            .get('/api/images')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['name']).toEqual('test_fly.svg');
        expect(resp.body['images'][0]['id']).toEqual(imageId);

        // Get image

        resp = await request(app).get('/api/imagefiles/test_fly.svg');

        expect(resp.status).toBe(200);
        expect(resp.header['content-disposition']).toEqual('attachment; filename=test_fly.svg');
        expect(resp.header['content-type']).toEqual('image/svg+xml');

        // Update image
        resp = await request(app)
            .post('/api/images/' + imageId)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'new_name_test', gameId: null });
        expect(resp.status).toBe(200);

        resp = await request(app)
            .get('/api/images?name=new_name_test')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['id']).toEqual(imageId);

        // Delete image

        resp = await request(app)
            .delete('/api/images/' + imageId)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(resp.status).toBe(200);

        resp = await request(app)
            .delete('/api/images/' + imageId)
            .set('Authorization', 'Bearer ' + accessToken);
        expect(resp.status).toBe(404);

        resp = await request(app).get('/api/imagefiles/test_fly.svg');

        expect(resp.status).toBe(404);

        // Update deletes image
        resp = await request(app)
            .post('/api/images/' + imageId)
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'new_name_test_2', gameId: null });
        expect(resp.status).toBe(404);
    });

    it('user file name if name not supplied via params', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const accessToken = resp.body.accessToken;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('global', 'true')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        const imageId = resp.body.imageId;

        // Get all images

        resp = await request(app)
            .get('/api/images')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['name']).toEqual('fly.svg');
        expect(resp.body['images'][0]['id']).toEqual(imageId);
    });

    it('Get all filters images properly', async () => {
        const username = await createUser();

        let resp = await request(app)
            .post('/api/tokens')
            .send({ username, password: username });

        expect(resp.status).toBe(200);
        const accessToken = resp.body.accessToken;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('global', 'true')
            .field('name', 'test_filter_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        const imageId = resp.body.imageId;

        // Get only requested image

        resp = await request(app)
            .get('/api/images?name=filter_fly')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['name']).toEqual('test_filter_fly.svg');
        expect(resp.body['images'][0]['id']).toEqual(imageId);

        resp = await request(app)
            .get('/api/images?name=zzzzz')
            .set('Authorization', 'Bearer ' + accessToken);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(0);
    });

    it('Image can be re-uploaded with same name but different content', async () => {
        const username = await createUser();
        const accessToken = await getToken(username);

        // Create game
        let resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test game re-uploaded' });
        expect(resp.status).toBe(201);
        expect('gameId' in resp.body).toBeTruthy();

        const gameId = resp.body.gameId;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('global', 'false')
            .field('gameId', gameId)
            .field('name', 'test_re_upload.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        expect(resp.status).toBe(201);
        const imageId = resp.body.imageId;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('global', 'false')
            .field('gameId', gameId)
            .field('name', 'test_re_upload.svg')
            .attach('image', 'test/owl.svg');
        expect(resp.status).toBe(200);

        const reuploadImageId = resp.body.imageId;

        expect(reuploadImageId).toEqual(imageId);
    });

    it('User can access global images created by another user', async () => {
        const username = await createUser();
        const accessToken = await getToken(username);

        // Create image
        let resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('global', 'true')
            .field('name', username + 'test_filter_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        const imageId = resp.body.imageId;

        // Get created image with another user
        const username2 = await createUser();
        const accessToken2 = await getToken(username2);

        resp = await request(app)
            .get('/api/images?name=' + username)
            .set('Authorization', 'Bearer ' + accessToken2);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(1);
        expect(resp.body['images'][0]['id']).toEqual(imageId);
    });

    it('User can not access non global images created by another user', async () => {
        const username = await createUser();
        const accessToken = await getToken(username);

        // Create image
        let resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('name', username + 'test_filter_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        // Get created image with another user
        const username2 = await createUser();
        const accessToken2 = await getToken(username2);

        resp = await request(app)
            .get('/api/images?name=' + username)
            .set('Authorization', 'Bearer ' + accessToken2);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(0);
    });

    it('User can not access user images created by another user', async () => {
        const username = await createUser();
        const accessToken = await getToken(username);

        // Create image
        let resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('name', username + 'test_filter_fly.svg')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        // Get created image with another user
        const username2 = await createUser();
        const accessToken2 = await getToken(username2);

        resp = await request(app)
            .get(`/api/images?name=${username}&location=user`)
            .set('Authorization', 'Bearer ' + accessToken2);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(0);
    });

    it('User can not access game images created by another user', async () => {
        const username = await createUser();
        const accessToken = await getToken(username);

        // Create game
        let resp = await request(app)
            .post('/api/games')
            .set('Authorization', 'Bearer ' + accessToken)
            .send({ name: 'test game re-uploaded' });
        expect(resp.status).toBe(201);
        expect('gameId' in resp.body).toBeTruthy();

        const gameId = resp.body.gameId;

        // Create image
        resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('name', username + 'test_filter_fly.svg')
            .field('gameId', gameId)
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);
        expect('imageId' in resp.body).toBeTruthy();

        // Get created image with another user
        const username2 = await createUser();
        const accessToken2 = await getToken(username2);

        resp = await request(app)
            .get(`/api/images?name=${username}&location=game&game=${gameId}`)
            .set('Authorization', 'Bearer ' + accessToken2);

        expect(resp.status).toBe(200);
        expect(resp.body['images']).toHaveLength(0);
    });

    it('if-none-match works with images', async () => {
        const username = await createUser();
        const accessToken = await getToken(username);

        // Create image
        let resp = await request(app)
            .post('/api/images')
            .set('Authorization', 'Bearer ' + accessToken)
            .field('name', 'test_etag_fly.svg')
            .field('global', 'true')
            .attach('image', 'test/fly.svg');
        expect(resp.status).toBe(201);

        resp = await request(app).get('/api/imagefiles/test_etag_fly.svg');

        expect(resp.status).toBe(200);
        expect(resp.headers.etag).toBeDefined();

        const etag = resp.headers.etag;
        resp = await request(app)
            .get('/api/imagefiles/test_etag_fly.svg')
            .set('if-none-match', etag);
        expect(resp.status).toBe(304);
    });
});

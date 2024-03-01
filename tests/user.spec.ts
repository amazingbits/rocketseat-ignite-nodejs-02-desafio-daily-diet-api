import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { execSync } from 'node:child_process';
import request from 'supertest';
import { app } from '../src/app';

const user = {
	name: 'Guilherme Andrade',
	email: 'guilhermeandrade@gmail.com',
	password: '12345678',
};

const userToEdit = {
	name: 'Guilherme Andrade editted',
	email: 'editted.guilhermeandrade@gmail.com',
};

const anotherUser = {
	name: 'Carlos Oliveira',
	email: 'carlosoliveira@gmail.com',
	password: '12345678',
};

const userWithWrongEmail = {
	name: 'Guilherme Andrade',
	email: 'guilhermeandrade@gmail',
	password: '12345678',
};

const userWithWrongPassword = {
	name: 'Guilherme Andrade',
	email: 'guilhermeandrade@gmail.com',
	password: '123',
};

describe('user tests', () => {
	beforeAll(async () => {
		app.ready();
	});

	afterAll(async () => {
		app.close();
	});

	beforeEach(async () => {
		execSync('pnpm run knex migrate:rollback --all');
		execSync('pnpm run knex migrate:latest');
	});

	it('should be able to add a new user', async () => {
		await request(app.server).post('/user/create').send(user).expect(201);
	});

	it('you may not add an user with same email', async () => {
		await request(app.server).post('/user/create').send(user);

		await request(app.server).post('/user/create').send(user).expect(400);
	});

	it('you may not add an user with invalid email', async () => {
		await request(app.server).post('/user/create').send(userWithWrongEmail).expect(500);
	});

	it('you may not add an user with invalid password', async () => {
		await request(app.server).post('/user/create').send(userWithWrongPassword).expect(500);
	});

	it('should be able to edit an existing user', async () => {
		await request(app.server).post('/user/create').send(user);

		const createdUser = await request(app.server).get('/user');

		const userId = createdUser.body[0].id;

		await request(app.server).put(`/user/update/${userId}`).send(userToEdit);

		const edittedUser = await request(app.server).get(`/user/${userId}`);

		expect(edittedUser.body.name.includes('editted')).toBe(true);
		expect(edittedUser.body.email.includes('editted')).toBe(true);
	});

	it('should be abe to get an user by its id', async () => {
		await request(app.server).post('/user/create').send(user);

		const createdUser = await request(app.server).get('/user');

		const userId = createdUser.body[0].id;

		await request(app.server).get(`/user/${userId}`).expect(200);
	});

	it('a cookie with user id needs to be saved at login', async () => {
		await request(app.server).post('/user/create').send(user);

		const createdUser = await request(app.server).get('/user');

		const userId = createdUser.body[0].id;

		const signIn = await request(app.server)
			.post('/user/sign-in')
			.send({
				email: user.email,
				password: '12345678',
			})
			.expect(200);

		const cookies = signIn.get('Set-Cookie');

		expect(cookies.length > 0).toBe(true);

		expect(cookies[0].includes(userId)).toBe(true);
	});

	it('a cookie with user id needs to be deleted at logout', async () => {
		await request(app.server).post('/user/create').send(user);

		const createdUser = await request(app.server).get('/user');

		const userId = createdUser.body[0].id;

		const signOut = await request(app.server).get('/user/sign-out');

		const cookies = signOut.get('Set-Cookie');

		if (cookies.length > 0) {
			expect(cookies[0].includes(userId)).toBe(false);
		}
	});
});

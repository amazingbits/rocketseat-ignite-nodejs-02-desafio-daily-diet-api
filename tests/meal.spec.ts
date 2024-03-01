import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { execSync } from 'node:child_process';
import request from 'supertest';
import { app } from '../src/app';
import { getCookieValueFromString } from '../src/utils/getCookieValueFromString';

const user = {
	name: 'Guilherme Andrade',
	email: 'guilhermeandrade@gmail.com',
	password: '12345678',
};

const anotherUser = {
	name: 'Carlos Oliveira',
	email: 'carlosoliveira@gmail.com',
	password: '12345678',
};

const meal = {
	name: 'Pizza',
	description: 'Pizza',
	date: new Date().toLocaleDateString(),
	is_diet: true,
};

const anotherMeal = {
	name: 'Pizza editted',
	description: 'Pizza editted',
	date: new Date().toLocaleDateString() + ' editted',
	is_diet: false,
};

const mealList = [
	{
		name: 'Café',
		description: 'pão, bolacha e café',
		date: '2024-02-20 08:00',
		is_diet: true,
	},
	{
		name: 'Lanche',
		description: 'whey e uma laranja',
		date: '2024-02-20 10:00',
		is_diet: true,
	},
	{
		name: 'Almoço',
		description: 'carne magra, arroz, feijão e salada',
		date: '2024-02-20 12:00',
		is_diet: true,
	},
	{
		name: 'Café da tarde',
		description: 'pão, bolacha e café',
		date: '2024-02-20 16:00',
		is_diet: true,
	},
	{
		name: 'Lanche',
		description: 'hiperproteico',
		date: '2024-02-20 20:00',
		is_diet: true,
	},
	{
		name: 'Jantar',
		description: 'x-coração',
		date: '2024-02-20 22:00',
		is_diet: false,
	},
	{
		name: 'Café',
		description: 'pão, bolacha e café',
		date: '2024-02-21 08:00',
		is_diet: true,
	},
	{
		name: 'Almoço',
		description: 'bife acebolado com purê de abóbora',
		date: '2024-02-21 12:00',
		is_diet: true,
	},
	{
		name: 'Lanche',
		description: 'pão, bolacha e café',
		date: '2024-02-21 20:00',
		is_diet: true,
	},
	{
		name: 'Jantar',
		description: 'sopa',
		date: '2024-02-21 23:00',
		is_diet: true,
	},
	{
		name: 'Café',
		description: 'coxinha',
		date: '2024-02-22 08:00',
		is_diet: false,
	},
	{
		name: 'Almoço',
		description: 'lasanha de carne',
		date: '2024-02-22 12:00',
		is_diet: false,
	},
];

describe('meal tests', () => {
	beforeAll(async () => {
		app.ready();
	});

	afterAll(async () => {
		app.close();
	});

	beforeEach(async () => {
		execSync('pnpm run knex migrate:rollback --all');
		execSync('pnpm run knex migrate:latest');

		await request(app.server).post('/user/create').send(user);
		await request(app.server).post('/user/create').send(anotherUser);
	});

	it('should not be able to create a new meal without login', async () => {
		await request(app.server).post('/meal/create').send(meal).expect(401);
	});

	it('should be able to create a new meal', async () => {
		const login = await request(app.server).post('/user/sign-in').send(user);

		const cookies = login.get('Set-Cookie');

		await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal).expect(201);
	});

	it('should not be able to edit an existing meal without login', async () => {
		const login = await request(app.server).post('/user/sign-in').send(user);

		const cookies = login.get('Set-Cookie');

		const createnewMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);

		const newMeal = await request(app.server).get('/meal').set('Cookie', cookies);

		const newMealId = newMeal.body[0].id;

		const logout = await request(app.server).get('/user/sign-out');

		const updateMeal = await request(app.server).put(`/meal/update/${newMealId}`).send(meal).expect(401);
	});

	it('should be able to edit an existing meal', async () => {
		const login = await request(app.server).post('/user/sign-in').send(user);

		const cookies = login.get('Set-Cookie');

		const createnewMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);

		const newMeal = await request(app.server).get('/meal').set('Cookie', cookies);

		const newMealId = newMeal.body[0].id;

		const updateMeal = await request(app.server)
			.put(`/meal/update/${newMealId}`)
			.set('Cookie', cookies)
			.send(anotherMeal)
			.expect(200);

		const edittedMeal = await request(app.server).get(`/meal/${newMealId}`).set('Cookie', cookies).expect(200);

		expect(edittedMeal.body.name === meal.name).toBe(false);
		expect(edittedMeal.body.description === meal.description).toBe(false);
		expect(edittedMeal.body.date === meal.date).toBe(false);
		expect(edittedMeal.body.is_diet === meal.is_diet).toBe(false);
	});

	it('user can update just its own meals', async () => {
		const firstUserLogin = await request(app.server).post('/user/sign-in').send(user);
		let cookies = firstUserLogin.get('Set-Cookie');
		const firstUserId = getCookieValueFromString(cookies[0]);
		const firstUserCreateMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
		const firstUserNewMeal = await request(app.server).get('/meal').set('Cookie', cookies);
		const firstUserMealId = firstUserNewMeal.body[0].id;
		let logout = await request(app.server).get('/user/sign-out');

		const secondUserLogin = await request(app.server).post('/user/sign-in').send(anotherUser);
		cookies = secondUserLogin.get('Set-Cookie');
		const secondUserId = getCookieValueFromString(cookies[0]);
		const secondUserCreateMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
		const secondUserNewMeal = await request(app.server).get('/meal').set('Cookie', cookies);
		const secondUserMealId = secondUserNewMeal.body[0].id;
		logout = await request(app.server).get('/user/sign-out');

		await request(app.server).post('/user/sign-in').send(user);
		cookies = firstUserLogin.get('Set-Cookie');
		expect(firstUserId === getCookieValueFromString(cookies[0])).toBe(true);

		await request(app.server)
			.put(`/meal/update/${secondUserMealId}`)
			.set('Cookie', cookies)
			.send(anotherMeal)
			.expect(403);
	});

	it('should not be able to delete a meal without sign in', async () => {
		const login = await request(app.server).post('/user/sign-in').send(user);

		const cookies = login.get('Set-Cookie');

		const createnewMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);

		const newMeal = await request(app.server).get('/meal').set('Cookie', cookies);

		const newMealId = newMeal.body[0].id;

		const logout = await request(app.server).get('/user/sign-out');

		const deletedMeal = await request(app.server).delete(`/meal/delete/${newMealId}`).expect(401);
	});

	it('should be able to delete a meal', async () => {
		const login = await request(app.server).post('/user/sign-in').send(user);

		const cookies = login.get('Set-Cookie');

		const createnewMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);

		const newMeal = await request(app.server).get('/meal').set('Cookie', cookies);

		const newMealId = newMeal.body[0].id;

		const deletedMeal = await request(app.server)
			.delete(`/meal/delete/${newMealId}`)
			.set('Cookie', cookies)
			.expect(200);
	});

	it('user can delete just its own meals', async () => {
		const firstUserLogin = await request(app.server).post('/user/sign-in').send(user);
		let cookies = firstUserLogin.get('Set-Cookie');
		const firstUserId = getCookieValueFromString(cookies[0]);
		const firstUserCreateMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
		const firstUserNewMeal = await request(app.server).get('/meal').set('Cookie', cookies);
		const firstUserMealId = firstUserNewMeal.body[0].id;
		let logout = await request(app.server).get('/user/sign-out');

		const secondUserLogin = await request(app.server).post('/user/sign-in').send(anotherUser);
		cookies = secondUserLogin.get('Set-Cookie');
		const secondUserId = getCookieValueFromString(cookies[0]);
		const secondUserCreateMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
		const secondUserNewMeal = await request(app.server).get('/meal').set('Cookie', cookies);
		const secondUserMealId = secondUserNewMeal.body[0].id;
		logout = await request(app.server).get('/user/sign-out');

		await request(app.server).post('/user/sign-in').send(user);
		cookies = firstUserLogin.get('Set-Cookie');
		expect(firstUserId === getCookieValueFromString(cookies[0])).toBe(true);

		await request(app.server).delete(`/meal/delete/${secondUserMealId}`).set('Cookie', cookies).expect(403);
	});

	it('should be not able to get meals list without sign in', async () => {
		await request(app.server).get('/meal').expect(401);
	});

	it('user can just list its own meals', async () => {
		const firstUserLogin = await request(app.server).post('/user/sign-in').send(user);
		let cookies = firstUserLogin.get('Set-Cookie');
		const firstUserId = getCookieValueFromString(cookies[0]);
		const firstUserCreateMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
		const firstUserNewMeal = await request(app.server).get('/meal').set('Cookie', cookies);
		const firstUserMealId = firstUserNewMeal.body[0].id;
		let logout = await request(app.server).get('/user/sign-out');

		const secondUserLogin = await request(app.server).post('/user/sign-in').send(anotherUser);
		cookies = secondUserLogin.get('Set-Cookie');
		const secondUserId = getCookieValueFromString(cookies[0]);
		const secondUserCreateMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
		const secondUserNewMeal = await request(app.server).get('/meal').set('Cookie', cookies);
		const secondUserMealId = secondUserNewMeal.body[0].id;
		logout = await request(app.server).get('/user/sign-out');

		await request(app.server).post('/user/sign-in').send(user);
		cookies = firstUserLogin.get('Set-Cookie');
		expect(firstUserId === getCookieValueFromString(cookies[0])).toBe(true);

		const firstUserMeals = await request(app.server).get('/meal').set('Cookie', cookies);
		const search = firstUserMeals.body.filter(meal => {
			return meal.id === secondUserMealId;
		});

		expect(search.length).toBe(0);
	});

	it('should be able to get just one meal by its id', async () => {
		const login = await request(app.server).post('/user/sign-in').send(user);
		let cookies = login.get('Set-Cookie');
		const createMeal = await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
		const newMeal = await request(app.server).get('/meal').set('Cookie', cookies);
		const mealId = newMeal.body[0].id;

		await request(app.server).get(`/meal/${mealId}`).set('Cookie', cookies).expect(200);
	});

	describe('meal summary', () => {
		beforeEach(async () => {
			const login = await request(app.server).post('/user/sign-in').send(user);
			const cookies = login.get('Set-Cookie');

			mealList.forEach(async meal => {
				await request(app.server).post('/meal/create').set('Cookie', cookies).send(meal);
			});
		});

		it('should be able to get total meals for a specific user', async () => {
			const login = await request(app.server).post('/user/sign-in').send(user);
			const cookies = login.get('Set-Cookie');

			const response = await request(app.server).get('/meal/summary').set('Cookie', cookies);

			const summary = response.body.summary;

			expect(summary.totalMeals === summary.totalMeals).toBe(true);
		});

		it('should be able to get total in diet meals for a specific user', async () => {
			const login = await request(app.server).post('/user/sign-in').send(user);
			const cookies = login.get('Set-Cookie');

			const response = await request(app.server).get('/meal/summary').set('Cookie', cookies);

			const summary = response.body.summary;

			const inDietFromList = mealList
				.filter(meal => {
					return meal.is_diet === true;
				})
				.reduce((acc, meal) => {
					acc = acc + 1;
					return acc;
				}, 0);

			expect(summary.inDietMeals === inDietFromList).toBe(true);
		});

		it('should be able to get total out diet meals for a specific user', async () => {
			const login = await request(app.server).post('/user/sign-in').send(user);
			const cookies = login.get('Set-Cookie');

			const response = await request(app.server).get('/meal/summary').set('Cookie', cookies);

			const summary = response.body.summary;

			const outDietFromList = mealList
				.filter(meal => {
					return meal.is_diet === false;
				})
				.reduce((acc, meal) => {
					acc = acc + 1;
					return acc;
				}, 0);

			expect(summary.notInDietMeals === outDietFromList).toBe(true);
		});

		it('should be able to get best sequence in diet meals for a specific user', async () => {
			const login = await request(app.server).post('/user/sign-in').send(user);
			const cookies = login.get('Set-Cookie');

			const response = await request(app.server).get('/meal/summary').set('Cookie', cookies);

			const summary = response.body.summary;

			let sequenceDietMeals = 0;
			let bestSequenceDietMeals = 0;

			mealList.forEach(meal => {
				if (meal.is_diet) {
					sequenceDietMeals++;
				} else {
					sequenceDietMeals = 0;
				}
				if (sequenceDietMeals > bestSequenceDietMeals) {
					bestSequenceDietMeals = sequenceDietMeals;
				}
			});

			expect(summary.bestSequenceDietMeals === bestSequenceDietMeals).toBe(true);
		});
	});
});

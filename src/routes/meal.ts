import { randomUUID as uuid } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { knex } from '../database';
import { z } from 'zod';
import { checkIfUserSignedIn } from '../middlewares/checkIfUserSignedIn';

export async function mealRoutes(app: FastifyInstance) {
	app.get('/', { preHandler: [checkIfUserSignedIn] }, async (request, reply) => {
		const { sessionUser: userId } = request.cookies;

		const meals = await knex('meals').where({ user_id: userId }).select('*').orderBy('date', 'asc');

		return meals;
	});

	app.get('/:id', { preHandler: [checkIfUserSignedIn] }, async (request, reply) => {
		const { sessionUser: userId } = request.cookies;

		const findMealSchema = z.object({
			id: z.string().uuid(),
		});

		const { id } = findMealSchema.parse(request.params);

		const meal = await knex('meals').where({ id }).first();

		if (!meal) {
			return reply.status(404).send({ error: 'Meal not found' });
		}

		if (meal.user_id !== userId) {
			return reply.status(403).send({ error: 'You just can see your own meals' });
		}

		return meal;
	});

	app.post('/create', { preHandler: [checkIfUserSignedIn] }, async (request, reply) => {
		const { sessionUser: userId } = request.cookies;

		const createMealSchema = z.object({
			name: z.string().min(1),
			description: z.string().min(1),
			date: z.string(),
			is_diet: z.boolean(),
		});

		const { name, description, date, is_diet } = createMealSchema.parse(request.body);

		const user = {
			id: uuid(),
			name,
			description,
			date,
			is_diet,
			user_id: userId,
		};

		await knex('meals').insert(user);

		return reply.status(201).send();
	});

	app.put('/update/:id', { preHandler: [checkIfUserSignedIn] }, async (request, reply) => {
		const { sessionUser: userId } = request.cookies;

		const updateMealSchema = z.object({
			name: z.string().min(1),
			description: z.string().min(1),
			date: z.string(),
			is_diet: z.boolean(),
		});

		const { name, description, date, is_diet } = updateMealSchema.parse(request.body);

		const mealIdSchema = z.object({
			id: z.string().uuid(),
		});

		const { id } = mealIdSchema.parse(request.params);

		const meal = await knex('meals').where({ id }).first();

		if (!meal) {
			return reply.status(404).send({ error: 'Meal not found' });
		}

		if (meal.user_id !== userId) {
			return reply.status(403).send({ error: 'You just can update your own meals' });
		}

		await knex('meals').where({ id }).update({ name, description, date, is_diet });

		reply.send();
	});

	app.delete('/delete/:id', { preHandler: [checkIfUserSignedIn] }, async (request, reply) => {
		const { sessionUser: userId } = request.cookies;

		const mealIdSchema = z.object({
			id: z.string().uuid(),
		});

		const { id } = mealIdSchema.parse(request.params);

		const meal = await knex('meals').where({ id }).first();

		if (!meal) {
			return reply.status(404).send({ error: 'Meal not found' });
		}

		if (meal.user_id !== userId) {
			return reply.status(403).send({ error: 'You just can delete your own meals' });
		}

		await knex('meals').where({ id }).del();

		reply.send();
	});

	app.get('/summary', { preHandler: [checkIfUserSignedIn] }, async (request, reply) => {
		const { sessionUser: userId } = request.cookies;

		const meals = await knex('meals').where({ user_id: userId }).select('*').orderBy('date', 'asc');

		const totalMeals = meals.length;

		let inDietMeals = 0;
		let notInDietMeals = 0;
		let sequenceDietMeals = 0;
		let bestSequenceDietMeals = 0;

		meals.forEach(meal => {
			if (meal.is_diet) {
				inDietMeals++;
				sequenceDietMeals++;
			} else {
				notInDietMeals++;
				sequenceDietMeals = 0;
			}
			if (sequenceDietMeals > bestSequenceDietMeals) {
				bestSequenceDietMeals = sequenceDietMeals;
			}
		});

		return {
			summary: {
				totalMeals,
				inDietMeals,
				notInDietMeals,
				bestSequenceDietMeals,
			},
		};
	});
}

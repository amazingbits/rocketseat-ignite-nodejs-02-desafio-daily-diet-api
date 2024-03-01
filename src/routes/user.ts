import { randomUUID as uuid } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { knex } from '../database';
import { z } from 'zod';
import { hash } from '../utils/createHash';

export async function userRoutes(app: FastifyInstance) {
	app.get('/', async (_request, _reply) => {
		const users = await knex('users').select('*');

		return users;
	});

	app.get('/:id', async (request, reply) => {
		const getUserSchema = z.object({
			id: z.string().uuid(),
		});

		const { id } = getUserSchema.parse(request.params);

		const user = await knex('users').where('id', id).first();

		if (!user) {
			return reply.status(404).send({ error: 'User not found' });
		}

		return { id, name: user.name, email: user.email };
	});

	app.post('/create', async (request, reply) => {
		const createUserSchema = z.object({
			name: z.string(),
			email: z.string().email(),
			password: z.string().min(8),
		});

		const { name, email, password } = createUserSchema.parse(request.body);

		const emailAlreadyExists = await knex('users').where('email', email).first();

		if (emailAlreadyExists) {
			return reply.status(400).send({ error: 'Email already exists' });
		}

		await knex('users').insert({ id: uuid(), name, email, password: hash(password) });

		return reply.status(201).send();
	});

	app.put('/update/:id', async (request, reply) => {
		const updateUserSchema = z.object({
			name: z.string(),
			email: z.string().email(),
		});

		const { name, email } = updateUserSchema.parse(request.body);

		const getUserSchema = z.object({
			id: z.string().uuid(),
		});

		const { id } = getUserSchema.parse(request.params);

		const user = await knex('users').where('id', id).first();

		if (!user) {
			return reply.status(404).send({ error: 'User not found' });
		}

		await knex('users').where('id', id).update({ name, email });

		return reply.status(200).send();
	});

	app.patch('/change-password/:id', async (request, reply) => {
		const updateUserSchema = z.object({
			password: z.string().min(8),
		});

		const { password } = updateUserSchema.parse(request.body);

		const getUserSchema = z.object({
			id: z.string().uuid(),
		});

		const { id } = getUserSchema.parse(request.params);

		const user = await knex('users').where('id', id).first();

		if (!user) {
			return reply.status(404).send({ error: 'User not found' });
		}

		await knex('users')
			.where('id', id)
			.update({ password: hash(password) });

		return reply.status(200).send();
	});

	app.post('/sign-in', async (request, reply) => {
		const signInSchema = z.object({
			email: z.string().email(),
			password: z.string().min(8),
		});

		const { email, password } = signInSchema.parse(request.body);

		const user = await knex('users')
			.where({ email, password: hash(password) })
			.first();

		if (!user) {
			return reply.status(404).send({ error: 'User email or password is wrong' });
		}

		let { sessionUser } = request.cookies;

		if (!sessionUser) {
			sessionUser = user.id;
			reply.setCookie('sessionUser', sessionUser as string, {
				path: '/',
				maxAge: 60 * 60 * 24 * 7, // 7 days
			});
		}

		reply.send({ message: 'Login successfully' });
	});

	app.get('/sign-out', async (_request, reply) => {
		reply.clearCookie('sessionUser');

		reply.send({ message: 'Logout successfully' });
	});
}

import { FastifyRequest, FastifyReply } from 'fastify';

export async function checkIfUserSignedIn(request: FastifyRequest, reply: FastifyReply) {
	const { sessionUser } = request.cookies;

	if (!sessionUser) {
		return reply.status(401).send({
			error: 'You must be logged in',
		});
	}
}

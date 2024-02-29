import { env } from './env';
import { app } from './app';

app
	.listen({
		port: env.PORT,
	})
	.then(() => {
		console.log(`Server running on port ${env.PORT}`);
	})
	.catch(err => {
		console.error(err);
	});

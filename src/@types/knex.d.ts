import { Knex } from 'knex';

declare module 'knex/types/tables' {
	export type Tables = {
		users: {
			id: string;
			name: string;
			email: string;
			password: string;
		};
	};
}

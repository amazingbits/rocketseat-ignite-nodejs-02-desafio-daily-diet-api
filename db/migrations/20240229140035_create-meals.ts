import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('meals', table => {
		table.uuid('id').primary();
		table.string('name').notNullable();
		table.string('description').notNullable();
		table.string('date').notNullable();
		table.boolean('is_diet').notNullable();
		table.uuid('user_id');
		table.foreign('user_id').references('users.id');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('meals');
}

import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	listCategories, 
	createCategory, 
	updateCategory, 
	deleteCategory,
	UniqueConstraintError,
	ForeignKeyInUseError
} from '$lib/server/category';

export const load: PageServerLoad = async () => {
	try {
		const categories = await listCategories();
		
		return {
			categories
		};
	} catch (error) {
		console.error('Error loading categories:', error);
		return {
			categories: []
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const data = await request.formData();
			const name = data.get('name') as string;
			const description = data.get('description') as string;

			// Validasi input
			if (!name) {
				return fail(400, {
					message: 'Category name is required'
				});
			}

			// Buat category baru
			await createCategory({
				name,
				description: description || undefined
			});

			return { success: true };
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return fail(400, {
					message: error.message
				});
			}
			console.error('Error creating category:', error);
			return fail(500, {
				message: 'Failed to create category'
			});
		}
	},

	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;
			const name = data.get('name') as string;
			const description = data.get('description') as string;

			// Validasi input
			if (!id || !name) {
				return fail(400, {
					message: 'ID and category name are required'
				});
			}

			// Update category
			await updateCategory(id, {
				name,
				description: description || undefined
			});

			return { success: true };
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return fail(400, {
					message: error.message
				});
			}
			console.error('Error updating category:', error);
			return fail(500, {
				message: 'Failed to update category'
			});
		}
	},

	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			if (!id) {
				return fail(400, {
					message: 'Category ID is required'
				});
			}

			await deleteCategory(id);

			return { success: true };
		} catch (error) {
			if (error instanceof ForeignKeyInUseError) {
				return fail(400, {
					message: error.message
				});
			}
			console.error('Error deleting category:', error);
			return fail(500, {
				message: 'Failed to delete category'
			});
		}
	}
};
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	listAssets, 
	createAsset, 
	updateAsset, 
	deleteAsset,
	UniqueConstraintError
} from '$lib/server/asset';
import { listCategories } from '$lib/server/category';
import { listLocations } from '$lib/server/location';

export const load: PageServerLoad = async () => {
	try {
		const { rows: assets } = await listAssets();
		const categories = await listCategories();
		const locations = await listLocations();
		
		return {
			assets,
			categories,
			locations
		};
	} catch (error) {
		console.error('Error loading assets:', error);
		return {
			assets: [],
			categories: [],
			locations: []
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const data = await request.formData();
			const code = data.get('code') as string;
			const name = data.get('name') as string;
			const categoryId = data.get('categoryId') as string;
			const locationId = data.get('locationId') as string;
			const status = data.get('status') as string;
			const serialNo = data.get('serialNo') as string;
			const notes = data.get('notes') as string;

			// Validasi input
			if (!code || !name) {
				return fail(400, {
					message: 'Code and name are required'
				});
			}

			// Buat asset baru
			await createAsset({
				code,
				name,
				categoryId: categoryId || null,
				locationId: locationId || null,
				status: (status as any) || 'active',
				serialNo: serialNo || null,
				notes: notes || null
			});

			return { success: true };
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return fail(400, {
					message: error.message
				});
			}
			console.error('Error creating asset:', error);
			return fail(500, {
				message: 'Failed to create asset'
			});
		}
	},

	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;
			const code = data.get('code') as string;
			const name = data.get('name') as string;
			const categoryId = data.get('categoryId') as string;
			const locationId = data.get('locationId') as string;
			const status = data.get('status') as string;
			const serialNo = data.get('serialNo') as string;
			const notes = data.get('notes') as string;

			// Validasi input
			if (!id || !code || !name) {
				return fail(400, {
					message: 'ID, code, and name are required'
				});
			}

			// Update asset
			const updateData: any = {
				code,
				name,
				categoryId: categoryId || null,
				locationId: locationId || null,
				status: (status as any) || 'active',
				serialNo: serialNo || null,
				notes: notes || null
			};

			const updatedAsset = await updateAsset(id, updateData);
			if (!updatedAsset) {
				return fail(404, {
					message: 'Asset not found'
				});
			}

			return { success: true };
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return fail(400, {
					message: error.message
				});
			}
			console.error('Error updating asset:', error);
			return fail(500, {
				message: 'Failed to update asset'
			});
		}
	},

	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			if (!id) {
				return fail(400, {
					message: 'Asset ID is required'
				});
			}

			await deleteAsset(id);

			return { success: true };
		} catch (error) {
			console.error('Error deleting asset:', error);
			return fail(500, {
				message: 'Failed to delete asset'
			});
		}
	}
};
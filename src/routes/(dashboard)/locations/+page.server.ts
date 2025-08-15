import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	listLocations, 
	createLocation, 
	updateLocation, 
	deleteLocation 
} from '$lib/server/location';

export const load: PageServerLoad = async () => {
	try {
		const locations = await listLocations();
		
		return {
			locations
		};
	} catch (error) {
		console.error('Error loading locations:', error);
		return {
			locations: []
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const data = await request.formData();
			const name = data.get('name') as string;
			const parentId = data.get('parentId') as string;
			const notes = data.get('notes') as string;

			// Validasi input
			if (!name) {
				return fail(400, {
					message: 'Location name is required'
				});
			}

			// Buat location baru
			await createLocation({
				name,
				parentId: parentId || undefined,
				notes: notes || undefined
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating location:', error);
			if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
				return fail(400, {
					message: 'Location name already exists'
				});
			}
			return fail(500, {
				message: 'Failed to create location'
			});
		}
	},

	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;
			const name = data.get('name') as string;
			const parentId = data.get('parentId') as string;
			const notes = data.get('notes') as string;

			// Validasi input
			if (!id || !name) {
				return fail(400, {
					message: 'ID and location name are required'
				});
			}

			// Update location
			const updateData: any = {
				name,
				parentId: parentId || undefined,
				notes: notes || undefined
			};

			const updatedLocation = await updateLocation(id, updateData);
			if (!updatedLocation) {
				return fail(404, {
					message: 'Location not found'
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating location:', error);
			if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
				return fail(400, {
					message: 'Location name already exists'
				});
			}
			return fail(500, {
				message: 'Failed to update location'
			});
		}
	},

	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			if (!id) {
				return fail(400, {
					message: 'Location ID is required'
				});
			}

			await deleteLocation(id);

			return { success: true };
		} catch (error) {
			console.error('Error deleting location:', error);
			if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
				return fail(400, {
					message: 'Cannot delete location that is being used by assets or other locations'
				});
			}
			return fail(500, {
				message: 'Failed to delete location'
			});
		}
	}
};
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	checkout, 
	returnAssignment, 
	listAssignments,
	AssetAlreadyAssignedError
} from '$lib/server/assignment';

export const load: PageServerLoad = async () => {
	try {
		const result = await listAssignments();
		
		// Transform data untuk UI
		const transformedAssignments = result.rows.map(assignment => ({
			...assignment,
			status: assignment.returnedAt ? 'Returned' : 'Active',
			isOverdue: assignment.dueAt && !assignment.returnedAt && new Date(assignment.dueAt) < new Date()
		}));
		
		return {
			assignments: transformedAssignments,
			total: result.total
		};
	} catch (error) {
		console.error('Error loading assignments:', error);
		return {
			assignments: [],
			total: 0
		};
	}
};

export const actions: Actions = {
	checkout: async ({ request }) => {
		try {
			const data = await request.formData();
			const assetId = data.get('assetId') as string;
			const userId = data.get('userId') as string;
			const dueAt = data.get('dueAt') as string;
			const conditionOut = data.get('conditionOut') as string;
			const notes = data.get('notes') as string;

			// Validasi input
			if (!assetId || !userId) {
				return fail(400, {
					message: 'Asset ID and User ID are required'
				});
			}

			// Checkout asset
			await checkout({
				assetId,
				userId,
				dueAt: dueAt ? Math.floor(new Date(dueAt).getTime() / 1000) : undefined,
				conditionOut: conditionOut || undefined,
				notes: notes || undefined
			});

			return { success: true };
		} catch (error) {
			if (error instanceof AssetAlreadyAssignedError) {
				return fail(400, {
					message: error.message
				});
			}
			console.error('Error checking out asset:', error);
			return fail(500, {
				message: 'Failed to checkout asset'
			});
		}
	},

	return: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;
			const conditionIn = data.get('conditionIn') as string;
			const notes = data.get('notes') as string;

			// Validasi input
			if (!id) {
				return fail(400, {
					message: 'Assignment ID is required'
				});
			}

			// Return assignment
			await returnAssignment(id, {
				conditionIn: conditionIn || undefined,
				notes: notes || undefined
			});

			return { success: true };
		} catch (error) {
			console.error('Error returning assignment:', error);
			return fail(500, {
				message: 'Failed to return assignment'
			});
		}
	},

	// Note: Assignment deletion is typically not allowed for audit purposes
	// If needed, implement soft delete or archive functionality
};
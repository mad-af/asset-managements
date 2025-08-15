import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	listAudits, 
	createAudit, 
	startAudit, 
	finalizeAudit 
} from '$lib/server/audit';

export const load: PageServerLoad = async () => {
	try {
		const audits = await listAudits();
		
		// Transform data untuk UI
		const transformedAudits = audits.map(audit => ({
			...audit,
			statusDisplay: audit.status.charAt(0).toUpperCase() + audit.status.slice(1).replace('_', ' '),
			progress: audit.status === 'draft' ? 0 : audit.status === 'in_progress' ? 50 : 100
		}));
		
		return {
			audits: transformedAudits,
			total: audits.length
		};
	} catch (error) {
		console.error('Error loading audits:', error);
		return {
			audits: [],
			total: 0
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const data = await request.formData();
			const title = data.get('title') as string;
			const locationId = data.get('locationId') as string;
			const notes = data.get('notes') as string;

			// Validasi input
			if (!title) {
				return fail(400, {
					message: 'Title is required'
				});
			}

			// Buat audit baru
			await createAudit({
				title,
				locationId: locationId || undefined,
				notes: notes || undefined
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating audit:', error);
			return fail(500, {
				message: 'Failed to create audit'
			});
		}
	},

	start: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			// Validasi input
			if (!id) {
				return fail(400, {
					message: 'Audit ID is required'
				});
			}

			// Start audit
			await startAudit(id);

			return { success: true };
		} catch (error) {
			console.error('Error starting audit:', error);
			return fail(500, {
				message: 'Failed to start audit'
			});
		}
	},

	finalize: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			if (!id) {
				return fail(400, {
					message: 'Audit ID is required'
				});
			}

			// Finalize audit
			await finalizeAudit(id);

			return { success: true };
		} catch (error) {
			console.error('Error finalizing audit:', error);
			return fail(500, {
				message: 'Failed to finalize audit'
			});
		}
	}
};
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	openTicket, 
	updateTicket, 
	listTickets 
} from '$lib/server/maintenance';

export const load: PageServerLoad = async () => {
	try {
		const result = await listTickets();
		
		// Transform data untuk UI
		const transformedTickets = result.rows.map(ticket => ({
			...ticket,
			statusDisplay: ticket.status === 'open' ? 'Open' : 
							 ticket.status === 'in_progress' ? 'In Progress' : 
							 ticket.status === 'done' ? 'Done' : 'Canceled',
			costDisplay: ticket.costCents ? `$${(ticket.costCents / 100).toFixed(2)}` : '$0.00',
			durationDays: ticket.closedAt && ticket.openedAt ? 
				Math.ceil((ticket.closedAt.getTime() - ticket.openedAt.getTime()) / (1000 * 60 * 60 * 24)) : null
		}));
		
		return {
			tickets: transformedTickets,
			total: result.total
		};
	} catch (error) {
		console.error('Error loading maintenance tickets:', error);
		return {
			tickets: [],
			total: 0
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const data = await request.formData();
			const assetId = data.get('assetId') as string;
			const title = data.get('title') as string;
			const description = data.get('description') as string;
			const costCents = data.get('costCents') as string;

			// Validasi input
			if (!assetId || !title) {
				return fail(400, {
					message: 'Asset ID and title are required'
				});
			}

			// Buat maintenance ticket baru
			await openTicket({
				assetId,
				title,
				description: description || undefined,
				costCents: costCents ? parseInt(costCents) : 0
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating maintenance ticket:', error);
			return fail(500, {
				message: 'Failed to create maintenance ticket'
			});
		}
	},

	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;
			const title = data.get('title') as string;
			const description = data.get('description') as string;
			const status = data.get('status') as string;
			const costCents = data.get('costCents') as string;

			// Validasi input
			if (!id) {
				return fail(400, {
					message: 'Ticket ID is required'
				});
			}

			// Update maintenance ticket
			const updateData: any = {};
			if (title) updateData.title = title;
			if (description) updateData.description = description;
			if (status) updateData.status = status;
			if (costCents) updateData.costCents = parseInt(costCents);

			const updatedTicket = await updateTicket(id, updateData);
			if (!updatedTicket) {
				return fail(404, {
					message: 'Maintenance ticket not found'
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating maintenance ticket:', error);
			return fail(500, {
				message: 'Failed to update maintenance ticket'
			});
		}
	},

	close: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			if (!id) {
				return fail(400, {
					message: 'Ticket ID is required'
				});
			}

			// Close maintenance ticket by setting status to 'done'
			const updatedTicket = await updateTicket(id, { status: 'done' });
			if (!updatedTicket) {
				return fail(404, {
					message: 'Maintenance ticket not found'
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error closing maintenance ticket:', error);
			return fail(500, {
				message: 'Failed to close maintenance ticket'
			});
		}
	}
};
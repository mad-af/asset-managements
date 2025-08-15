import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { 
	getAllUsers, 
	createUser, 
	updateUser, 
	deleteUser, 
	isEmailTaken 
} from '$lib/server/user';

export const load: PageServerLoad = async () => {
	try {
		const users = await getAllUsers();
		
		// Transform data untuk UI
		const transformedUsers = users.map(user => ({
			...user,
			name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name',
			status: 'Active' // Default status
		}));
		
		return {
			users: transformedUsers
		};
	} catch (error) {
		console.error('Error loading users:', error);
		return {
			users: []
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const data = await request.formData();
			const firstName = data.get('firstName') as string;
			const lastName = data.get('lastName') as string;
			const email = data.get('email') as string;
			const position = data.get('position') as string;
			const biography = data.get('biography') as string;

			// Validasi input
			if (!firstName || !lastName || !email) {
				console.log(123)
				return fail(400, {
					message: 'First name, last name, email, and password are required'
				});
			}

			// Cek apakah email sudah digunakan
			if (await isEmailTaken(email)) {
				return fail(400, {
					message: 'Email is already taken'
				});
			}

			// Buat user baru
			await createUser({
				firstName,
				lastName,
				email,
				position: position || undefined,
				biography: biography || undefined
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating user:', error);
			return fail(500, {
				message: 'Failed to create user'
			});
		}
	},

	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;
			const firstName = data.get('firstName') as string;
			const lastName = data.get('lastName') as string;
			const email = data.get('email') as string;
			const position = data.get('position') as string;
			const biography = data.get('biography') as string;

			// Validasi input
			if (!id || !firstName || !lastName || !email) {
				return fail(400, {
					message: 'ID, first name, last name, and email are required'
				});
			}

			// Cek apakah email sudah digunakan oleh user lain
			if (await isEmailTaken(email, id)) {
				return fail(400, {
					message: 'Email is already taken by another user'
				});
			}

			// Update user
			const updateData: any = {
				firstName,
				lastName,
				email,
				position: position || undefined,
				biography: biography || undefined
			};

			const updatedUser = await updateUser(id, updateData);
			if (!updatedUser) {
				return fail(404, {
					message: 'User not found'
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating user:', error);
			return fail(500, {
				message: 'Failed to update user'
			});
		}
	},

	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const id = data.get('id') as string;

			if (!id) {
				return fail(400, {
					message: 'User ID is required'
				});
			}

			const deleted = await deleteUser(id);
			if (!deleted) {
				return fail(404, {
					message: 'User not found'
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting user:', error);
			return fail(500, {
				message: 'Failed to delete user'
			});
		}
	}
};
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session) {
		redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, {
				message: 'Email dan password harus diisi'
			});
		}

		if (typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, {
				message: 'Data tidak valid'
			});
		}

		if (email.length < 3 || password.length < 6) {
			return fail(400, {
				message: 'Email minimal 3 karakter dan password minimal 6 karakter'
			});
		}

		try {
			const user = await auth.verifyUserCredentials(email, password);
			if (!user) {
				return fail(400, {
					message: 'Email atau password salah'
				});
			}

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, user.id);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

			return redirect(302, '/');
		} catch (error) {
			console.error('Login error:', error);
			return fail(500, {
				message: 'Terjadi kesalahan server'
			});
		}
	}
};
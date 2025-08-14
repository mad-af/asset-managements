import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import * as auth from '$lib/server/auth';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirm-password');

		if (!email || !password || !confirmPassword) {
			return fail(400, {
				message: 'Semua field harus diisi'
			});
		}

		if (typeof email !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string') {
			return fail(400, {
				message: 'Data tidak valid'
			});
		}

		if (email.length < 3) {
			return fail(400, {
				message: 'Email minimal 3 karakter'
			});
		}

		if (password.length < 6) {
			return fail(400, {
				message: 'Password minimal 6 karakter'
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				message: 'Password dan konfirmasi password tidak sama'
			});
		}

		// Validasi format email sederhana
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				message: 'Format email tidak valid'
			});
		}

		try {
			// Cek apakah email sudah terdaftar
			const existingUser = await auth.getUserByEmail(email);
			if (existingUser) {
				return fail(400, {
					message: 'Email sudah terdaftar'
				});
			}

			// Buat user baru
			const user = await auth.createUser(email, password);

			// Buat session dan login otomatis
			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, user.id);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
			
		} catch (error) {
			console.error('Registration error:', error);
			return fail(500, {
				message: 'Terjadi kesalahan server'
			});
		}

		// Redirect dilakukan di luar try-catch untuk menghindari penangkapan error
		return redirect(302, '/dashboard');
	}
};
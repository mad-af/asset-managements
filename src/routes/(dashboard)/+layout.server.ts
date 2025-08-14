import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Jika user belum login, redirect ke halaman utama
	if (!event.locals.session) {
		redirect(302, '/authentication/sign-in');
	}
	return {};
};
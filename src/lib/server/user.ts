import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hashPassword } from './auth';

export type CreateUserData = {
	firstName: string;
	lastName: string;
	email: string;
	position?: string;
	password: string;
	biography?: string;
};

export type UpdateUserData = {
	firstName?: string;
	lastName?: string;
	email?: string;
	position?: string;
	password?: string;
	biography?: string;
};

// CREATE - Membuat user baru
export async function createUser(userData: CreateUserData): Promise<table.User> {
	const userId = crypto.randomUUID();
	const passwordHash = await hashPassword(userData.password);
	
	const user: table.User = {
		id: userId,
		firstName: userData.firstName,
		lastName: userData.lastName,
		email: userData.email,
		position: userData.position || null,
		passwordHash,
		biography: userData.biography || null
	};
	
	await db.insert(table.user).values(user);
	return user;
}

// READ - Mendapatkan semua user
export async function getAllUsers(): Promise<table.User[]> {
	const users = await db
		.select({
			id: table.user.id,
			firstName: table.user.firstName,
			lastName: table.user.lastName,
			email: table.user.email,
			position: table.user.position,
			passwordHash: table.user.passwordHash,
			biography: table.user.biography
		})
		.from(table.user);
	
	return users;
}

// READ - Mendapatkan user berdasarkan ID
export async function getUserById(id: string): Promise<table.User | null> {
	const [user] = await db
		.select()
		.from(table.user)
		.where(eq(table.user.id, id))
		.limit(1);
	
	return user || null;
}

// READ - Mendapatkan user berdasarkan email
export async function getUserByEmail(email: string): Promise<table.User | null> {
	const [user] = await db
		.select()
		.from(table.user)
		.where(eq(table.user.email, email))
		.limit(1);
	
	return user || null;
}

// UPDATE - Memperbarui user berdasarkan ID
export async function updateUser(id: string, userData: UpdateUserData): Promise<table.User | null> {
	// Cek apakah user ada
	const existingUser = await getUserById(id);
	if (!existingUser) {
		return null;
	}
	
	// Siapkan data untuk update
	const updateData: Partial<table.User> = {};
	
	if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
	if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
	if (userData.email !== undefined) updateData.email = userData.email;
	if (userData.position !== undefined) updateData.position = userData.position;
	if (userData.biography !== undefined) updateData.biography = userData.biography;
	
	// Hash password jika ada
	if (userData.password !== undefined) {
		updateData.passwordHash = await hashPassword(userData.password);
	}
	
	// Update user
	await db
		.update(table.user)
		.set(updateData)
		.where(eq(table.user.id, id));
	
	// Return updated user
	return await getUserById(id);
}

// DELETE - Menghapus user berdasarkan ID
export async function deleteUser(id: string): Promise<boolean> {
	// Cek apakah user ada
	const existingUser = await getUserById(id);
	if (!existingUser) {
		return false;
	}
	
	// Hapus semua session user terlebih dahulu
	await db.delete(table.session).where(eq(table.session.userId, id));
	
	// Hapus user
	await db.delete(table.user).where(eq(table.user.id, id));
	
	return true;
}

// UTILITY - Mendapatkan jumlah total user
export async function getUserCount(): Promise<number> {
	const result = await db
		.select({ count: table.user.id })
		.from(table.user);
	
	return result.length;
}

// UTILITY - Cek apakah email sudah digunakan
export async function isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
	const users = await db
		.select({ id: table.user.id })
		.from(table.user)
		.where(eq(table.user.email, email));
	
	// Jika ada excludeUserId, filter out user tersebut
	if (excludeUserId) {
		return users.some(user => user.id !== excludeUserId);
	}
	
	return users.length > 0;
}
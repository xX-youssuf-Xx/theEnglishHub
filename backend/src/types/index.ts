export interface User {
	id: number;
	publicId: string;
	username: string;
	role: "admin" | "assistant";
	isActive: boolean;
	lastLogin: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuthContext {
	user: User | null;
}

export interface PaginationParams {
	page?: number;
	limit?: number;
}

export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface Student {
	id: number;
	publicId: string;
	fullName: string;
	age: number | null;
	parentName: string;
	parentPhone: string;
	address: string;
	emergencyContact: string;
	classId: number | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Teacher {
	id: number;
	publicId: string;
	fullName: string;
	phone: string | null;
	email: string | null;
	address: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Course {
	id: number;
	publicId: string;
	name: string;
	description: string | null;
	syllabus: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Class {
	id: number;
	publicId: string;
	name: string;
	teacherId: number | null;
	scheduleDayOfWeek: number | null;
	scheduleStartTime: string | null;
	scheduleEndTime: string | null;
	startDate: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Payment {
	id: number;
	publicId: string;
	amount: string;
	paymentDate: Date;
	notes: string | null;
	createdAt: Date;
}

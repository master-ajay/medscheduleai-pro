// src/types/user.ts
import { BaseEntity, UserRole } from '../common/common'

export interface User extends BaseEntity {
    email: string;
    role: UserRole;
    organizationId: string;
    profile: UserProfile;
    preferences: UserPreferences;
    lastLogin?: Date;
    isActive: boolean;
    permissions: string[];
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    timezone: string;
}

export interface UserPreferences {
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}
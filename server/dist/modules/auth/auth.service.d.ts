import { IUser } from '../../models/User.js';
import { LoginInput } from './auth.validation.js';
export declare class AuthService {
    static login(input: LoginInput): Promise<{
        user: Partial<IUser>;
        token: string;
        refreshToken: string;
    }>;
    static getMe(userId: string): Promise<Partial<IUser> | null>;
}
//# sourceMappingURL=auth.service.d.ts.map
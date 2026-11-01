import { IUser } from '../../models/User.js';
import { LoginInput } from './auth.validation.js';
export declare class AuthService {
    static login(input: LoginInput): Promise<{
        user: Partial<IUser> & {
            restaurant?: any;
        };
        token: string;
        refreshToken: string;
    }>;
    static getMe(userId: string): Promise<Partial<IUser> & {
        restaurant?: any;
    } | null>;
}
//# sourceMappingURL=auth.service.d.ts.map
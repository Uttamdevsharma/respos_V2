import { IUser } from '../../models/User.js';
export declare class UserService {
    static getAll(): Promise<IUser[]>;
    static getById(id: string): Promise<IUser>;
    static create(input: Partial<IUser>): Promise<IUser>;
    static update(id: string, input: Partial<IUser>): Promise<IUser>;
    static delete(id: string): Promise<void>;
    static toggleActive(id: string): Promise<IUser>;
}
//# sourceMappingURL=user.service.d.ts.map
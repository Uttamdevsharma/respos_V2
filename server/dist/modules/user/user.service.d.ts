import { IUser } from '../../models/User.js';
export declare class UserService {
    static getAll(restaurantId: string): Promise<IUser[]>;
    static getById(id: string, restaurantId: string): Promise<IUser>;
    static create(input: Partial<IUser>, restaurantId: string): Promise<IUser>;
    static update(id: string, input: Partial<IUser>, restaurantId: string): Promise<IUser>;
    static delete(id: string, restaurantId: string): Promise<void>;
    static toggleActive(id: string, restaurantId: string): Promise<IUser>;
}
//# sourceMappingURL=user.service.d.ts.map
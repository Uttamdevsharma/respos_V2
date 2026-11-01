import { IMenuItem } from '../../models/MenuItem.js';
export declare class MenuService {
    static getAll(restaurantId: string, categoryId?: string): Promise<IMenuItem[]>;
    static getById(id: string, restaurantId: string): Promise<IMenuItem>;
    static create(input: Partial<IMenuItem>, restaurantId: string): Promise<IMenuItem>;
    static update(id: string, input: Partial<IMenuItem>, restaurantId: string): Promise<IMenuItem>;
    static delete(id: string, restaurantId: string): Promise<void>;
    static toggleAvailability(id: string, restaurantId: string): Promise<IMenuItem>;
}
//# sourceMappingURL=menu.service.d.ts.map
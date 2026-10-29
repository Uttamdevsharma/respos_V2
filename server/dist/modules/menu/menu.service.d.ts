import { IMenuItem } from '../../models/MenuItem.js';
export declare class MenuService {
    static getAll(categoryId?: string): Promise<IMenuItem[]>;
    static getById(id: string): Promise<IMenuItem>;
    static create(input: Partial<IMenuItem>): Promise<IMenuItem>;
    static update(id: string, input: Partial<IMenuItem>): Promise<IMenuItem>;
    static delete(id: string): Promise<void>;
    static toggleAvailability(id: string): Promise<IMenuItem>;
}
//# sourceMappingURL=menu.service.d.ts.map
import { ICategory } from '../../models/Category.js';
export declare class CategoryService {
    static getAll(restaurantId: string): Promise<ICategory[]>;
    static getById(id: string, restaurantId: string): Promise<ICategory>;
    static create(input: Partial<ICategory>, restaurantId: string): Promise<ICategory>;
    static update(id: string, input: Partial<ICategory>, restaurantId: string): Promise<ICategory>;
    static delete(id: string, restaurantId: string): Promise<void>;
}
//# sourceMappingURL=category.service.d.ts.map
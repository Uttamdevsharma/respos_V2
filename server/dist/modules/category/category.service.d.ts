import { ICategory } from '../../models/Category.js';
export declare class CategoryService {
    static getAll(): Promise<ICategory[]>;
    static getById(id: string): Promise<ICategory>;
    static create(input: Partial<ICategory>): Promise<ICategory>;
    static update(id: string, input: Partial<ICategory>): Promise<ICategory>;
    static delete(id: string): Promise<void>;
}
//# sourceMappingURL=category.service.d.ts.map
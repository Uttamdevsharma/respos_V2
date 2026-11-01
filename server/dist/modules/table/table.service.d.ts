import { ITable } from '../../models/Table.js';
import { CreateTableInput, UpdateTableInput } from './table.validation.js';
export declare class TableService {
    static getAll(restaurantId: string): Promise<ITable[]>;
    static getById(id: string, restaurantId: string): Promise<ITable>;
    static create(input: CreateTableInput, restaurantId: string): Promise<ITable>;
    static update(id: string, input: UpdateTableInput, restaurantId: string): Promise<ITable>;
    static delete(id: string, restaurantId: string): Promise<void>;
    static updateStatus(id: string, status: 'available' | 'occupied' | 'reserved', restaurantId: string): Promise<ITable>;
}
//# sourceMappingURL=table.service.d.ts.map
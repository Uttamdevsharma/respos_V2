import { ITable } from '../../models/Table.js';
import { CreateTableInput, UpdateTableInput } from './table.validation.js';
export declare class TableService {
    static getAll(): Promise<ITable[]>;
    static getById(id: string): Promise<ITable>;
    static create(input: CreateTableInput): Promise<ITable>;
    static update(id: string, input: UpdateTableInput): Promise<ITable>;
    static delete(id: string): Promise<void>;
    static updateStatus(id: string, status: 'available' | 'occupied' | 'reserved'): Promise<ITable>;
}
//# sourceMappingURL=table.service.d.ts.map
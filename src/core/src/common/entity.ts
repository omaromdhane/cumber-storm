import { IdGenerator } from "./id_generator";
import { Disposable } from "./lifecycle";

export interface IEntity {
    id: string;
}

export abstract class Entity implements IEntity {
    public readonly id: string;

    protected constructor(id_prefix?: string) {
        this.id = IdGenerator.generate(id_prefix);
    }
}

export abstract class DisposableEntity extends Disposable implements IEntity {
    public readonly id: string;

    protected constructor(id_prefix?: string) {
        super();
        this.id = IdGenerator.generate(id_prefix);
    }
}
import { CumberEvent } from './cumber_event';
import { 
    Events,
    ISetParallelDemandEventData
} from './types';

export type CumberStormEventMap = {
    [Events.WORKER_STARTED]: CumberEvent;
    [Events.WORKER_FINISHED]: CumberEvent;
    [Events.WORKER_ERROR]: CumberEvent;
    [Events.SET_PARALLEL_DEMAND]: CumberEvent<ISetParallelDemandEventData>;
}
 
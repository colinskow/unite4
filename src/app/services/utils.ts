import { Subject } from 'rxjs/Subject';
import { Contract, EventEmitter } from 'web3/types';

export function createListener(
  contract: Contract,
  event: string,
  subj: Subject<Object> = new Subject(),
  listeners: EventEmitter[] = null
): Subject<Object> {
  const listener = contract.events[event]({ fromBlock: 0 })
    .on('data', data => {
      console.log(event, data);
      subj.next(data.returnValues);
    })
    .on('changed', () => subj.complete())
    .on('error', err => subj.error(err));
  if (listeners) {
    listeners.push(listener);
  }
  return subj;
}

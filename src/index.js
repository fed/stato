import Bacon from 'baconjs';
import flatten from 'lodash/flatten';

// Store
const _busCache = {};

export class Store {
  stream(name) {
    return this.bus(name);
  }

  push(name, value) {
    this.bus(name).push(value);
  }

  plug(name, value) {
    this.bus(name).plug(value);
  }

  bus(name) {
    return _busCache[name] = _busCache[name] || new Bacon.Bus();
  }
}

// Baconify: bind Action Creators to Reducers
export default function baconify(initialState, store, reducers, render) {
  const actionTypes = Object.keys(reducers);
  const boundActions = actionTypes.map((actionType) => {
    return [[store.stream(actionType)], reducers[actionType]];
  });

  return Bacon
    .update(
      initialState,
      ...flatten(boundActions)
    )
    .onValue((appState) => render(appState));
}

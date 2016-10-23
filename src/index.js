import Bacon from 'baconjs';
import flatten from 'lodash/flatten';

// Store
const _busCache = {};

class Store {
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

export const store = new Store();

// Baconify: bind Action Creators to Reducers
export function baconify(initialState, actionTypes, getReducer, render) {
  const reducers = Object.keys(actionTypes).map((actionType) => {
    return [[store.stream(actionType)], getReducer(actionType)];
  });

  return Bacon.update(
    initialState,
    ...flatten(reducers)
  ).onValue((appState) => { render(appState); });
}

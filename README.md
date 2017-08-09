# stato ![Dependencies](https://david-dm.org/fknussel/stato.svg)

Super simple functional reactive state management library powered by [Bacon.js](http://baconjs.github.io/) 🔥

## Installation

```
npm install --save stato
```

Then just either import the main `stato` function, the `Store` class (controlling bus you need to instantiate), or both (depending what you need on each file).

```
import stato, {Store} from 'stato';
```

## Motivation and Proposed Architecture

Just a lil bit of context first *re: functional reactive programming*. The most fundamental concept of [Functional Reactive Programming (FRP)](http://en.wikipedia.org/wiki/Functional_reactive_programming) is the **event stream**. Streams are like (immutable) arrays of events: they can be mapped, filtered, merged and combined. The difference between arrays and event streams is that values (events) of the event stream occur asynchronously. Every time an event occurs, it gets propagated through the stream and finally gets consumed by the subscriber.

We have [Flux](https://facebook.github.io/flux/) and other implementations such as [Redux](http://redux.js.org/) and [MobX](https://mobxjs.github.io/) to handle our app state, and in fact they do a great job abstracting our views from the *business logic* and keeping our **data flow unidirectional**. However, Reactive programming is what React was made for. So, what if we delegate the app state handling to FRP libraries like [Bacon.js](http://baconjs.github.io/) or [RxJS](http://reactivex.io/rxjs/)? Well, that actually makes a lot of sense: 

1. Actions happen eventually and they propagate through event streams.
2. The combination of these event streams result in the app's state.
3. After an event has propagated through the system, the new state is consumed by the subscriber and rendered by the **root level** React component.

This makes the data flow super simple:

![Application Architecture](http://i.imgur.com/ButOsvf.png)

The fundamental idea behind this approach is that every user-triggered action gets pushed to the appropriate event stream, which is then merged in to the **application state** stream which is our single source of truth. Events take place at different points in time, and they cause the application state to change. Finally the updated state triggers a re-render of the root component, and React's virtual DOM takes care of the rest :tada: This results in **dead simple, dumb** React views, mostly powered by **[stateless functional components](https://facebook.github.io/react/docs/components-and-props.html#functional-and-class-components)** in favour of stateful class components (wherever possible).

## TL;DR: Usage Example

Have a look at this [example](https://github.com/fknussel/stato-example).

## Quick Start Guide

### 1) Define your **action types**

```js
export const SHOW_SPINNER = 'SPINNER/SHOW';
```

I usually define all actions within a single file for convenience.

### 2) Create your **reducers**

**Reducers are pure functions** that derive the next application state for a particular action, based on the current state and the payload the action provides. The first parameter reducers take is always the current state for the app, whereas the rest of the arguments are whatever data your reducer needs and you pass on to them.

**Reducers and action types have a 1:1 relationship.** You need to name your reducers after the action type they are bound to ⚠️ -- this is the only style convention this library has.

```js
export default {
  [SHOW_SPINNER]: (state) => {
    return Object.assign({}, state, { loading: true });
  },

  [HIDE_SPINNER]: (state) => {
    return Object.assign({}, state, { loading: false });
  }
}
```

Of course reducers don't need to be inline functions, you can define them elsewhere and then bind them together in the format stato needs them to be, something in the lines of this chunk of code... But this is totally up to you and depends on your preferred code style.

```js
export default {
  [SHOW_SPINNER]: showSpinnerReducer,
  [HIDE_SPINNER]: hideSpinnerReducer
}
```

### 3) Define your **initial state**

```js
const initialState = {
  loading: false
};
```

### 4) Instantiate your store

```js
const store = new Store();
```

### 5) Initialise your application state

```js
stato(initialState, store, reducers, (props) => {
  ReactDOM.render(
    <App {...props} />,
    document.getElementById('app')
  );
});
```

## About Side Effects

Side effects allow your application to interact with the outside world, i.e.: fetching data from an API, getting/setting data from/to `localStorage`/`sessionStorage`, talking to a database, etc.

Unlike reducers, effects are **not** pure functions.

Naturally effects may (and most usually do) trigger actions to update the application state once they are done making asynchronous operations.

For instance, consider this effect called `getUserDetails` that fetches a list of users from an API. Provided the Ajax request completes successfully, the effect will trigger the `RECEIVE_USER_DETAILS` action which simply updates the application state with those user details. This allows for a separation of concerns between hitting an API and updating the app state.

```js
export function getUserDetails() {
  store.push(SHOW_SPINNER); // triggers an action
  
  const ajaxCall = fetch('//api.github.com/users/fknussel')
    .then((response) => response.json());

  const userDetailsStream = Bacon
    .fromPromise(ajaxCall)
    .onValue((user) => {
      store.push(GET_USER_DETAILS, user); // triggers an action
      store.push(HIDE_SPINNER); // triggers an action
    });
}
```

## Using stato with other view libraries

stato is actually view-layer agnostic, so it can easily be used with any other UI library such as [Preact](https://preactjs.com/) or [Vue.js](https://vuejs.org/).

## Development Tasks

| Command | Description |
|---------|-------------|
| `npm install` | Fetch dependencies and build binaries for any of the modules |
| `npm run clean` | Remove `lib` directory |
| `npm run build` | Build `lib/stato.js` file |
| `npm test` | Run test suite |

## Complementary Readings, Inspiration and Credits

I've first used a somewhat similar architecture while at [Fox Sports Australia](https://github.com/FoxSportsAustralia/) and it made perfect sense. This was probably before or at the same time [Redux](http://redux.js.org/) and [MobX](https://mobxjs.github.io/) became popular.

[Matti Lankinen](https://github.com/milankinen) proposes the same idea on his [article on Medium](https://medium.com/@milankinen/good-bye-flux-welcome-bacon-rx-23c71abfb1a7). I've made tweaks and enhancements to this library after some of his comments and ideas.

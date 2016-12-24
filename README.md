# baconify

Reactive state management using [Bacon.js](http://baconjs.github.io/).

## TL;DR: Usage Example

Have a look at this [example](https://github.com/fknussel/baconify-example).

## Motivation and Proposed Architecture

Just a lil bit of context first *re: functional reactive programming*. The most fundamental concept of [Functional Reactive Programming (FRP)](http://en.wikipedia.org/wiki/Functional_reactive_programming) is the **event stream**. Streams are like (immutable) arrays of events: they can be mapped, 
filtered, merged and combined. The difference between arrays and event streams is that values (events) of the event stream occur asynchronously. Every time an event occurs, it gets propagated through the stream and finally gets consumed by the subscriber.

We have Flux (and implementations like Redux) to handle our app state, and in fact they do a great job abstracting our views from the *business logic* and keeping our **data flow unidirectional**. However, Reactive programming is what React was made for. So, what if we delegate the app state handling to FRP libraries like Bacon.js or RxJS instead of using Redux? Well, that actually makes a lot of sense: 

1. Actions happen eventually and they propagate through event streams.
2. The combination of these event streams result in the app's state.
3. After an event has propagated through the system, the new state is consumed by the subscriber and rendered by the **root level** React component.

This makes the data flow super simple:

![Application Architecture](http://i.imgur.com/57PHNjS.png)

The fundamental idea behind this approach is that every user-triggered action gets pushed to the appropriate event stream, which is then merged in to the **application state** stream. Events take place at different points in time, and they cause the application state to change. Finally the updated state triggers a re-render of the root component, and React's virtual DOM takes care of the rest :tada: This results in **dead simple, dumb** React views.

## Quick Start Guide

First grab the library here: https://www.npmjs.com/package/baconify

```
npm install --save-dev baconify
```

1) Define your **action types**:

```js
export const SHOW_SPINNER = 'SHOW_SPINNER';
```

I usually define all actions within a single file for convenience.

2) Create your **reducers**:

**Reducers are pure functions** that derive the next application state for a particular action, based on the current state. The first parameter reducers take is always the current state for the app, whereas the rest of the arguments are whatever payload your reducer needs and you pass on to them.

**Reducers and action types have a 1:1 relationship.** This library needs you to name your reducers after the action type they are bound to:

```js
export default {
  [SHOW_SPINNER]: (state) => {
    return assign({}, state, { loading: true });
  },

  [HIDE_SPINNER]: (state) => {
    return assign({}, state, { loading: false });
  }
}
```

3) Define your **initial state**:

```js
const initialState = {
  loading: false
};
```

4) Initialise your application state:

```js
baconify(initialState, reducers, (props) => {
  ReactDOM.render(<App {...props} />, document.getElementById('app'));
});
```

## About Side Effects

Side effects allow your application to interact with the outside world, i.e.: fetching data from an API, getting/setting data from/to `localStorage`/`sessionStorage`, etc.

Unlike reducers, effects are **not** pure functions.

Naturally effects may (and usually do) trigger actions to update the application state.

```js
export function getUserDetails() {
  store.push(SHOW_SPINNER); // triggers an action
  
  const ajaxCall = fetch('//api.github.com/users/fknussel')
    .then((response) => response.json());

  const postDetailsStream = Bacon
    .fromPromise(ajaxCall)
    .onValue((user) => {
      store.push(GET_USER_DETAILS, user); // triggers an action
      store.push(HIDE_SPINNER); // triggers an action
    });
}
```

## Development Tasks

| Command | Description |
|---------|-------------|
| `npm install` | Fetch dependencies and build binaries for any of the modules |
| `npm run clean` | Remove `lib` directory |
| `npm run build` | Build `lib/baconify.js` file |
| `npm test` | Run test suite |

## Complementary Readings, Inspiration and Credits

* https://medium.com/@milankinen/good-bye-flux-welcome-bacon-rx-23c71abfb1a7
* http://blog.hertzen.com/post/102991359167/flux-inspired-reactive-data-flow-using-react-and
* http://www.aryweb.nl/2015/02/16/Reactive-React-using-reactive-streams/

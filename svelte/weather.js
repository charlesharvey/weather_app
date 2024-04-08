import Weather from "./Weather.svelte";

const weather = new Weather({
  target: document.querySelector("#svelte-weather"),
  props: {},
});

export default weather;

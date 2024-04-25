import Weather from "./Weather.svelte";

const target = document.querySelector("#svelte-weather");
target.innerHTML = "";
const weather = new Weather({
  target: target,
  props: {},
});

export default weather;

<script>
  import { onMount } from "svelte";

  import constants from "./constants";
  export let period;

  onMount(() => {});

  function hasPeriodMinMax(period) {
    if (period) {
      if (period.temp) {
        if (
          typeof period.temp.max !== "undefined" &&
          typeof period.temp.min !== "undefined"
        ) {
          return true;
        }
      }
    }
    return false;
  }
</script>

<div>
  {#if period.weather}
    <h3>
      <span class="dayOfWeek">{constants.timeToDayOfWeek(period.dt)}</span>
      <span class="date"> {constants.timeToDate(period.dt)}</span>

      {#if period.time}
        <span class="hour_time">{period.time}:00</span>
      {/if}
    </h3>

    <div class="icon icon_{period.weather[0].icon}"></div>
    <div class="temperatures">
      {#if hasPeriodMinMax(period)}
        <div class="high_temperature">
          {constants.roundTemp(period.temp.max)}
          <span class="degree_symbol">&deg;</span>
          <span class="temperature_unit"> C</span>
        </div>
        <div class="low_temperature">
          {constants.roundTemp(period.temp.min)}
          <span class="degree_symbol">&deg;</span>
          <span class="temperature_unit"> C</span>
        </div>
      {:else}
        <div class="high_temperature">
          {constants.roundTemp(period.temp)}
          <span class="degree_symbol">&deg;</span>
          <span class="temperature_unit"> C</span>
        </div>
      {/if}
    </div>
    <div class="weather_description">
      {period.weather[0].main}
      <span class="wind_speed">
        <span
          title="mph"
          style:transform={constants.windSpeedAndDirection(
            period.wind_speed,
            period.wind_deg,
          )}
          class="icon icon_wind"
        ></span>
        {constants.windToMPH(period.wind_speed)}<span class="wind_units"
          >mph</span
        >
      </span>
    </div>
  {/if}
</div>

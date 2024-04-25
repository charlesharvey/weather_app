<script>
  import { onMount } from "svelte";

  import constants from "./constants";
  export let day;

  onMount(() => {});
</script>

<div>
  {#if day.weather}
    <h3>
      <span class="dayOfWeek">{constants.timeToDayOfWeek(day.dt)}</span>
      <span class="date"> {constants.timeToDate(day.dt)}</span>

      {#if day.time}
        <span class="hour_time">{day.time}:00</span>
      {/if}
    </h3>

    <div class="icon icon_{day.weather[0].icon}"></div>
    <div class="temperatures">
      {#if day.temp.min && day.temp.max}
        <div class="low_temperature">
          {constants.roundTemp(day.temp.min)}
          <span class="degree_symbol">&deg;</span>
          <span class="temperature_unit"> C</span>
        </div>
        <div class="high_temperature">
          {constants.roundTemp(day.temp.max)}
          <span class="degree_symbol">&deg;</span>
          <span class="temperature_unit"> C</span>
        </div>
      {:else}
        <div class="high_temperature">
          {constants.roundTemp(day.temp)}
          <span class="degree_symbol">&deg;</span>
          <span class="temperature_unit"> C</span>
        </div>
      {/if}
    </div>
    <div class="weather_description">
      {day.weather[0].main}
      <span class="wind_speed">
        <span
          style:transform={constants.windSpeedAndDirection(
            day.wind_speed,
            day.wind_deg
          )}
          class="icon icon_wind"
        ></span>
        {constants.roundSpeed(day.wind_speed)}<span class="wind_units">kmh</span
        >
      </span>
    </div>
  {/if}
</div>

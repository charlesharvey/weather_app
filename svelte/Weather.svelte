<script>
  import { onMount } from "svelte";
  import constants from "./constants";

  // https://home.openweathermap.org/api_keys
  // https://openweathermap.org/api/one-call-3#current

  let days;
  let location;
  // rio woolwich svalbard bangkok

  onMount(() => {
    const last_location = getLastLocation();
    chooseLocation(last_location);
  });

  function chooseLocation(loc) {
    if (loc === "bangkok") {
      location = constants.bangkok;
    } else if (loc === "rio") {
      location = constants.rio;
    } else if (loc === "svalbard") {
      location = constants.svalbard;
    } else if (loc === "malltraeth") {
      location = constants.malltraeth;
    } else {
      location = constants.woolwich;
    }

    localStorage.setItem(`weather_last_location`, loc);

    getWeatherData();
  }

  function getWeatherData() {
    days = null;
    const cached = localStorage.getItem(`weather_${location.name}`);
    if (cached && constants.USE_CACHE) {
      const data = JSON.parse(cached);
      if (Date.now() - data.now > constants.CACHE_LENGTH) {
        getWeatherFromAPI();
      } else {
        console.log("from cache");
        processData(data);
      }
    } else {
      getWeatherFromAPI();
    }
  }

  function processData(data) {
    data.daily.forEach((day, di) => {
      const date = timeToDate(day.dt);
      const hours = data.hourly.filter((h) => timeToDate(h.dt) === date);
      const mxhrs = 23;
      if ((di == 0 || di == 2) && hours.length < mxhrs) {
        while (hours.length < mxhrs) {
          const c = { dt: 0, temp: false, pop: 0 };
          if (di == 0) {
            hours.unshift(c);
          } else if (di == 2) {
            hours.push(c);
          }
        }
      }

      day.hours = hours;

      // day.temp_line_chart = tempLineChart(hours);
      day.temp_bar_chart = tempBarChart(hours);
    });

    days = data.daily;
  }

  function tempBarChart(hours) {
    const alltemps = hours.filter((h) => h.temp !== false).map((h) => h.temp);
    const maxtemp = Math.max(...alltemps);
    const lowtemp = Math.min(...alltemps);
    let maxtaken = false;
    let mintaken = false;
    const bc = hours.map((h) => {
      const ct = constants.constrain(
        h.temp,
        constants.MIN_TEMP,
        constants.MAX_TEMP
      );
      const he =
        h.temp === false
          ? 0
          : constants.map(ct, constants.MIN_TEMP, constants.MAX_TEMP, 3, 100);

      let rt = false;
      if (h.temp === maxtemp && !maxtaken) {
        maxtaken = true;
        rt = `${roundTemp(h.temp)}°`;
      } else if (h.temp === lowtemp && !mintaken) {
        mintaken = true;
        rt = `${roundTemp(h.temp)}°`;
      }
      return {
        value: `${roundTemp(h.temp)}`,
        height: he,
        rt: rt,
      };
    });

    return bc;
  }

  function tempLineChart(hours) {
    let temps = hours.map((h) => h.temp);
    let txy = [];
    let oldx, oldy;
    temps.forEach((temp, i) => {
      const x = (i / temps.length) * 100;
      const y = constants.map(
        temp,
        constants.MIN_TEMP,
        constants.MAX_TEMP,
        0,
        100
      );

      if (oldx && x) {
        var a = oldx - x;
        var b = oldy - y;
        var length = Math.sqrt(a * a + b * b);
        var theta = (Math.atan2(y - oldy, x - oldx) * 180) / Math.PI;
        txy.push({ value: temp, x, y, oldx, oldy, length, theta });
      }

      oldx = x;
      oldy = y;
    });
    return txy;
  }

  function getWeatherFromAPI() {
    console.log("fromapi");
    // const action = `https://api.openweathermap.org/data/2.5/forecast/daily
    // ?lat=${location.lat}&lon=${location.lng}&cnt=7&appid=${constants.api_key}&units=metric`;

    const action = `https://api.openweathermap.org/data/3.0/onecall?lat=${location.lat}&lon=${location.lng}&exclude=minutely&appid=${constants.api_key}&units=metric`;

    constants
      .doFetch(action, "GET", null)
      .then((response) => {
        const data = response;
        processData(data);

        response.now = Date.now();
        const r = JSON.stringify(response);
        localStorage.setItem(`weather_${location.name}`, r);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getLastLocation() {
    const l = localStorage.getItem(`weather_last_location`);
    if (!l || l == "" || l == undefined) {
      return "woolwich";
    } else {
      return l;
    }
  }

  function roundTemp(a) {
    return Math.round(a);
  }
  function roundSpeed(a) {
    return Math.round(a);
  }

  function timeToHour(t) {
    if (t > 0) {
      const date = new Date(t * 1000);
      const options = { hour: "2-digit", hourCycle: "h24" };
      let i = new Intl.DateTimeFormat("en-US", options).format(date);
      i = i == 24 ? (i = `00`) : i;
      return i;
    }
    return "";
  }
  function timeToDayOfWeek(t) {
    const date = new Date(t * 1000);
    const options = { weekday: "short" };
    const i = new Intl.DateTimeFormat("en-US", options).format(date);
    return i;
  }

  function timeToDate(t) {
    const date = new Date(t * 1000);
    const options = { day: "2-digit" };
    const i = new Intl.DateTimeFormat("en-US", options).format(date);
    return i;
  }

  function windSpeedAndDirection(speed, deg) {
    let scale = speed / 10;
    scale = Math.min(Math.max(scale, 0.5), 1.2);
    return ` rotate(${deg}deg) scale(${scale})`;
  }
</script>

<!-- <svelte:head><title>Hello</title></svelte:head> -->

<div class:animated={constants.ANIMATED_ICONS}>
  {#if days}
    <section id="seven_days">
      {#each days as day, di}
        {#if di < 7}
          <div class="day weather_{day.weather[0].icon}">
            <h3>
              <span class="dayOfWeek">{timeToDayOfWeek(day.dt)}</span>
              <span class="date"> {timeToDate(day.dt)}</span>
            </h3>
            <div class="icon icon_{day.weather[0].icon}"></div>
            <div class="temperatures">
              <div class="low_temperature">
                {roundTemp(day.temp.min)}
                <span class="degree_symbol">&deg;</span>
                <span class="temperature_unit"> C</span>
              </div>
              <div class="high_temperature">
                {roundTemp(day.temp.max)}
                <span class="degree_symbol">&deg;</span>
                <span class="temperature_unit"> C</span>
              </div>
            </div>
            <div class="weather_description">
              {day.weather[0].main}
              <span class="wind_speed">
                <span
                  style:transform={windSpeedAndDirection(
                    day.wind_speed,
                    day.wind_deg
                  )}
                  class="icon icon_wind"
                ></span>
                {roundSpeed(day.wind_speed)}<span class="wind_units">kmh</span>
              </span>
            </div>

            {#if day.temp_line_chart}
              <div class="temperature_line_graph">
                {#each day.temp_line_chart as temp, t1}
                  <div
                    class="temp"
                    style:top={`${temp.oldy}%`}
                    style:left={`${temp.oldx}%`}
                    style:width={`${temp.length}%`}
                    style:transform={`rotate(${temp.theta}deg)`}
                  >
                    {temp.value}
                  </div>
                {/each}
              </div>
            {/if}
            {#if day.temp_bar_chart}
              <div class="rain_thing">
                <ul class="temperature_bar_chart">
                  {#each day.temp_bar_chart as temp, t1}
                    <li
                      class="temp"
                      title={`${temp.value}°`}
                      style:height={`${temp.height}%`}
                    >
                      {#if temp.rt}
                        <span class="record_temp">{temp.rt}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if day.hours.length > 4}
              <div class="rain_thing">
                <ul class="rain_chance_graph">
                  {#each day.hours as hour, h1}
                    <li
                      title={`${hour.pop * 100}%`}
                      style:height={`${hour.pop * 100}%`}
                    >
                      {#if h1 % Math.ceil(day.hours.length / 4) == 0}
                        <span>{timeToHour(hour.dt)}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {:else}
              <div
                class="rain_thing rain_probability"
                title={`${day.pop * 100}%`}
              >
                <div class="rain_inner" style:width={`${day.pop * 100}%`}></div>
              </div>
            {/if}
          </div>
          <!-- end of .day -->
        {/if}
      {/each}
    </section>

    <section>
      <div class="button_group">
        {#each constants.available_locations as loc}
          <a
            href="#location"
            on:click={() => chooseLocation(loc)}
            class:primary={loc == location.name}
            class="button">{loc}</a
          >
        {/each}
      </div>
    </section>
  {/if}
</div>

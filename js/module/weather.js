
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
function noop() { }
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);
function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_style(node, key, value, important) {
    if (value == null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, cancelable, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs#run-time-svelte-onmount
 */
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    // Do not reenter flush while dirty components are updated, as this can
    // result in an infinite loop. Instead, let the inner flush handle it.
    // Reentrancy is ok afterwards for bindings etc.
    if (flushidx !== 0) {
        return;
    }
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        try {
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
        }
        catch (e) {
            // reset dirty state to not end up in a deadlocked state and then rethrow
            dirty_components.length = 0;
            flushidx = 0;
            throw e;
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 */
function flush_render_callbacks(fns) {
    const filtered = [];
    const targets = [];
    render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
    targets.forEach((c) => c());
    render_callbacks = filtered;
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
    else if (callback) {
        callback();
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
            // if the component was destroyed immediately
            // it will update the `$$.on_destroy` reference to `null`.
            // the destructured on_destroy may still reference to the old array
            if (component.$$.on_destroy) {
                component.$$.on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        flush_render_callbacks($$.after_update);
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: [],
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        if (!is_function(callback)) {
            return noop;
        }
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
}
function append_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev('SvelteDOMRemove', { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
    const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    if (has_stop_immediate_propagation)
        modifiers.push('stopImmediatePropagation');
    dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
    else
        dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.data === data)
        return;
    dispatch_dev('SvelteDOMSetData', { node: text, data });
    text.data = data;
}
function validate_each_argument(arg) {
    if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
        let msg = '{#each} only iterates over array-like objects.';
        if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
            msg += ' You can use a spread to convert this iterable into an array.';
        }
        throw new Error(msg);
    }
}
function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
            console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
    }
}
/**
 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
 */
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error("'target' is a required option");
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn('Component was already destroyed'); // eslint-disable-line no-console
        };
    }
    $capture_state() { }
    $inject_state() { }
}

var constants = {
  api_key: api_key,
  woolwich: { name: "woolwich", lat: 51.491, lng: 0.0588 },
  london: { name: "london", lat: 51.513, lng: -0.103 },
  rio: { name: "rio", lat: -22.9137907, lng: -43.7756334 },
  svalbard: { name: "svalbard", lat: 78.6196353, lng: 16.8016345 },
  bangkok: { name: "bangkok", lat: 13.7539475, lng: 100.5431602 },
  malltraeth: { name: "malltraeth", lat: 53.1919, lng: -4.3941 },
  hayonwye: { name: "hayonwye", lat: 52.0738, lng: -3.1399 },
  portmeirion: { name: "portmeirion", lat: 52.9136, lng: -4.1167 },
  cork: { name: "cork", lat: 51.9, lng: -8.48 },
  ANIMATED_ICONS: false,
  CACHE_LENGTH: 20 * 60 * 1000, // 20 minutes
  USE_CACHE: true,
  MAX_TEMP: 45,
  MIN_TEMP: -10,
  available_locations: ["woolwich", "malltraeth", "rio"],
  click_file: "audio/tick.mp3",
  roundTemp: (a) => {
    return Math.round(a);
  },
  windSpeedAndDirection: (speed, deg) => {
    let scale = speed / 10;
    scale = Math.min(Math.max(scale, 0.5), 1.2);
    return ` rotate(${deg}deg) scale(${scale})`;
  },
  roundSpeed: (a) => {
    return Math.round(a);
  },

  timeToHour: (t) => {
    if (t > 0) {
      const date = new Date(t * 1000);
      const options = { hour: "2-digit", hourCycle: "h24" };
      let i = new Intl.DateTimeFormat("en-US", options).format(date);
      i = i == 24 ? (i = `00`) : i;
      return i;
    }
    return "";
  },
  timeToDayOfWeek: (t) => {
    const date = new Date(t * 1000);
    const options = { weekday: "short" };
    const i = new Intl.DateTimeFormat("en-US", options).format(date);
    return i;
  },

  timeToDate: (t) => {
    const date = new Date(t * 1000);
    const options = { day: "2-digit" };
    const i = new Intl.DateTimeFormat("en-US", options).format(date);
    return i;
  },

  map: (number, inMin, inMax, outMin, outMax) => {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  },
  constrain: (number, min, max) => {
    return Math.min(Math.max(number, min), max);
  },
  doFetch: (action, method, data) => {
    if (data) {
      data = JSON.stringify(data);
    }
    return fetch(action, {
      method: method,
      body: data,
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw data;
        });
      }
      return response.json();
    });
  },
};

/* svelte/WeatherInfo.svelte generated by Svelte v3.59.2 */
const file = "svelte/WeatherInfo.svelte";

// (12:2) {#if period.weather}
function create_if_block(ctx) {
	let h3;
	let span0;
	let t0_value = constants.timeToDayOfWeek(/*period*/ ctx[0].dt) + "";
	let t0;
	let t1;
	let span1;
	let t2_value = constants.timeToDate(/*period*/ ctx[0].dt) + "";
	let t2;
	let t3;
	let t4;
	let div0;
	let div0_class_value;
	let t5;
	let div1;
	let t6;
	let div2;
	let t7_value = /*period*/ ctx[0].weather[0].main + "";
	let t7;
	let t8;
	let span4;
	let span2;
	let t9;
	let t10_value = constants.roundSpeed(/*period*/ ctx[0].wind_speed) + "";
	let t10;
	let span3;
	let if_block0 = /*period*/ ctx[0].time && create_if_block_2(ctx);

	function select_block_type(ctx, dirty) {
		if (/*period*/ ctx[0].temp.min && /*period*/ ctx[0].temp.max) return create_if_block_1;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block1 = current_block_type(ctx);

	const block = {
		c: function create() {
			h3 = element("h3");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			t3 = space();
			if (if_block0) if_block0.c();
			t4 = space();
			div0 = element("div");
			t5 = space();
			div1 = element("div");
			if_block1.c();
			t6 = space();
			div2 = element("div");
			t7 = text(t7_value);
			t8 = space();
			span4 = element("span");
			span2 = element("span");
			t9 = space();
			t10 = text(t10_value);
			span3 = element("span");
			span3.textContent = "kmh";
			attr_dev(span0, "class", "dayOfWeek");
			add_location(span0, file, 13, 6, 232);
			attr_dev(span1, "class", "date");
			add_location(span1, file, 14, 6, 308);
			add_location(h3, file, 12, 4, 221);
			attr_dev(div0, "class", div0_class_value = "icon icon_" + /*period*/ ctx[0].weather[0].icon);
			add_location(div0, file, 21, 4, 477);
			attr_dev(div1, "class", "temperatures");
			add_location(div1, file, 22, 4, 536);
			attr_dev(span2, "class", "icon icon_wind");
			set_style(span2, "transform", constants.windSpeedAndDirection(/*period*/ ctx[0].wind_speed, /*period*/ ctx[0].wind_deg));
			add_location(span2, file, 45, 8, 1366);
			attr_dev(span3, "class", "wind_units");
			add_location(span3, file, 52, 49, 1603);
			attr_dev(span4, "class", "wind_speed");
			add_location(span4, file, 44, 6, 1332);
			attr_dev(div2, "class", "weather_description");
			add_location(div2, file, 42, 4, 1261);
		},
		m: function mount(target, anchor) {
			insert_dev(target, h3, anchor);
			append_dev(h3, span0);
			append_dev(span0, t0);
			append_dev(h3, t1);
			append_dev(h3, span1);
			append_dev(span1, t2);
			append_dev(h3, t3);
			if (if_block0) if_block0.m(h3, null);
			insert_dev(target, t4, anchor);
			insert_dev(target, div0, anchor);
			insert_dev(target, t5, anchor);
			insert_dev(target, div1, anchor);
			if_block1.m(div1, null);
			insert_dev(target, t6, anchor);
			insert_dev(target, div2, anchor);
			append_dev(div2, t7);
			append_dev(div2, t8);
			append_dev(div2, span4);
			append_dev(span4, span2);
			append_dev(span4, t9);
			append_dev(span4, t10);
			append_dev(span4, span3);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*period*/ 1 && t0_value !== (t0_value = constants.timeToDayOfWeek(/*period*/ ctx[0].dt) + "")) set_data_dev(t0, t0_value);
			if (dirty & /*period*/ 1 && t2_value !== (t2_value = constants.timeToDate(/*period*/ ctx[0].dt) + "")) set_data_dev(t2, t2_value);

			if (/*period*/ ctx[0].time) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					if_block0.m(h3, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty & /*period*/ 1 && div0_class_value !== (div0_class_value = "icon icon_" + /*period*/ ctx[0].weather[0].icon)) {
				attr_dev(div0, "class", div0_class_value);
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
				if_block1.p(ctx, dirty);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(div1, null);
				}
			}

			if (dirty & /*period*/ 1 && t7_value !== (t7_value = /*period*/ ctx[0].weather[0].main + "")) set_data_dev(t7, t7_value);

			if (dirty & /*period*/ 1) {
				set_style(span2, "transform", constants.windSpeedAndDirection(/*period*/ ctx[0].wind_speed, /*period*/ ctx[0].wind_deg));
			}

			if (dirty & /*period*/ 1 && t10_value !== (t10_value = constants.roundSpeed(/*period*/ ctx[0].wind_speed) + "")) set_data_dev(t10, t10_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(h3);
			if (if_block0) if_block0.d();
			if (detaching) detach_dev(t4);
			if (detaching) detach_dev(div0);
			if (detaching) detach_dev(t5);
			if (detaching) detach_dev(div1);
			if_block1.d();
			if (detaching) detach_dev(t6);
			if (detaching) detach_dev(div2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(12:2) {#if period.weather}",
		ctx
	});

	return block;
}

// (17:6) {#if period.time}
function create_if_block_2(ctx) {
	let span;
	let t0_value = /*period*/ ctx[0].time + "";
	let t0;
	let t1;

	const block = {
		c: function create() {
			span = element("span");
			t0 = text(t0_value);
			t1 = text(":00");
			attr_dev(span, "class", "hour_time");
			add_location(span, file, 17, 8, 402);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t0);
			append_dev(span, t1);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*period*/ 1 && t0_value !== (t0_value = /*period*/ ctx[0].time + "")) set_data_dev(t0, t0_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(17:6) {#if period.time}",
		ctx
	});

	return block;
}

// (35:6) {:else}
function create_else_block(ctx) {
	let div;
	let t0_value = constants.roundTemp(/*period*/ ctx[0].temp) + "";
	let t0;
	let t1;
	let span0;
	let t3;
	let span1;

	const block = {
		c: function create() {
			div = element("div");
			t0 = text(t0_value);
			t1 = space();
			span0 = element("span");
			span0.textContent = "°";
			t3 = space();
			span1 = element("span");
			span1.textContent = "C";
			attr_dev(span0, "class", "degree_symbol");
			add_location(span0, file, 37, 10, 1127);
			attr_dev(span1, "class", "temperature_unit");
			add_location(span1, file, 38, 10, 1178);
			attr_dev(div, "class", "high_temperature");
			add_location(div, file, 35, 8, 1041);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t0);
			append_dev(div, t1);
			append_dev(div, span0);
			append_dev(div, t3);
			append_dev(div, span1);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*period*/ 1 && t0_value !== (t0_value = constants.roundTemp(/*period*/ ctx[0].temp) + "")) set_data_dev(t0, t0_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block.name,
		type: "else",
		source: "(35:6) {:else}",
		ctx
	});

	return block;
}

// (24:6) {#if period.temp.min && period.temp.max}
function create_if_block_1(ctx) {
	let div0;
	let t0_value = constants.roundTemp(/*period*/ ctx[0].temp.max) + "";
	let t0;
	let t1;
	let span0;
	let t3;
	let span1;
	let t5;
	let div1;
	let t6_value = constants.roundTemp(/*period*/ ctx[0].temp.min) + "";
	let t6;
	let t7;
	let span2;
	let t9;
	let span3;

	const block = {
		c: function create() {
			div0 = element("div");
			t0 = text(t0_value);
			t1 = space();
			span0 = element("span");
			span0.textContent = "°";
			t3 = space();
			span1 = element("span");
			span1.textContent = "C";
			t5 = space();
			div1 = element("div");
			t6 = text(t6_value);
			t7 = space();
			span2 = element("span");
			span2.textContent = "°";
			t9 = space();
			span3 = element("span");
			span3.textContent = "C";
			attr_dev(span0, "class", "degree_symbol");
			add_location(span0, file, 26, 10, 708);
			attr_dev(span1, "class", "temperature_unit");
			add_location(span1, file, 27, 10, 759);
			attr_dev(div0, "class", "high_temperature");
			add_location(div0, file, 24, 8, 618);
			attr_dev(span2, "class", "degree_symbol");
			add_location(span2, file, 31, 10, 912);
			attr_dev(span3, "class", "temperature_unit");
			add_location(span3, file, 32, 10, 963);
			attr_dev(div1, "class", "low_temperature");
			add_location(div1, file, 29, 8, 823);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div0, anchor);
			append_dev(div0, t0);
			append_dev(div0, t1);
			append_dev(div0, span0);
			append_dev(div0, t3);
			append_dev(div0, span1);
			insert_dev(target, t5, anchor);
			insert_dev(target, div1, anchor);
			append_dev(div1, t6);
			append_dev(div1, t7);
			append_dev(div1, span2);
			append_dev(div1, t9);
			append_dev(div1, span3);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*period*/ 1 && t0_value !== (t0_value = constants.roundTemp(/*period*/ ctx[0].temp.max) + "")) set_data_dev(t0, t0_value);
			if (dirty & /*period*/ 1 && t6_value !== (t6_value = constants.roundTemp(/*period*/ ctx[0].temp.min) + "")) set_data_dev(t6, t6_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div0);
			if (detaching) detach_dev(t5);
			if (detaching) detach_dev(div1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(24:6) {#if period.temp.min && period.temp.max}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let div;
	let if_block = /*period*/ ctx[0].weather && create_if_block(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if (if_block) if_block.c();
			add_location(div, file, 10, 0, 188);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if (if_block) if_block.m(div, null);
		},
		p: function update(ctx, [dirty]) {
			if (/*period*/ ctx[0].weather) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (if_block) if_block.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots('WeatherInfo', slots, []);
	let { period } = $$props;

	onMount(() => {
		
	});

	$$self.$$.on_mount.push(function () {
		if (period === undefined && !('period' in $$props || $$self.$$.bound[$$self.$$.props['period']])) {
			console.warn("<WeatherInfo> was created without expected prop 'period'");
		}
	});

	const writable_props = ['period'];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WeatherInfo> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ('period' in $$props) $$invalidate(0, period = $$props.period);
	};

	$$self.$capture_state = () => ({ onMount, constants, svg_element, period });

	$$self.$inject_state = $$props => {
		if ('period' in $$props) $$invalidate(0, period = $$props.period);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [period];
}

class WeatherInfo extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, { period: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "WeatherInfo",
			options,
			id: create_fragment.name
		});
	}

	get period() {
		throw new Error("<WeatherInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set period(value) {
		throw new Error("<WeatherInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* svelte/Weather.svelte generated by Svelte v3.59.2 */

const { console: console_1 } = globals;
const file$1 = "svelte/Weather.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[20] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[23] = list[i];
	child_ctx[25] = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[26] = list[i];
	child_ctx[28] = i;
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[29] = list[i];
	return child_ctx;
}

// (422:2) {:else}
function create_else_block_2(ctx) {
	let div;

	const block = {
		c: function create() {
			div = element("div");
			attr_dev(div, "class", "loading");
			add_location(div, file$1, 422, 4, 11850);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block_2.name,
		type: "else",
		source: "(422:2) {:else}",
		ctx
	});

	return block;
}

// (306:2) {#if days}
function create_if_block$1(ctx) {
	let section0;
	let t;
	let section1;
	let div;
	let current;
	let each_value_1 = /*days*/ ctx[0];
	validate_each_argument(each_value_1);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	let each_value = constants.available_locations;
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			section0 = element("section");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t = space();
			section1 = element("section");
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(section0, "id", "seven_days");
			add_location(section0, file$1, 306, 4, 7768);
			attr_dev(div, "class", "button_group");
			add_location(div, file$1, 410, 6, 11524);
			add_location(section1, file$1, 409, 4, 11508);
		},
		m: function mount(target, anchor) {
			insert_dev(target, section0, anchor);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				if (each_blocks_1[i]) {
					each_blocks_1[i].m(section0, null);
				}
			}

			insert_dev(target, t, anchor);
			insert_dev(target, section1, anchor);
			append_dev(section1, div);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div, null);
				}
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*days, focusOnHourByPos, focussed_hour, focussed_day*/ 45) {
				each_value_1 = /*days*/ ctx[0];
				validate_each_argument(each_value_1);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						transition_in(each_blocks_1[i], 1);
						each_blocks_1[i].m(section0, null);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty[0] & /*location, chooseLocation*/ 18) {
				each_value = constants.available_locations;
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks_1[i]);
			}

			current = true;
		},
		o: function outro(local) {
			each_blocks_1 = each_blocks_1.filter(Boolean);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				transition_out(each_blocks_1[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(section0);
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach_dev(t);
			if (detaching) detach_dev(section1);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(306:2) {#if days}",
		ctx
	});

	return block;
}

// (309:8) {#if di < 7}
function create_if_block_1$1(ctx) {
	let div;
	let current_block_type_index;
	let if_block0;
	let t0;
	let t1;
	let div_class_value;
	let t2;
	let current;
	const if_block_creators = [create_if_block_5, create_else_block_1];
	const if_blocks = [];

	function select_block_type_1(ctx, dirty) {
		if (/*focussed_hour*/ ctx[3] && /*focussed_day*/ ctx[2] == /*day*/ ctx[23]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(ctx);
	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	let if_block1 = /*day*/ ctx[23].temp_svg && create_if_block_4(ctx);

	function select_block_type_2(ctx, dirty) {
		if (/*day*/ ctx[23].hours.length > 4) return create_if_block_2$1;
		return create_else_block$1;
	}

	let current_block_type = select_block_type_2(ctx);
	let if_block2 = current_block_type(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if_block2.c();
			t2 = space();
			attr_dev(div, "class", div_class_value = "day weather_" + /*day*/ ctx[23].weather[0].icon);
			add_location(div, file$1, 309, 10, 7855);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			append_dev(div, t0);
			if (if_block1) if_block1.m(div, null);
			append_dev(div, t1);
			if_block2.m(div, null);
			insert_dev(target, t2, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_1(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block0 = if_blocks[current_block_type_index];

				if (!if_block0) {
					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block0.c();
				} else {
					if_block0.p(ctx, dirty);
				}

				transition_in(if_block0, 1);
				if_block0.m(div, t0);
			}

			if (/*day*/ ctx[23].temp_svg) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_4(ctx);
					if_block1.c();
					if_block1.m(div, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block2) {
				if_block2.p(ctx, dirty);
			} else {
				if_block2.d(1);
				if_block2 = current_block_type(ctx);

				if (if_block2) {
					if_block2.c();
					if_block2.m(div, null);
				}
			}

			if (!current || dirty[0] & /*days*/ 1 && div_class_value !== (div_class_value = "day weather_" + /*day*/ ctx[23].weather[0].icon)) {
				attr_dev(div, "class", div_class_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if_blocks[current_block_type_index].d();
			if (if_block1) if_block1.d();
			if_block2.d();
			if (detaching) detach_dev(t2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$1.name,
		type: "if",
		source: "(309:8) {#if di < 7}",
		ctx
	});

	return block;
}

// (313:12) {:else}
function create_else_block_1(ctx) {
	let weatherinfo;
	let current;

	weatherinfo = new WeatherInfo({
			props: { period: /*day*/ ctx[23] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(weatherinfo.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(weatherinfo, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const weatherinfo_changes = {};
			if (dirty[0] & /*days*/ 1) weatherinfo_changes.period = /*day*/ ctx[23];
			weatherinfo.$set(weatherinfo_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(weatherinfo.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(weatherinfo.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(weatherinfo, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block_1.name,
		type: "else",
		source: "(313:12) {:else}",
		ctx
	});

	return block;
}

// (311:12) {#if focussed_hour && focussed_day == day}
function create_if_block_5(ctx) {
	let weatherinfo;
	let current;

	weatherinfo = new WeatherInfo({
			props: { period: /*focussed_hour*/ ctx[3] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(weatherinfo.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(weatherinfo, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const weatherinfo_changes = {};
			if (dirty[0] & /*focussed_hour*/ 8) weatherinfo_changes.period = /*focussed_hour*/ ctx[3];
			weatherinfo.$set(weatherinfo_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(weatherinfo.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(weatherinfo.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(weatherinfo, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_5.name,
		type: "if",
		source: "(311:12) {#if focussed_hour && focussed_day == day}",
		ctx
	});

	return block;
}

// (350:12) {#if day.temp_svg}
function create_if_block_4(ctx) {
	let div;
	let svg;
	let linearGradient;
	let stop0;
	let stop1;
	let polyline;
	let polyline_points_value;
	let svg_viewBox_value;
	let mounted;
	let dispose;
	let each_value_3 = /*day*/ ctx[23].temp_svg.polygons;
	validate_each_argument(each_value_3);
	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	function mousemove_handler(...args) {
		return /*mousemove_handler*/ ctx[7](/*day*/ ctx[23], ...args);
	}

	function touchmove_handler(...args) {
		return /*touchmove_handler*/ ctx[8](/*day*/ ctx[23], ...args);
	}

	const block = {
		c: function create() {
			div = element("div");
			svg = svg_element("svg");
			linearGradient = svg_element("linearGradient");
			stop0 = svg_element("stop");
			stop1 = svg_element("stop");
			polyline = svg_element("polyline");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(stop0, "class", "stop1");
			attr_dev(stop0, "stop-color", "#ddbf48");
			attr_dev(stop0, "offset", "0%");
			add_location(stop0, file$1, 361, 20, 9876);
			attr_dev(stop1, "class", "stop3");
			attr_dev(stop1, "stop-color", "#ddbf48");
			attr_dev(stop1, "stop-opacity", "0.1");
			attr_dev(stop1, "offset", "100%");
			add_location(stop1, file$1, 362, 20, 9952);
			attr_dev(linearGradient, "id", "Gradient1");
			attr_dev(linearGradient, "x1", "0");
			attr_dev(linearGradient, "x2", "0");
			attr_dev(linearGradient, "y1", "0");
			attr_dev(linearGradient, "y2", "1");
			add_location(linearGradient, file$1, 360, 18, 9796);
			attr_dev(polyline, "points", polyline_points_value = /*day*/ ctx[23].temp_svg.polyline);
			add_location(polyline, file$1, 369, 18, 10191);
			attr_dev(svg, "class", "sun_line_chart");
			attr_dev(svg, "height", svg_height);
			attr_dev(svg, "width", "100");
			attr_dev(svg, "viewBox", svg_viewBox_value = "0 0 100 " + svg_height);
			attr_dev(svg, "preserveAspectRatio", "none");
			add_location(svg, file$1, 351, 16, 9422);
			attr_dev(div, "class", "rain_thing");
			add_location(div, file$1, 350, 14, 9381);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, svg);
			append_dev(svg, linearGradient);
			append_dev(linearGradient, stop0);
			append_dev(linearGradient, stop1);
			append_dev(svg, polyline);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(svg, null);
				}
			}

			if (!mounted) {
				dispose = [
					listen_dev(svg, "mousemove", mousemove_handler, false, false, false, false),
					listen_dev(svg, "touchmove", touchmove_handler, false, false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*days*/ 1 && polyline_points_value !== (polyline_points_value = /*day*/ ctx[23].temp_svg.polyline)) {
				attr_dev(polyline, "points", polyline_points_value);
			}

			if (dirty[0] & /*days, focussed_hour*/ 9) {
				each_value_3 = /*day*/ ctx[23].temp_svg.polygons;
				validate_each_argument(each_value_3);
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(svg, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_3.length;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4.name,
		type: "if",
		source: "(350:12) {#if day.temp_svg}",
		ctx
	});

	return block;
}

// (371:18) {#each day.temp_svg.polygons as polygon}
function create_each_block_3(ctx) {
	let polygon;
	let polygon_points_value;

	const block = {
		c: function create() {
			polygon = svg_element("polygon");
			attr_dev(polygon, "points", polygon_points_value = /*polygon*/ ctx[29].points);
			toggle_class(polygon, "focussed", /*polygon*/ ctx[29].hour === /*focussed_hour*/ ctx[3]);
			add_location(polygon, file$1, 371, 20, 10314);
		},
		m: function mount(target, anchor) {
			insert_dev(target, polygon, anchor);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*days*/ 1 && polygon_points_value !== (polygon_points_value = /*polygon*/ ctx[29].points)) {
				attr_dev(polygon, "points", polygon_points_value);
			}

			if (dirty[0] & /*days, focussed_hour*/ 9) {
				toggle_class(polygon, "focussed", /*polygon*/ ctx[29].hour === /*focussed_hour*/ ctx[3]);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(polygon);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block_3.name,
		type: "each",
		source: "(371:18) {#each day.temp_svg.polygons as polygon}",
		ctx
	});

	return block;
}

// (396:12) {:else}
function create_else_block$1(ctx) {
	let div1;
	let div0;
	let div1_title_value;

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			attr_dev(div0, "class", "rain_inner");
			set_style(div0, "width", `${/*day*/ ctx[23].pop * 100}%`);
			add_location(div0, file$1, 400, 16, 11308);
			attr_dev(div1, "class", "rain_thing rain_probability");
			attr_dev(div1, "title", div1_title_value = `${/*day*/ ctx[23].pop * 100}%`);
			add_location(div1, file$1, 396, 14, 11175);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*days*/ 1) {
				set_style(div0, "width", `${/*day*/ ctx[23].pop * 100}%`);
			}

			if (dirty[0] & /*days*/ 1 && div1_title_value !== (div1_title_value = `${/*day*/ ctx[23].pop * 100}%`)) {
				attr_dev(div1, "title", div1_title_value);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$1.name,
		type: "else",
		source: "(396:12) {:else}",
		ctx
	});

	return block;
}

// (381:12) {#if day.hours.length > 4}
function create_if_block_2$1(ctx) {
	let div;
	let ul;
	let each_value_2 = /*day*/ ctx[23].hours;
	validate_each_argument(each_value_2);
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	const block = {
		c: function create() {
			div = element("div");
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(ul, "class", "rain_chance_graph");
			add_location(ul, file$1, 382, 16, 10645);
			attr_dev(div, "class", "rain_thing");
			add_location(div, file$1, 381, 14, 10604);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(ul, null);
				}
			}
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*days*/ 1) {
				each_value_2 = /*day*/ ctx[23].hours;
				validate_each_argument(each_value_2);
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$1.name,
		type: "if",
		source: "(381:12) {#if day.hours.length > 4}",
		ctx
	});

	return block;
}

// (389:22) {#if h1 % Math.ceil(day.hours.length / 4) == 0}
function create_if_block_3(ctx) {
	let span;
	let t_value = constants.timeToHour(/*hour*/ ctx[26].dt) + "";
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(t_value);
			add_location(span, file$1, 389, 24, 10973);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*days*/ 1 && t_value !== (t_value = constants.timeToHour(/*hour*/ ctx[26].dt) + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3.name,
		type: "if",
		source: "(389:22) {#if h1 % Math.ceil(day.hours.length / 4) == 0}",
		ctx
	});

	return block;
}

// (384:18) {#each day.hours as hour, h1}
function create_each_block_2(ctx) {
	let li;
	let show_if = /*h1*/ ctx[28] % Math.ceil(/*day*/ ctx[23].hours.length / 4) == 0;
	let t;
	let li_title_value;
	let if_block = show_if && create_if_block_3(ctx);

	const block = {
		c: function create() {
			li = element("li");
			if (if_block) if_block.c();
			t = space();
			attr_dev(li, "title", li_title_value = `${/*hour*/ ctx[26].pop * 100}%`);
			set_style(li, "height", `${/*hour*/ ctx[26].pop * 100}%`);
			add_location(li, file$1, 384, 20, 10744);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			if (if_block) if_block.m(li, null);
			append_dev(li, t);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*days*/ 1) show_if = /*h1*/ ctx[28] % Math.ceil(/*day*/ ctx[23].hours.length / 4) == 0;

			if (show_if) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_3(ctx);
					if_block.c();
					if_block.m(li, t);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty[0] & /*days*/ 1 && li_title_value !== (li_title_value = `${/*hour*/ ctx[26].pop * 100}%`)) {
				attr_dev(li, "title", li_title_value);
			}

			if (dirty[0] & /*days*/ 1) {
				set_style(li, "height", `${/*hour*/ ctx[26].pop * 100}%`);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			if (if_block) if_block.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block_2.name,
		type: "each",
		source: "(384:18) {#each day.hours as hour, h1}",
		ctx
	});

	return block;
}

// (308:6) {#each days as day, di}
function create_each_block_1(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*di*/ ctx[25] < 7 && create_if_block_1$1(ctx);

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (/*di*/ ctx[25] < 7) if_block.p(ctx, dirty);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block_1.name,
		type: "each",
		source: "(308:6) {#each days as day, di}",
		ctx
	});

	return block;
}

// (412:8) {#each constants.available_locations as loc}
function create_each_block(ctx) {
	let a;
	let t_value = /*loc*/ ctx[20] + "";
	let t;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[9](/*loc*/ ctx[20]);
	}

	const block = {
		c: function create() {
			a = element("a");
			t = text(t_value);
			attr_dev(a, "href", "#location");
			attr_dev(a, "class", "button");
			toggle_class(a, "primary", /*loc*/ ctx[20] == /*location*/ ctx[1].name);
			add_location(a, file$1, 412, 10, 11614);
		},
		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);
			append_dev(a, t);

			if (!mounted) {
				dispose = listen_dev(a, "click", click_handler, false, false, false, false);
				mounted = true;
			}
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*location*/ 2) {
				toggle_class(a, "primary", /*loc*/ ctx[20] == /*location*/ ctx[1].name);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(a);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(412:8) {#each constants.available_locations as loc}",
		ctx
	});

	return block;
}

function create_fragment$1(ctx) {
	let t;
	let div;
	let current_block_type_index;
	let if_block;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$1, create_else_block_2];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*days*/ ctx[0]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			t = space();
			div = element("div");
			if_block.c();
			toggle_class(div, "animated", constants.ANIMATED_ICONS);
			add_location(div, file$1, 304, 0, 7703);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
			insert_dev(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			current = true;

			if (!mounted) {
				dispose = listen_dev(document.body, "keyup", /*handleKeyUp*/ ctx[6], false, false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(div, null);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
			if (detaching) detach_dev(div);
			if_blocks[current_block_type_index].d();
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

const svg_height = 70;

function getLastLocation() {
	const l = localStorage.getItem(`weather_last_location`);

	if (!l || l == "" || l == undefined) {
		return "woolwich";
	} else {
		return l;
	}
}

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots('Weather', slots, []);
	let days;
	let location;
	let focussed_day;
	let focussed_hour;
	let click_player;

	// rio woolwich svalbard bangkok
	onMount(() => {
		const last_location = getLastLocation();
		chooseLocation(last_location);
	});

	function chooseLocation(loc) {
		// if (loc === "bangkok") {
		//   location = constants.bangkok;
		// } else if (loc === "rio") {
		//   location = constants.rio;
		// } else if (loc === "svalbard") {
		//   location = constants.svalbard;
		// } else if (loc === "malltraeth") {
		//   location = constants.malltraeth;
		// } else {
		//   location = constants.woolwich;
		// }
		$$invalidate(1, location = constants[loc]);

		localStorage.setItem(`weather_last_location`, loc);
		getWeatherData();
	}

	function getWeatherData() {
		$$invalidate(0, days = null);
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
		let hourindex = 0;

		data.daily.forEach((day, di) => {
			const date = constants.timeToDate(day.dt);
			const hours = data.hourly.filter(h => constants.timeToDate(h.dt) === date);
			const first_hour = hours[0];
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

			hours.forEach(h => {
				h.time = constants.timeToHour(h.dt);
				h.index = hourindex;
				hourindex++;
			});

			day.hours = hours;

			// day.temp_line_chart = tempLineChart(hours);
			// day.temp_bar_chart = tempBarChart(hours);
			day.temp_svg = tempSVGChart(hours);

			if (di == 0) {
				focusOnHour(day, first_hour);
			}
		});

		$$invalidate(0, days = data.daily);
	}

	function tempSVGChart(hours) {
		let pl = [];
		let temps = hours.map(h => h.temp);
		let lastx, lasty;
		let polygons = [];

		temps.forEach((temp, i) => {
			if (temp) {
				const x = Math.round(constants.map(i + 1, 0, temps.length, 0, 100));
				const y = Math.round(constants.map(temp, constants.MIN_TEMP, constants.MAX_TEMP, svg_height, 0) * 10) / 10;

				if (!lastx) {
					lastx = Math.round(constants.map(i, 0, temps.length, 0, 100));
					lasty = y;
					pl.push(`${lastx}, ${y}`);
				}

				pl.push(`${x}, ${y}`);

				if (lasty) {
					polygons.push({
						points: `${lastx}, ${lasty},${x}, ${y},${x}, ${svg_height},${lastx}, ${svg_height} `,
						hour: hours[i]
					});
				}

				lastx = x;
				lasty = y;
			}
		});

		const polyline = pl.join(",");
		return { polyline, polygons };
	}

	function tempBarChart(hours) {
		const alltemps = hours.filter(h => h.temp !== false).map(h => h.temp);
		const maxtemp = Math.max(...alltemps);
		const lowtemp = Math.min(...alltemps);
		let maxtaken = false;
		let mintaken = false;

		const bc = hours.map(h => {
			const ct = constants.constrain(h.temp, constants.MIN_TEMP, constants.MAX_TEMP);

			const he = h.temp === false
			? 0
			: constants.map(ct, constants.MIN_TEMP, constants.MAX_TEMP, 3, 100);

			let rt = false;

			if (h.temp === maxtemp && !maxtaken) {
				maxtaken = true;
				rt = `${constants.roundTemp(h.temp)}°`;
			} else if (h.temp === lowtemp && !mintaken) {
				mintaken = true;
				rt = `${constants.roundTemp(h.temp)}°`;
			}

			return {
				value: `${constants.roundTemp(h.temp)}`,
				height: he,
				rt,
				hour: h
			};
		});

		return bc;
	}

	function tempLineChart(hours) {
		let temps = hours.map(h => h.temp);
		let txy = [];
		let oldx, oldy;

		temps.forEach((temp, i) => {
			const x = i / temps.length * 100;
			const y = constants.map(temp, constants.MIN_TEMP, constants.MAX_TEMP, 0, 100);

			if (oldx && x) {
				var a = oldx - x;
				var b = oldy - y;
				var length = Math.sqrt(a * a + b * b);
				var theta = Math.atan2(y - oldy, x - oldx) * 180 / Math.PI;

				txy.push({
					value: temp,
					x,
					y,
					oldx,
					oldy,
					length,
					theta
				});
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

		constants.doFetch(action, "GET", null).then(response => {
			const data = response;
			processData(data);
			response.now = Date.now();
			const r = JSON.stringify(response);
			localStorage.setItem(`weather_${location.name}`, r);
		}).catch(error => {
			console.log(error);
		});
	}

	function focusOnHourByPos(event, day) {
		let tar = event.target;

		// 'UL'
		while (tar.nodeName !== "svg") {
			tar = tar.parentElement;
		}

		const xx = event.touches ? event.touches[0].clientX : event.clientX;

		if (xx) {
			const bb = tar.getBoundingClientRect();
			const w = bb.width;
			const x = xx - bb.left;
			const p = x / w;
			const hl = day.hours.length;
			const ind = Math.floor(p * hl);
			const hr = day.hours[ind];

			if (hr) {
				if (hr.temp) {
					focusOnHour(day, day.hours[ind]);
				}
			}
		}
	}

	function focusOnHour(day, hour) {
		$$invalidate(3, focussed_hour = hour);
		$$invalidate(2, focussed_day = day);
	} //  playClick();

	function playClick() {
		if (click_player) {
			click_player.volume = 0.5;
			click_player.currentTime = 0;
			click_player.play();
		}
	}

	function loadClick() {
		click_player = new Audio(constants.click_file);
	}

	function handleKeyUp(e) {
		if (e.key == "ArrowRight" || e.key == "ArrowLeft") {
			if (focussed_hour) {
				let diff = e.key == "ArrowRight" ? 1 : -1;
				const newindex = focussed_hour.index + diff;
				let hourchange = null;
				let daychange = null;

				days.forEach(day => {
					const newhour = day.hours.find(h => h.index == newindex && h.temp);

					if (newhour) {
						daychange = day;
						hourchange = newhour;
					}
				});

				if (hourchange) {
					focusOnHour(daychange, hourchange);
				}
			}
		}
	}

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Weather> was created with unknown prop '${key}'`);
	});

	const mousemove_handler = (day, e) => focusOnHourByPos(e, day);
	const touchmove_handler = (day, e) => focusOnHourByPos(e, day);
	const click_handler = loc => chooseLocation(loc);

	$$self.$capture_state = () => ({
		onMount,
		constants,
		WeatherInfo,
		days,
		location,
		focussed_day,
		focussed_hour,
		click_player,
		svg_height,
		chooseLocation,
		getWeatherData,
		processData,
		tempSVGChart,
		tempBarChart,
		tempLineChart,
		getWeatherFromAPI,
		getLastLocation,
		focusOnHourByPos,
		focusOnHour,
		playClick,
		loadClick,
		handleKeyUp
	});

	$$self.$inject_state = $$props => {
		if ('days' in $$props) $$invalidate(0, days = $$props.days);
		if ('location' in $$props) $$invalidate(1, location = $$props.location);
		if ('focussed_day' in $$props) $$invalidate(2, focussed_day = $$props.focussed_day);
		if ('focussed_hour' in $$props) $$invalidate(3, focussed_hour = $$props.focussed_hour);
		if ('click_player' in $$props) click_player = $$props.click_player;
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [
		days,
		location,
		focussed_day,
		focussed_hour,
		chooseLocation,
		focusOnHourByPos,
		handleKeyUp,
		mousemove_handler,
		touchmove_handler,
		click_handler
	];
}

class Weather extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [-1, -1]);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Weather",
			options,
			id: create_fragment$1.name
		});
	}
}

const target = document.querySelector("#svelte-weather");
target.innerHTML = "";
const weather = new Weather({
  target: target,
  props: {},
});

export default weather;
//# sourceMappingURL=weather.js.map

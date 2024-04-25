
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
  cork: { name: "cork", lat: 51.9, lng: -8.48 },
  ANIMATED_ICONS: false,
  CACHE_LENGTH: 20 * 60 * 1000, // 20 minutes
  USE_CACHE: true,
  MAX_TEMP: 45,
  MIN_TEMP: -10,
  available_locations: ["london", "woolwich", "malltraeth"],
  unavailable_locations: ["svalbard", "bangkok", "rio", "cork"],
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

// (11:2) {#if day.weather}
function create_if_block(ctx) {
	let h3;
	let span0;
	let t0_value = constants.timeToDayOfWeek(/*day*/ ctx[0].dt) + "";
	let t0;
	let t1;
	let span1;
	let t2_value = constants.timeToDate(/*day*/ ctx[0].dt) + "";
	let t2;
	let t3;
	let t4;
	let div0;
	let div0_class_value;
	let t5;
	let div1;
	let t6;
	let div2;
	let t7_value = /*day*/ ctx[0].weather[0].main + "";
	let t7;
	let t8;
	let span4;
	let span2;
	let t9;
	let t10_value = constants.roundSpeed(/*day*/ ctx[0].wind_speed) + "";
	let t10;
	let span3;
	let if_block0 = /*day*/ ctx[0].time && create_if_block_2(ctx);

	function select_block_type(ctx, dirty) {
		if (/*day*/ ctx[0].temp.min && /*day*/ ctx[0].temp.max) return create_if_block_1;
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
			add_location(span0, file, 12, 6, 177);
			attr_dev(span1, "class", "date");
			add_location(span1, file, 13, 6, 250);
			add_location(h3, file, 11, 4, 166);
			attr_dev(div0, "class", div0_class_value = "icon icon_" + /*day*/ ctx[0].weather[0].icon);
			add_location(div0, file, 20, 4, 410);
			attr_dev(div1, "class", "temperatures");
			add_location(div1, file, 21, 4, 466);
			attr_dev(span2, "class", "icon icon_wind");
			set_style(span2, "transform", constants.windSpeedAndDirection(/*day*/ ctx[0].wind_speed, /*day*/ ctx[0].wind_deg));
			add_location(span2, file, 44, 8, 1278);
			attr_dev(span3, "class", "wind_units");
			add_location(span3, file, 51, 46, 1506);
			attr_dev(span4, "class", "wind_speed");
			add_location(span4, file, 43, 6, 1244);
			attr_dev(div2, "class", "weather_description");
			add_location(div2, file, 41, 4, 1176);
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
			if (dirty & /*day*/ 1 && t0_value !== (t0_value = constants.timeToDayOfWeek(/*day*/ ctx[0].dt) + "")) set_data_dev(t0, t0_value);
			if (dirty & /*day*/ 1 && t2_value !== (t2_value = constants.timeToDate(/*day*/ ctx[0].dt) + "")) set_data_dev(t2, t2_value);

			if (/*day*/ ctx[0].time) {
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

			if (dirty & /*day*/ 1 && div0_class_value !== (div0_class_value = "icon icon_" + /*day*/ ctx[0].weather[0].icon)) {
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

			if (dirty & /*day*/ 1 && t7_value !== (t7_value = /*day*/ ctx[0].weather[0].main + "")) set_data_dev(t7, t7_value);

			if (dirty & /*day*/ 1) {
				set_style(span2, "transform", constants.windSpeedAndDirection(/*day*/ ctx[0].wind_speed, /*day*/ ctx[0].wind_deg));
			}

			if (dirty & /*day*/ 1 && t10_value !== (t10_value = constants.roundSpeed(/*day*/ ctx[0].wind_speed) + "")) set_data_dev(t10, t10_value);
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
		source: "(11:2) {#if day.weather}",
		ctx
	});

	return block;
}

// (16:6) {#if day.time}
function create_if_block_2(ctx) {
	let span;
	let t0_value = /*day*/ ctx[0].time + "";
	let t0;
	let t1;

	const block = {
		c: function create() {
			span = element("span");
			t0 = text(t0_value);
			t1 = text(":00");
			attr_dev(span, "class", "hour_time");
			add_location(span, file, 16, 8, 338);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t0);
			append_dev(span, t1);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*day*/ 1 && t0_value !== (t0_value = /*day*/ ctx[0].time + "")) set_data_dev(t0, t0_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(16:6) {#if day.time}",
		ctx
	});

	return block;
}

// (34:6) {:else}
function create_else_block(ctx) {
	let div;
	let t0_value = constants.roundTemp(/*day*/ ctx[0].temp) + "";
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
			add_location(span0, file, 36, 10, 1042);
			attr_dev(span1, "class", "temperature_unit");
			add_location(span1, file, 37, 10, 1093);
			attr_dev(div, "class", "high_temperature");
			add_location(div, file, 34, 8, 959);
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
			if (dirty & /*day*/ 1 && t0_value !== (t0_value = constants.roundTemp(/*day*/ ctx[0].temp) + "")) set_data_dev(t0, t0_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block.name,
		type: "else",
		source: "(34:6) {:else}",
		ctx
	});

	return block;
}

// (23:6) {#if day.temp.min && day.temp.max}
function create_if_block_1(ctx) {
	let div0;
	let t0_value = constants.roundTemp(/*day*/ ctx[0].temp.min) + "";
	let t0;
	let t1;
	let span0;
	let t3;
	let span1;
	let t5;
	let div1;
	let t6_value = constants.roundTemp(/*day*/ ctx[0].temp.max) + "";
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
			add_location(span0, file, 25, 10, 628);
			attr_dev(span1, "class", "temperature_unit");
			add_location(span1, file, 26, 10, 679);
			attr_dev(div0, "class", "low_temperature");
			add_location(div0, file, 23, 8, 542);
			attr_dev(span2, "class", "degree_symbol");
			add_location(span2, file, 30, 10, 830);
			attr_dev(span3, "class", "temperature_unit");
			add_location(span3, file, 31, 10, 881);
			attr_dev(div1, "class", "high_temperature");
			add_location(div1, file, 28, 8, 743);
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
			if (dirty & /*day*/ 1 && t0_value !== (t0_value = constants.roundTemp(/*day*/ ctx[0].temp.min) + "")) set_data_dev(t0, t0_value);
			if (dirty & /*day*/ 1 && t6_value !== (t6_value = constants.roundTemp(/*day*/ ctx[0].temp.max) + "")) set_data_dev(t6, t6_value);
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
		source: "(23:6) {#if day.temp.min && day.temp.max}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let div;
	let if_block = /*day*/ ctx[0].weather && create_if_block(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if (if_block) if_block.c();
			add_location(div, file, 9, 0, 136);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if (if_block) if_block.m(div, null);
		},
		p: function update(ctx, [dirty]) {
			if (/*day*/ ctx[0].weather) {
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
	let { day } = $$props;

	onMount(() => {
		
	});

	$$self.$$.on_mount.push(function () {
		if (day === undefined && !('day' in $$props || $$self.$$.bound[$$self.$$.props['day']])) {
			console.warn("<WeatherInfo> was created without expected prop 'day'");
		}
	});

	const writable_props = ['day'];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WeatherInfo> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ('day' in $$props) $$invalidate(0, day = $$props.day);
	};

	$$self.$capture_state = () => ({ onMount, constants, day });

	$$self.$inject_state = $$props => {
		if ('day' in $$props) $$invalidate(0, day = $$props.day);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [day];
}

class WeatherInfo extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, { day: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "WeatherInfo",
			options,
			id: create_fragment.name
		});
	}

	get day() {
		throw new Error("<WeatherInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set day(value) {
		throw new Error("<WeatherInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* svelte/Weather.svelte generated by Svelte v3.59.2 */

const { console: console_1 } = globals;
const file$1 = "svelte/Weather.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[18] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	child_ctx[23] = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[24] = list[i];
	child_ctx[26] = i;
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[27] = list[i];
	child_ctx[29] = i;
	return child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[27] = list[i];
	child_ctx[29] = i;
	return child_ctx;
}

// (255:2) {#if days}
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
			add_location(section0, file$1, 255, 4, 6539);
			attr_dev(div, "class", "button_group");
			add_location(div, file$1, 331, 6, 9174);
			add_location(section1, file$1, 330, 4, 9158);
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
			if (dirty & /*days, constants, Math, focusOnHourByPos, focussed_hour, focussed_day*/ 45) {
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

			if (dirty & /*constants, location, chooseLocation*/ 18) {
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
		source: "(255:2) {#if days}",
		ctx
	});

	return block;
}

// (258:8) {#if di < 7}
function create_if_block_1$1(ctx) {
	let div;
	let current_block_type_index;
	let if_block0;
	let t0;
	let t1;
	let t2;
	let div_class_value;
	let t3;
	let current;
	const if_block_creators = [create_if_block_7, create_else_block_1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*focussed_hour*/ ctx[3] && /*focussed_day*/ ctx[2] == /*day*/ ctx[21]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	let if_block1 = /*day*/ ctx[21].temp_line_chart && create_if_block_6(ctx);
	let if_block2 = /*day*/ ctx[21].temp_bar_chart && create_if_block_4(ctx);

	function select_block_type_1(ctx, dirty) {
		if (/*day*/ ctx[21].hours.length > 4) return create_if_block_2$1;
		return create_else_block$1;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block3 = current_block_type(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			if_block3.c();
			t3 = space();
			attr_dev(div, "class", div_class_value = "day weather_" + /*day*/ ctx[21].weather[0].icon);
			add_location(div, file$1, 258, 10, 6626);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			append_dev(div, t0);
			if (if_block1) if_block1.m(div, null);
			append_dev(div, t1);
			if (if_block2) if_block2.m(div, null);
			append_dev(div, t2);
			if_block3.m(div, null);
			insert_dev(target, t3, anchor);
			current = true;
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

			if (/*day*/ ctx[21].temp_line_chart) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_6(ctx);
					if_block1.c();
					if_block1.m(div, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*day*/ ctx[21].temp_bar_chart) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_4(ctx);
					if_block2.c();
					if_block2.m(div, t2);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block3) {
				if_block3.p(ctx, dirty);
			} else {
				if_block3.d(1);
				if_block3 = current_block_type(ctx);

				if (if_block3) {
					if_block3.c();
					if_block3.m(div, null);
				}
			}

			if (!current || dirty & /*days*/ 1 && div_class_value !== (div_class_value = "day weather_" + /*day*/ ctx[21].weather[0].icon)) {
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
			if (if_block2) if_block2.d();
			if_block3.d();
			if (detaching) detach_dev(t3);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$1.name,
		type: "if",
		source: "(258:8) {#if di < 7}",
		ctx
	});

	return block;
}

// (262:12) {:else}
function create_else_block_1(ctx) {
	let weatherinfo;
	let current;

	weatherinfo = new WeatherInfo({
			props: { day: /*day*/ ctx[21] },
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
			if (dirty & /*days*/ 1) weatherinfo_changes.day = /*day*/ ctx[21];
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
		source: "(262:12) {:else}",
		ctx
	});

	return block;
}

// (260:12) {#if focussed_hour && focussed_day == day}
function create_if_block_7(ctx) {
	let weatherinfo;
	let current;

	weatherinfo = new WeatherInfo({
			props: { day: /*focussed_hour*/ ctx[3] },
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
			if (dirty & /*focussed_hour*/ 8) weatherinfo_changes.day = /*focussed_hour*/ ctx[3];
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
		id: create_if_block_7.name,
		type: "if",
		source: "(260:12) {#if focussed_hour && focussed_day == day}",
		ctx
	});

	return block;
}

// (265:12) {#if day.temp_line_chart}
function create_if_block_6(ctx) {
	let div;
	let each_value_4 = /*day*/ ctx[21].temp_line_chart;
	validate_each_argument(each_value_4);
	let each_blocks = [];

	for (let i = 0; i < each_value_4.length; i += 1) {
		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
	}

	const block = {
		c: function create() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", "temperature_line_graph");
			add_location(div, file$1, 265, 14, 6905);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div, null);
				}
			}
		},
		p: function update(ctx, dirty) {
			if (dirty & /*days*/ 1) {
				each_value_4 = /*day*/ ctx[21].temp_line_chart;
				validate_each_argument(each_value_4);
				let i;

				for (i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4(ctx, each_value_4, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_4(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_4.length;
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_6.name,
		type: "if",
		source: "(265:12) {#if day.temp_line_chart}",
		ctx
	});

	return block;
}

// (267:16) {#each day.temp_line_chart as temp, t1}
function create_each_block_4(ctx) {
	let div;
	let t0_value = /*temp*/ ctx[27].value + "";
	let t0;
	let t1_1;

	const block = {
		c: function create() {
			div = element("div");
			t0 = text(t0_value);
			t1_1 = space();
			attr_dev(div, "class", "temp");
			set_style(div, "top", `${/*temp*/ ctx[27].oldy}%`);
			set_style(div, "left", `${/*temp*/ ctx[27].oldx}%`);
			set_style(div, "width", `${/*temp*/ ctx[27].length}%`);
			set_style(div, "transform", `rotate(${/*temp*/ ctx[27].theta}deg)`);
			add_location(div, file$1, 267, 18, 7016);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t0);
			append_dev(div, t1_1);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*days*/ 1 && t0_value !== (t0_value = /*temp*/ ctx[27].value + "")) set_data_dev(t0, t0_value);

			if (dirty & /*days*/ 1) {
				set_style(div, "top", `${/*temp*/ ctx[27].oldy}%`);
			}

			if (dirty & /*days*/ 1) {
				set_style(div, "left", `${/*temp*/ ctx[27].oldx}%`);
			}

			if (dirty & /*days*/ 1) {
				set_style(div, "width", `${/*temp*/ ctx[27].length}%`);
			}

			if (dirty & /*days*/ 1) {
				set_style(div, "transform", `rotate(${/*temp*/ ctx[27].theta}deg)`);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block_4.name,
		type: "each",
		source: "(267:16) {#each day.temp_line_chart as temp, t1}",
		ctx
	});

	return block;
}

// (280:12) {#if day.temp_bar_chart}
function create_if_block_4(ctx) {
	let div;
	let ul;
	let mounted;
	let dispose;
	let each_value_3 = /*day*/ ctx[21].temp_bar_chart;
	validate_each_argument(each_value_3);
	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	function mousemove_handler(...args) {
		return /*mousemove_handler*/ ctx[7](/*day*/ ctx[21], ...args);
	}

	const block = {
		c: function create() {
			div = element("div");
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(ul, "class", "temperature_bar_chart");
			add_location(ul, file$1, 281, 16, 7501);
			attr_dev(div, "class", "rain_thing");
			add_location(div, file$1, 280, 14, 7460);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(ul, null);
				}
			}

			if (!mounted) {
				dispose = listen_dev(ul, "mousemove", mousemove_handler, false, false, false, false);
				mounted = true;
			}
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*days*/ 1) {
				each_value_3 = /*day*/ ctx[21].temp_bar_chart;
				validate_each_argument(each_value_3);
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, null);
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
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4.name,
		type: "if",
		source: "(280:12) {#if day.temp_bar_chart}",
		ctx
	});

	return block;
}

// (293:22) {#if temp.rt}
function create_if_block_5(ctx) {
	let span;
	let t_value = /*temp*/ ctx[27].rt + "";
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(t_value);
			attr_dev(span, "class", "record_temp");
			add_location(span, file$1, 293, 24, 8016);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*days*/ 1 && t_value !== (t_value = /*temp*/ ctx[27].rt + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_5.name,
		type: "if",
		source: "(293:22) {#if temp.rt}",
		ctx
	});

	return block;
}

// (286:18) {#each day.temp_bar_chart as temp, t1}
function create_each_block_3(ctx) {
	let li;
	let t;
	let li_title_value;
	let if_block = /*temp*/ ctx[27].rt && create_if_block_5(ctx);

	const block = {
		c: function create() {
			li = element("li");
			if (if_block) if_block.c();
			t = space();
			attr_dev(li, "class", "temp");
			attr_dev(li, "title", li_title_value = `${/*temp*/ ctx[27].value}°`);
			set_style(li, "height", `${/*temp*/ ctx[27].height}%`);
			add_location(li, file$1, 286, 20, 7713);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			if (if_block) if_block.m(li, null);
			append_dev(li, t);
		},
		p: function update(ctx, dirty) {
			if (/*temp*/ ctx[27].rt) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_5(ctx);
					if_block.c();
					if_block.m(li, t);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*days*/ 1 && li_title_value !== (li_title_value = `${/*temp*/ ctx[27].value}°`)) {
				attr_dev(li, "title", li_title_value);
			}

			if (dirty & /*days*/ 1) {
				set_style(li, "height", `${/*temp*/ ctx[27].height}%`);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			if (if_block) if_block.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block_3.name,
		type: "each",
		source: "(286:18) {#each day.temp_bar_chart as temp, t1}",
		ctx
	});

	return block;
}

// (317:12) {:else}
function create_else_block$1(ctx) {
	let div1;
	let div0;
	let div1_title_value;

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			attr_dev(div0, "class", "rain_inner");
			set_style(div0, "width", `${/*day*/ ctx[21].pop * 100}%`);
			add_location(div0, file$1, 321, 16, 8958);
			attr_dev(div1, "class", "rain_thing rain_probability");
			attr_dev(div1, "title", div1_title_value = `${/*day*/ ctx[21].pop * 100}%`);
			add_location(div1, file$1, 317, 14, 8825);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*days*/ 1) {
				set_style(div0, "width", `${/*day*/ ctx[21].pop * 100}%`);
			}

			if (dirty & /*days*/ 1 && div1_title_value !== (div1_title_value = `${/*day*/ ctx[21].pop * 100}%`)) {
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
		source: "(317:12) {:else}",
		ctx
	});

	return block;
}

// (302:12) {#if day.hours.length > 4}
function create_if_block_2$1(ctx) {
	let div;
	let ul;
	let each_value_2 = /*day*/ ctx[21].hours;
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
			add_location(ul, file$1, 303, 16, 8295);
			attr_dev(div, "class", "rain_thing");
			add_location(div, file$1, 302, 14, 8254);
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
			if (dirty & /*days, constants, Math*/ 1) {
				each_value_2 = /*day*/ ctx[21].hours;
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
		source: "(302:12) {#if day.hours.length > 4}",
		ctx
	});

	return block;
}

// (310:22) {#if h1 % Math.ceil(day.hours.length / 4) == 0}
function create_if_block_3(ctx) {
	let span;
	let t_value = constants.timeToHour(/*hour*/ ctx[24].dt) + "";
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(t_value);
			add_location(span, file$1, 310, 24, 8623);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*days*/ 1 && t_value !== (t_value = constants.timeToHour(/*hour*/ ctx[24].dt) + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3.name,
		type: "if",
		source: "(310:22) {#if h1 % Math.ceil(day.hours.length / 4) == 0}",
		ctx
	});

	return block;
}

// (305:18) {#each day.hours as hour, h1}
function create_each_block_2(ctx) {
	let li;
	let show_if = /*h1*/ ctx[26] % Math.ceil(/*day*/ ctx[21].hours.length / 4) == 0;
	let t;
	let li_title_value;
	let if_block = show_if && create_if_block_3(ctx);

	const block = {
		c: function create() {
			li = element("li");
			if (if_block) if_block.c();
			t = space();
			attr_dev(li, "title", li_title_value = `${/*hour*/ ctx[24].pop * 100}%`);
			set_style(li, "height", `${/*hour*/ ctx[24].pop * 100}%`);
			add_location(li, file$1, 305, 20, 8394);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			if (if_block) if_block.m(li, null);
			append_dev(li, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*days*/ 1) show_if = /*h1*/ ctx[26] % Math.ceil(/*day*/ ctx[21].hours.length / 4) == 0;

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

			if (dirty & /*days*/ 1 && li_title_value !== (li_title_value = `${/*hour*/ ctx[24].pop * 100}%`)) {
				attr_dev(li, "title", li_title_value);
			}

			if (dirty & /*days*/ 1) {
				set_style(li, "height", `${/*hour*/ ctx[24].pop * 100}%`);
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
		source: "(305:18) {#each day.hours as hour, h1}",
		ctx
	});

	return block;
}

// (257:6) {#each days as day, di}
function create_each_block_1(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*di*/ ctx[23] < 7 && create_if_block_1$1(ctx);

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
			if (/*di*/ ctx[23] < 7) if_block.p(ctx, dirty);
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
		source: "(257:6) {#each days as day, di}",
		ctx
	});

	return block;
}

// (333:8) {#each constants.available_locations as loc}
function create_each_block(ctx) {
	let a;
	let t_value = /*loc*/ ctx[18] + "";
	let t;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[8](/*loc*/ ctx[18]);
	}

	const block = {
		c: function create() {
			a = element("a");
			t = text(t_value);
			attr_dev(a, "href", "#location");
			attr_dev(a, "class", "button");
			toggle_class(a, "primary", /*loc*/ ctx[18] == /*location*/ ctx[1].name);
			add_location(a, file$1, 333, 10, 9264);
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

			if (dirty & /*constants, location*/ 2) {
				toggle_class(a, "primary", /*loc*/ ctx[18] == /*location*/ ctx[1].name);
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
		source: "(333:8) {#each constants.available_locations as loc}",
		ctx
	});

	return block;
}

function create_fragment$1(ctx) {
	let t;
	let div;
	let current;
	let mounted;
	let dispose;
	let if_block = /*days*/ ctx[0] && create_if_block$1(ctx);

	const block = {
		c: function create() {
			t = space();
			div = element("div");
			if (if_block) if_block.c();
			toggle_class(div, "animated", constants.ANIMATED_ICONS);
			add_location(div, file$1, 253, 0, 6474);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
			insert_dev(target, div, anchor);
			if (if_block) if_block.m(div, null);
			current = true;

			if (!mounted) {
				dispose = listen_dev(document.body, "keyup", /*handleKeyUp*/ ctx[6], false, false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (/*days*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*days*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
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
			if (if_block) if_block.d();
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
			day.temp_bar_chart = tempBarChart(hours);

			if (di == 0) {
				focusOnHour(day, first_hour);
			}
		});

		$$invalidate(0, days = data.daily);
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

		while (tar.nodeName !== "UL") {
			tar = tar.parentElement;
		}

		const bb = tar.getBoundingClientRect();
		const w = bb.width;
		const x = event.clientX - bb.left;
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
		chooseLocation,
		getWeatherData,
		processData,
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
		click_handler
	];
}

class Weather extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Weather",
			options,
			id: create_fragment$1.name
		});
	}
}

const weather = new Weather({
  target: document.querySelector("#svelte-weather"),
  props: {},
});

export default weather;
//# sourceMappingURL=weather.js.map

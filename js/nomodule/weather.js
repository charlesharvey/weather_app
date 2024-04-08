System.register('app', [], function (exports) {
    'use strict';
    return {
        execute: function () {

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
            function transition_in(block, local) {
                if (block && block.i) {
                    outroing.delete(block);
                    block.i(local);
                }
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
              woolwich: { name: "woolwich", lat: 51.4909082, lng: 0.0588261 },
              rio: { name: "rio", lat: -22.9137907, lng: -43.7756334 },
              svalbard: { name: "svalbard", lat: 78.6196353, lng: 16.8016345 },
              bangkok: { name: "bangkok", lat: 13.7539475, lng: 100.5431602 },
              ANIMATED_ICONS: false,
              CACHE_LENGTH: 20 * 60 * 1000, // 20 minutes
              USE_CACHE: true,
              MAX_TEMP: 40,
              MIN_TEMP: -10,
              map: (number, inMin, inMax, outMin, outMax) => {
                return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
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

            /* svelte/Weather.svelte generated by Svelte v3.59.2 */

            const { console: console_1 } = globals;
            const file = "svelte/Weather.svelte";

            function get_each_context(ctx, list, i) {
            	const child_ctx = ctx.slice();
            	child_ctx[6] = list[i];
            	child_ctx[8] = i;
            	return child_ctx;
            }

            function get_each_context_1(ctx, list, i) {
            	const child_ctx = ctx.slice();
            	child_ctx[9] = list[i];
            	child_ctx[11] = i;
            	return child_ctx;
            }

            function get_each_context_2(ctx, list, i) {
            	const child_ctx = ctx.slice();
            	child_ctx[12] = list[i];
            	child_ctx[14] = i;
            	return child_ctx;
            }

            function get_each_context_3(ctx, list, i) {
            	const child_ctx = ctx.slice();
            	child_ctx[12] = list[i];
            	child_ctx[14] = i;
            	return child_ctx;
            }

            // (168:2) {#if days}
            function create_if_block(ctx) {
            	let section;
            	let each_value = /*days*/ ctx[0];
            	validate_each_argument(each_value);
            	let each_blocks = [];

            	for (let i = 0; i < each_value.length; i += 1) {
            		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
            	}

            	const block = {
            		c: function create() {
            			section = element("section");

            			for (let i = 0; i < each_blocks.length; i += 1) {
            				each_blocks[i].c();
            			}

            			attr_dev(section, "id", "seven_days");
            			add_location(section, file, 168, 4, 4419);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, section, anchor);

            			for (let i = 0; i < each_blocks.length; i += 1) {
            				if (each_blocks[i]) {
            					each_blocks[i].m(section, null);
            				}
            			}
            		},
            		p: function update(ctx, dirty) {
            			if (dirty & /*days, timeToHour, Math, roundSpeed, windSpeedAndDirection, roundTemp, timeToDate, timeToDayOfWeek*/ 1) {
            				each_value = /*days*/ ctx[0];
            				validate_each_argument(each_value);
            				let i;

            				for (i = 0; i < each_value.length; i += 1) {
            					const child_ctx = get_each_context(ctx, each_value, i);

            					if (each_blocks[i]) {
            						each_blocks[i].p(child_ctx, dirty);
            					} else {
            						each_blocks[i] = create_each_block(child_ctx);
            						each_blocks[i].c();
            						each_blocks[i].m(section, null);
            					}
            				}

            				for (; i < each_blocks.length; i += 1) {
            					each_blocks[i].d(1);
            				}

            				each_blocks.length = each_value.length;
            			}
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(section);
            			destroy_each(each_blocks, detaching);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_if_block.name,
            		type: "if",
            		source: "(168:2) {#if days}",
            		ctx
            	});

            	return block;
            }

            // (171:8) {#if di < 7}
            function create_if_block_1(ctx) {
            	let div5;
            	let h3;
            	let span0;
            	let t0_value = timeToDayOfWeek(/*day*/ ctx[6].dt) + "";
            	let t0;
            	let t1;
            	let span1;
            	let t2_value = timeToDate(/*day*/ ctx[6].dt) + "";
            	let t2;
            	let t3;
            	let div0;
            	let div0_class_value;
            	let t4;
            	let div3;
            	let div1;
            	let t5_value = roundTemp(/*day*/ ctx[6].temp.min) + "";
            	let t5;
            	let t6;
            	let span2;
            	let t8;
            	let span3;
            	let t10;
            	let div2;
            	let t11_value = roundTemp(/*day*/ ctx[6].temp.max) + "";
            	let t11;
            	let t12;
            	let span4;
            	let t14;
            	let span5;
            	let t16;
            	let div4;
            	let t17_value = /*day*/ ctx[6].weather[0].main + "";
            	let t17;
            	let t18;
            	let span8;
            	let span6;
            	let t19;
            	let t20_value = roundSpeed(/*day*/ ctx[6].wind_speed) + "";
            	let t20;
            	let span7;
            	let t22;
            	let t23;
            	let t24;
            	let div5_class_value;
            	let t25;
            	let if_block0 = /*day*/ ctx[6].temp_line_chart && create_if_block_6(ctx);
            	let if_block1 = /*day*/ ctx[6].temp_bar_chart && create_if_block_4(ctx);

            	function select_block_type(ctx, dirty) {
            		if (/*day*/ ctx[6].hours.length > 4) return create_if_block_2;
            		return create_else_block;
            	}

            	let current_block_type = select_block_type(ctx);
            	let if_block2 = current_block_type(ctx);

            	const block = {
            		c: function create() {
            			div5 = element("div");
            			h3 = element("h3");
            			span0 = element("span");
            			t0 = text(t0_value);
            			t1 = space();
            			span1 = element("span");
            			t2 = text(t2_value);
            			t3 = space();
            			div0 = element("div");
            			t4 = space();
            			div3 = element("div");
            			div1 = element("div");
            			t5 = text(t5_value);
            			t6 = space();
            			span2 = element("span");
            			span2.textContent = "°";
            			t8 = space();
            			span3 = element("span");
            			span3.textContent = "C";
            			t10 = space();
            			div2 = element("div");
            			t11 = text(t11_value);
            			t12 = space();
            			span4 = element("span");
            			span4.textContent = "°";
            			t14 = space();
            			span5 = element("span");
            			span5.textContent = "C";
            			t16 = space();
            			div4 = element("div");
            			t17 = text(t17_value);
            			t18 = space();
            			span8 = element("span");
            			span6 = element("span");
            			t19 = space();
            			t20 = text(t20_value);
            			span7 = element("span");
            			span7.textContent = "kmh";
            			t22 = space();
            			if (if_block0) if_block0.c();
            			t23 = space();
            			if (if_block1) if_block1.c();
            			t24 = space();
            			if_block2.c();
            			t25 = space();
            			attr_dev(span0, "class", "dayOfWeek");
            			add_location(span0, file, 173, 14, 4585);
            			attr_dev(span1, "class", "date");
            			add_location(span1, file, 174, 14, 4656);
            			add_location(h3, file, 172, 12, 4566);
            			attr_dev(div0, "class", div0_class_value = "icon icon_" + /*day*/ ctx[6].weather[0].icon);
            			add_location(div0, file, 176, 12, 4734);
            			attr_dev(span2, "class", "degree_symbol");
            			add_location(span2, file, 180, 16, 4927);
            			attr_dev(span3, "class", "temperature_unit");
            			add_location(span3, file, 181, 16, 4984);
            			attr_dev(div1, "class", "low_temperature");
            			add_location(div1, file, 178, 14, 4839);
            			attr_dev(span4, "class", "degree_symbol");
            			add_location(span4, file, 185, 16, 5149);
            			attr_dev(span5, "class", "temperature_unit");
            			add_location(span5, file, 186, 16, 5206);
            			attr_dev(div2, "class", "high_temperature");
            			add_location(div2, file, 183, 14, 5060);
            			attr_dev(div3, "class", "temperatures");
            			add_location(div3, file, 177, 12, 4798);
            			attr_dev(span6, "class", "icon icon_wind");
            			set_style(span6, "transform", windSpeedAndDirection(/*day*/ ctx[6].wind_speed, /*day*/ ctx[6].wind_deg));
            			add_location(span6, file, 192, 16, 5425);
            			attr_dev(span7, "class", "wind_units");
            			add_location(span7, file, 199, 44, 5689);
            			attr_dev(span8, "class", "wind_speed");
            			add_location(span8, file, 191, 14, 5383);
            			attr_dev(div4, "class", "weather_description");
            			add_location(div4, file, 189, 12, 5299);
            			attr_dev(div5, "class", div5_class_value = "day weather_" + /*day*/ ctx[6].weather[0].icon);
            			add_location(div5, file, 171, 10, 4506);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, div5, anchor);
            			append_dev(div5, h3);
            			append_dev(h3, span0);
            			append_dev(span0, t0);
            			append_dev(h3, t1);
            			append_dev(h3, span1);
            			append_dev(span1, t2);
            			append_dev(div5, t3);
            			append_dev(div5, div0);
            			append_dev(div5, t4);
            			append_dev(div5, div3);
            			append_dev(div3, div1);
            			append_dev(div1, t5);
            			append_dev(div1, t6);
            			append_dev(div1, span2);
            			append_dev(div1, t8);
            			append_dev(div1, span3);
            			append_dev(div3, t10);
            			append_dev(div3, div2);
            			append_dev(div2, t11);
            			append_dev(div2, t12);
            			append_dev(div2, span4);
            			append_dev(div2, t14);
            			append_dev(div2, span5);
            			append_dev(div5, t16);
            			append_dev(div5, div4);
            			append_dev(div4, t17);
            			append_dev(div4, t18);
            			append_dev(div4, span8);
            			append_dev(span8, span6);
            			append_dev(span8, t19);
            			append_dev(span8, t20);
            			append_dev(span8, span7);
            			append_dev(div5, t22);
            			if (if_block0) if_block0.m(div5, null);
            			append_dev(div5, t23);
            			if (if_block1) if_block1.m(div5, null);
            			append_dev(div5, t24);
            			if_block2.m(div5, null);
            			insert_dev(target, t25, anchor);
            		},
            		p: function update(ctx, dirty) {
            			if (dirty & /*days*/ 1 && t0_value !== (t0_value = timeToDayOfWeek(/*day*/ ctx[6].dt) + "")) set_data_dev(t0, t0_value);
            			if (dirty & /*days*/ 1 && t2_value !== (t2_value = timeToDate(/*day*/ ctx[6].dt) + "")) set_data_dev(t2, t2_value);

            			if (dirty & /*days*/ 1 && div0_class_value !== (div0_class_value = "icon icon_" + /*day*/ ctx[6].weather[0].icon)) {
            				attr_dev(div0, "class", div0_class_value);
            			}

            			if (dirty & /*days*/ 1 && t5_value !== (t5_value = roundTemp(/*day*/ ctx[6].temp.min) + "")) set_data_dev(t5, t5_value);
            			if (dirty & /*days*/ 1 && t11_value !== (t11_value = roundTemp(/*day*/ ctx[6].temp.max) + "")) set_data_dev(t11, t11_value);
            			if (dirty & /*days*/ 1 && t17_value !== (t17_value = /*day*/ ctx[6].weather[0].main + "")) set_data_dev(t17, t17_value);

            			if (dirty & /*days*/ 1) {
            				set_style(span6, "transform", windSpeedAndDirection(/*day*/ ctx[6].wind_speed, /*day*/ ctx[6].wind_deg));
            			}

            			if (dirty & /*days*/ 1 && t20_value !== (t20_value = roundSpeed(/*day*/ ctx[6].wind_speed) + "")) set_data_dev(t20, t20_value);

            			if (/*day*/ ctx[6].temp_line_chart) {
            				if (if_block0) {
            					if_block0.p(ctx, dirty);
            				} else {
            					if_block0 = create_if_block_6(ctx);
            					if_block0.c();
            					if_block0.m(div5, t23);
            				}
            			} else if (if_block0) {
            				if_block0.d(1);
            				if_block0 = null;
            			}

            			if (/*day*/ ctx[6].temp_bar_chart) {
            				if (if_block1) {
            					if_block1.p(ctx, dirty);
            				} else {
            					if_block1 = create_if_block_4(ctx);
            					if_block1.c();
            					if_block1.m(div5, t24);
            				}
            			} else if (if_block1) {
            				if_block1.d(1);
            				if_block1 = null;
            			}

            			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
            				if_block2.p(ctx, dirty);
            			} else {
            				if_block2.d(1);
            				if_block2 = current_block_type(ctx);

            				if (if_block2) {
            					if_block2.c();
            					if_block2.m(div5, null);
            				}
            			}

            			if (dirty & /*days*/ 1 && div5_class_value !== (div5_class_value = "day weather_" + /*day*/ ctx[6].weather[0].icon)) {
            				attr_dev(div5, "class", div5_class_value);
            			}
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(div5);
            			if (if_block0) if_block0.d();
            			if (if_block1) if_block1.d();
            			if_block2.d();
            			if (detaching) detach_dev(t25);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_if_block_1.name,
            		type: "if",
            		source: "(171:8) {#if di < 7}",
            		ctx
            	});

            	return block;
            }

            // (204:12) {#if day.temp_line_chart}
            function create_if_block_6(ctx) {
            	let div;
            	let each_value_3 = /*day*/ ctx[6].temp_line_chart;
            	validate_each_argument(each_value_3);
            	let each_blocks = [];

            	for (let i = 0; i < each_value_3.length; i += 1) {
            		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
            	}

            	const block = {
            		c: function create() {
            			div = element("div");

            			for (let i = 0; i < each_blocks.length; i += 1) {
            				each_blocks[i].c();
            			}

            			attr_dev(div, "class", "temperature_line_graph");
            			add_location(div, file, 204, 14, 5819);
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
            				each_value_3 = /*day*/ ctx[6].temp_line_chart;
            				validate_each_argument(each_value_3);
            				let i;

            				for (i = 0; i < each_value_3.length; i += 1) {
            					const child_ctx = get_each_context_3(ctx, each_value_3, i);

            					if (each_blocks[i]) {
            						each_blocks[i].p(child_ctx, dirty);
            					} else {
            						each_blocks[i] = create_each_block_3(child_ctx);
            						each_blocks[i].c();
            						each_blocks[i].m(div, null);
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
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_if_block_6.name,
            		type: "if",
            		source: "(204:12) {#if day.temp_line_chart}",
            		ctx
            	});

            	return block;
            }

            // (206:16) {#each day.temp_line_chart as temp, t1}
            function create_each_block_3(ctx) {
            	let div;
            	let t0_value = /*temp*/ ctx[12].value + "";
            	let t0;
            	let t1_1;

            	const block = {
            		c: function create() {
            			div = element("div");
            			t0 = text(t0_value);
            			t1_1 = space();
            			attr_dev(div, "class", "temp");
            			set_style(div, "top", `${/*temp*/ ctx[12].oldy}%`);
            			set_style(div, "left", `${/*temp*/ ctx[12].oldx}%`);
            			set_style(div, "width", `${/*temp*/ ctx[12].length}%`);
            			set_style(div, "transform", `rotate(${/*temp*/ ctx[12].theta}deg)`);
            			add_location(div, file, 206, 18, 5930);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, div, anchor);
            			append_dev(div, t0);
            			append_dev(div, t1_1);
            		},
            		p: function update(ctx, dirty) {
            			if (dirty & /*days*/ 1 && t0_value !== (t0_value = /*temp*/ ctx[12].value + "")) set_data_dev(t0, t0_value);

            			if (dirty & /*days*/ 1) {
            				set_style(div, "top", `${/*temp*/ ctx[12].oldy}%`);
            			}

            			if (dirty & /*days*/ 1) {
            				set_style(div, "left", `${/*temp*/ ctx[12].oldx}%`);
            			}

            			if (dirty & /*days*/ 1) {
            				set_style(div, "width", `${/*temp*/ ctx[12].length}%`);
            			}

            			if (dirty & /*days*/ 1) {
            				set_style(div, "transform", `rotate(${/*temp*/ ctx[12].theta}deg)`);
            			}
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(div);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_each_block_3.name,
            		type: "each",
            		source: "(206:16) {#each day.temp_line_chart as temp, t1}",
            		ctx
            	});

            	return block;
            }

            // (219:12) {#if day.temp_bar_chart}
            function create_if_block_4(ctx) {
            	let div;
            	let ul;
            	let each_value_2 = /*day*/ ctx[6].temp_bar_chart;
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

            			attr_dev(ul, "class", "temperature_bar_chart");
            			add_location(ul, file, 220, 16, 6415);
            			attr_dev(div, "class", "rain_thing");
            			add_location(div, file, 219, 14, 6374);
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
            			if (dirty & /*days*/ 1) {
            				each_value_2 = /*day*/ ctx[6].temp_bar_chart;
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
            		id: create_if_block_4.name,
            		type: "if",
            		source: "(219:12) {#if day.temp_bar_chart}",
            		ctx
            	});

            	return block;
            }

            // (228:22) {#if temp.rt}
            function create_if_block_5(ctx) {
            	let span;
            	let t_value = /*temp*/ ctx[12].rt + "";
            	let t;

            	const block = {
            		c: function create() {
            			span = element("span");
            			t = text(t_value);
            			attr_dev(span, "class", "record_temp");
            			add_location(span, file, 228, 24, 6749);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, span, anchor);
            			append_dev(span, t);
            		},
            		p: function update(ctx, dirty) {
            			if (dirty & /*days*/ 1 && t_value !== (t_value = /*temp*/ ctx[12].rt + "")) set_data_dev(t, t_value);
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(span);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_if_block_5.name,
            		type: "if",
            		source: "(228:22) {#if temp.rt}",
            		ctx
            	});

            	return block;
            }

            // (222:18) {#each day.temp_bar_chart as temp, t1}
            function create_each_block_2(ctx) {
            	let li;
            	let t;
            	let li_title_value;
            	let if_block = /*temp*/ ctx[12].rt && create_if_block_5(ctx);

            	const block = {
            		c: function create() {
            			li = element("li");
            			if (if_block) if_block.c();
            			t = space();
            			attr_dev(li, "class", "temp");
            			attr_dev(li, "title", li_title_value = `${/*temp*/ ctx[12].value}`);
            			set_style(li, "height", `${/*temp*/ ctx[12].height}%`);
            			add_location(li, file, 222, 20, 6527);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, li, anchor);
            			if (if_block) if_block.m(li, null);
            			append_dev(li, t);
            		},
            		p: function update(ctx, dirty) {
            			if (/*temp*/ ctx[12].rt) {
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

            			if (dirty & /*days*/ 1 && li_title_value !== (li_title_value = `${/*temp*/ ctx[12].value}`)) {
            				attr_dev(li, "title", li_title_value);
            			}

            			if (dirty & /*days*/ 1) {
            				set_style(li, "height", `${/*temp*/ ctx[12].height}%`);
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
            		source: "(222:18) {#each day.temp_bar_chart as temp, t1}",
            		ctx
            	});

            	return block;
            }

            // (252:12) {:else}
            function create_else_block(ctx) {
            	let div1;
            	let div0;
            	let div1_title_value;

            	const block = {
            		c: function create() {
            			div1 = element("div");
            			div0 = element("div");
            			attr_dev(div0, "class", "rain_inner");
            			set_style(div0, "width", `${/*day*/ ctx[6].pop * 100}%`);
            			add_location(div0, file, 256, 16, 7681);
            			attr_dev(div1, "class", "rain_thing rain_probability");
            			attr_dev(div1, "title", div1_title_value = `${/*day*/ ctx[6].pop * 100}%`);
            			add_location(div1, file, 252, 14, 7548);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, div1, anchor);
            			append_dev(div1, div0);
            		},
            		p: function update(ctx, dirty) {
            			if (dirty & /*days*/ 1) {
            				set_style(div0, "width", `${/*day*/ ctx[6].pop * 100}%`);
            			}

            			if (dirty & /*days*/ 1 && div1_title_value !== (div1_title_value = `${/*day*/ ctx[6].pop * 100}%`)) {
            				attr_dev(div1, "title", div1_title_value);
            			}
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(div1);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_else_block.name,
            		type: "else",
            		source: "(252:12) {:else}",
            		ctx
            	});

            	return block;
            }

            // (237:12) {#if day.hours.length > 4}
            function create_if_block_2(ctx) {
            	let div;
            	let ul;
            	let each_value_1 = /*day*/ ctx[6].hours;
            	validate_each_argument(each_value_1);
            	let each_blocks = [];

            	for (let i = 0; i < each_value_1.length; i += 1) {
            		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
            	}

            	const block = {
            		c: function create() {
            			div = element("div");
            			ul = element("ul");

            			for (let i = 0; i < each_blocks.length; i += 1) {
            				each_blocks[i].c();
            			}

            			attr_dev(ul, "class", "rain_chance_graph");
            			add_location(ul, file, 238, 16, 7028);
            			attr_dev(div, "class", "rain_thing");
            			add_location(div, file, 237, 14, 6987);
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
            			if (dirty & /*days, timeToHour, Math*/ 1) {
            				each_value_1 = /*day*/ ctx[6].hours;
            				validate_each_argument(each_value_1);
            				let i;

            				for (i = 0; i < each_value_1.length; i += 1) {
            					const child_ctx = get_each_context_1(ctx, each_value_1, i);

            					if (each_blocks[i]) {
            						each_blocks[i].p(child_ctx, dirty);
            					} else {
            						each_blocks[i] = create_each_block_1(child_ctx);
            						each_blocks[i].c();
            						each_blocks[i].m(ul, null);
            					}
            				}

            				for (; i < each_blocks.length; i += 1) {
            					each_blocks[i].d(1);
            				}

            				each_blocks.length = each_value_1.length;
            			}
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(div);
            			destroy_each(each_blocks, detaching);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_if_block_2.name,
            		type: "if",
            		source: "(237:12) {#if day.hours.length > 4}",
            		ctx
            	});

            	return block;
            }

            // (245:22) {#if h1 % Math.ceil(day.hours.length / 4) == 0}
            function create_if_block_3(ctx) {
            	let span;
            	let t_value = timeToHour(/*hour*/ ctx[9].dt) + "";
            	let t;

            	const block = {
            		c: function create() {
            			span = element("span");
            			t = text(t_value);
            			add_location(span, file, 245, 24, 7356);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, span, anchor);
            			append_dev(span, t);
            		},
            		p: function update(ctx, dirty) {
            			if (dirty & /*days*/ 1 && t_value !== (t_value = timeToHour(/*hour*/ ctx[9].dt) + "")) set_data_dev(t, t_value);
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(span);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_if_block_3.name,
            		type: "if",
            		source: "(245:22) {#if h1 % Math.ceil(day.hours.length / 4) == 0}",
            		ctx
            	});

            	return block;
            }

            // (240:18) {#each day.hours as hour, h1}
            function create_each_block_1(ctx) {
            	let li;
            	let show_if = /*h1*/ ctx[11] % Math.ceil(/*day*/ ctx[6].hours.length / 4) == 0;
            	let t;
            	let li_title_value;
            	let if_block = show_if && create_if_block_3(ctx);

            	const block = {
            		c: function create() {
            			li = element("li");
            			if (if_block) if_block.c();
            			t = space();
            			attr_dev(li, "title", li_title_value = `${/*hour*/ ctx[9].pop * 100}%`);
            			set_style(li, "height", `${/*hour*/ ctx[9].pop * 100}%`);
            			add_location(li, file, 240, 20, 7127);
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, li, anchor);
            			if (if_block) if_block.m(li, null);
            			append_dev(li, t);
            		},
            		p: function update(ctx, dirty) {
            			if (dirty & /*days*/ 1) show_if = /*h1*/ ctx[11] % Math.ceil(/*day*/ ctx[6].hours.length / 4) == 0;

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

            			if (dirty & /*days*/ 1 && li_title_value !== (li_title_value = `${/*hour*/ ctx[9].pop * 100}%`)) {
            				attr_dev(li, "title", li_title_value);
            			}

            			if (dirty & /*days*/ 1) {
            				set_style(li, "height", `${/*hour*/ ctx[9].pop * 100}%`);
            			}
            		},
            		d: function destroy(detaching) {
            			if (detaching) detach_dev(li);
            			if (if_block) if_block.d();
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_each_block_1.name,
            		type: "each",
            		source: "(240:18) {#each day.hours as hour, h1}",
            		ctx
            	});

            	return block;
            }

            // (170:6) {#each days as day, di}
            function create_each_block(ctx) {
            	let if_block_anchor;
            	let if_block = /*di*/ ctx[8] < 7 && create_if_block_1(ctx);

            	const block = {
            		c: function create() {
            			if (if_block) if_block.c();
            			if_block_anchor = empty();
            		},
            		m: function mount(target, anchor) {
            			if (if_block) if_block.m(target, anchor);
            			insert_dev(target, if_block_anchor, anchor);
            		},
            		p: function update(ctx, dirty) {
            			if (/*di*/ ctx[8] < 7) if_block.p(ctx, dirty);
            		},
            		d: function destroy(detaching) {
            			if (if_block) if_block.d(detaching);
            			if (detaching) detach_dev(if_block_anchor);
            		}
            	};

            	dispatch_dev("SvelteRegisterBlock", {
            		block,
            		id: create_each_block.name,
            		type: "each",
            		source: "(170:6) {#each days as day, di}",
            		ctx
            	});

            	return block;
            }

            function create_fragment(ctx) {
            	let div;
            	let if_block = /*days*/ ctx[0] && create_if_block(ctx);

            	const block = {
            		c: function create() {
            			div = element("div");
            			if (if_block) if_block.c();
            			toggle_class(div, "animated", constants.ANIMATED_ICONS);
            			add_location(div, file, 166, 0, 4354);
            		},
            		l: function claim(nodes) {
            			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            		},
            		m: function mount(target, anchor) {
            			insert_dev(target, div, anchor);
            			if (if_block) if_block.m(div, null);
            		},
            		p: function update(ctx, [dirty]) {
            			if (/*days*/ ctx[0]) {
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
            		i = i == 24 ? i = `00` : i;
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

            function instance($$self, $$props, $$invalidate) {
            	let { $$slots: slots = {}, $$scope } = $$props;
            	validate_slots('Weather', slots, []);
            	let days;
            	const location = constants.woolwich;

            	// rio woolwich svalbard bangkok
            	onMount(() => {
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
            	});

            	function processData(data) {
            		data.daily.forEach((day, di) => {
            			const date = timeToDate(day.dt);
            			const hours = data.hourly.filter(h => timeToDate(h.dt) === date);
            			const mxhrs = 18;

            			if (di == 0 && hours.length < mxhrs) {
            				while (hours.length < mxhrs) {
            					hours.unshift({ dt: 0, temp: false, pop: 0 });
            				}
            			}

            			day.hours = hours;

            			// day.temp_line_chart = tempLineChart(hours);
            			day.temp_bar_chart = tempBarChart(hours);
            		});

            		$$invalidate(0, days = data.daily);
            	}

            	function tempBarChart(hours) {
            		const alltemps = hours.filter(h => h !== false).map(h => h.temp);
            		const maxtemp = Math.max(...alltemps);
            		const lowtemp = Math.min(...alltemps);

            		const bc = hours.map(h => {
            			const he = h.temp === false
            			? 0
            			: constants.map(h.temp, constants.MIN_TEMP, constants.MAX_TEMP, 0, 100);

            			const rt = h.temp === maxtemp || h.temp === lowtemp
            			? `${roundTemp(h.temp)}°`
            			: false;

            			return {
            				value: `${roundTemp(h.temp)}`,
            				height: he,
            				rt
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

            	const writable_props = [];

            	Object.keys($$props).forEach(key => {
            		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Weather> was created with unknown prop '${key}'`);
            	});

            	$$self.$capture_state = () => ({
            		onMount,
            		constants,
            		days,
            		location,
            		processData,
            		tempBarChart,
            		tempLineChart,
            		getWeatherFromAPI,
            		roundTemp,
            		roundSpeed,
            		timeToHour,
            		timeToDayOfWeek,
            		timeToDate,
            		windSpeedAndDirection
            	});

            	$$self.$inject_state = $$props => {
            		if ('days' in $$props) $$invalidate(0, days = $$props.days);
            	};

            	if ($$props && "$$inject" in $$props) {
            		$$self.$inject_state($$props.$$inject);
            	}

            	return [days];
            }

            class Weather extends SvelteComponentDev {
            	constructor(options) {
            		super(options);
            		init(this, options, instance, create_fragment, safe_not_equal, {});

            		dispatch_dev("SvelteRegisterComponent", {
            			component: this,
            			tagName: "Weather",
            			options,
            			id: create_fragment.name
            		});
            	}
            }

            const weather = new Weather({
              target: document.querySelector("#svelte-weather"),
              props: {},
            });
            exports('default', weather);

        }
    };
});
//# sourceMappingURL=weather.js.map

function t(){}function e(t){return t()}function n(){return Object.create(null)}function o(t){t.forEach(e)}function r(t){return"function"==typeof t}function l(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function i(t,e){t.appendChild(e)}function c(t,e,n){t.insertBefore(e,n||null)}function a(t){t.parentNode&&t.parentNode.removeChild(t)}function s(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function u(t){return document.createElement(t)}function p(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function d(t){return document.createTextNode(t)}function m(){return d(" ")}function f(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function h(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function g(t,e){e=""+e,t.data!==e&&(t.data=e)}function _(t,e,n,o){null==n?t.style.removeProperty(e):t.style.setProperty(e,n,o?"important":"")}function $(t,e,n){t.classList[n?"add":"remove"](e)}let w;function y(t){w=t}function v(t){(function(){if(!w)throw new Error("Function called outside component initialization");return w})().$$.on_mount.push(t)}const b=[],x=[];let T=[];const E=[],k=Promise.resolve();let M=!1;function C(t){T.push(t)}const S=new Set;let A=0;function D(){if(0!==A)return;const t=w;do{try{for(;A<b.length;){const t=b[A];A++,y(t),N(t.$$)}}catch(t){throw b.length=0,A=0,t}for(y(null),b.length=0,A=0;x.length;)x.pop()();for(let t=0;t<T.length;t+=1){const e=T[t];S.has(e)||(S.add(e),e())}T.length=0}while(b.length);for(;E.length;)E.pop()();M=!1,S.clear(),y(t)}function N(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(C)}}const I=new Set;let O;function j(){O={r:0,c:[],p:O}}function H(){O.r||o(O.c),O=O.p}function L(t,e){t&&t.i&&(I.delete(t),t.i(e))}function P(t,e,n,o){if(t&&t.o){if(I.has(t))return;I.add(t),O.c.push(()=>{I.delete(t),o&&(n&&t.d(1),o())}),t.o(e)}else o&&o()}function F(t){t&&t.c()}function G(t,n,l,i){const{fragment:c,after_update:a}=t.$$;c&&c.m(n,l),i||C(()=>{const n=t.$$.on_mount.map(e).filter(r);t.$$.on_destroy?t.$$.on_destroy.push(...n):o(n),t.$$.on_mount=[]}),a.forEach(C)}function U(t,e){const n=t.$$;null!==n.fragment&&(!function(t){const e=[],n=[];T.forEach(o=>-1===t.indexOf(o)?e.push(o):n.push(o)),n.forEach(t=>t()),T=e}(n.after_update),o(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function B(t,e){-1===t.$$.dirty[0]&&(b.push(t),M||(M=!0,k.then(D)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function R(e,r,l,i,c,s,u,p=[-1]){const d=w;y(e);const m=e.$$={fragment:null,ctx:[],props:s,update:t,not_equal:c,bound:n(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(r.context||(d?d.$$.context:[])),callbacks:n(),dirty:p,skip_bound:!1,root:r.target||d.$$.root};u&&u(m.root);let f=!1;if(m.ctx=l?l(e,r.props||{},(t,n,...o)=>{const r=o.length?o[0]:n;return m.ctx&&c(m.ctx[t],m.ctx[t]=r)&&(!m.skip_bound&&m.bound[t]&&m.bound[t](r),f&&B(e,t)),n}):[],m.update(),f=!0,o(m.before_update),m.fragment=!!i&&i(m.ctx),r.target){if(r.hydrate){const t=(h=r.target,Array.from(h.childNodes));m.fragment&&m.fragment.l(t),t.forEach(a)}else m.fragment&&m.fragment.c();r.intro&&L(e.$$.fragment),G(e,r.target,r.anchor,r.customElement),D()}var h;y(d)}class W{$destroy(){U(this,1),this.$destroy=t}$on(e,n){if(!r(n))return t;const o=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return o.push(n),()=>{const t=o.indexOf(n);-1!==t&&o.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}var X={api_key:api_key,locations:{woolwich:{name:"woolwich",lat:51.491,lng:.0588},london:{name:"london",lat:51.513,lng:-.103},rio:{name:"rio",lat:-22.9137,lng:-43.7756},svalbard:{name:"svalbard",lat:78.6196,lng:16.8016},bangkok:{name:"bangkok",lat:13.7539,lng:100.5431},malltraeth:{name:"malltraeth",lat:53.1919,lng:-4.3941},hayonwye:{name:"hayonwye",lat:52.0738,lng:-3.1399},portmeirion:{name:"portmeirion",lat:52.9136,lng:-4.1167},cork:{name:"cork",lat:51.9,lng:-8.48},izmir:{name:"izmir",lat:38.47,lng:27.114}},available_locations:["woolwich","malltraeth"],ANIMATED_ICONS:!1,CACHE_LENGTH:12e5,USE_CACHE:!0,MAX_TEMP:45,MIN_TEMP:-10,click_file:"audio/tick.mp3",roundTemp:t=>Math.round(t),windSpeedAndDirection:(t,e)=>{let n=t/10;return` rotate(${e}deg) scale(${n=Math.min(Math.max(n,.5),1.2)})`},roundSpeed:t=>Math.round(t),timeToHour:t=>{if(t>0){const e=new Date(1e3*t),n={hour:"2-digit",hourCycle:"h24"};let o=new Intl.DateTimeFormat("en-US",n).format(e);return o=24==o?o="00":o}return""},timeToDayOfWeek:t=>{const e=new Date(1e3*t);return new Intl.DateTimeFormat("en-US",{weekday:"short"}).format(e)},timeToDate:t=>{const e=new Date(1e3*t);return new Intl.DateTimeFormat("en-US",{day:"2-digit"}).format(e)},map:(t,e,n,o,r)=>(t-e)*(r-o)/(n-e)+o,constrain:(t,e,n)=>Math.min(Math.max(t,e),n),doFetch:(t,e,n)=>(n&&(n=JSON.stringify(n)),fetch(t,{method:e,body:n}).then(t=>t.ok?t.json():t.json().then(t=>{throw t})))};function z(t){let e,n,o,r,l,s,p,f,$,w,y,v,b,x,T,E,k,M,C,S,A,D=X.timeToDayOfWeek(t[0].dt)+"",N=X.timeToDate(t[0].dt)+"",I=t[0].weather[0].main+"",O=X.roundSpeed(t[0].wind_speed)+"",j=t[0].time&&J(t);function H(t,e){return t[0].temp.min&&t[0].temp.max?K:q}let L=H(t),P=L(t);return{c(){e=u("h3"),n=u("span"),o=d(D),r=m(),l=u("span"),s=d(N),p=m(),j&&j.c(),f=m(),$=u("div"),y=m(),v=u("div"),P.c(),b=m(),x=u("div"),T=d(I),E=m(),k=u("span"),M=u("span"),C=m(),S=d(O),(A=u("span")).textContent="kmh",h(n,"class","dayOfWeek"),h(l,"class","date"),h($,"class",w="icon icon_"+t[0].weather[0].icon),h(v,"class","temperatures"),h(M,"class","icon icon_wind"),_(M,"transform",X.windSpeedAndDirection(t[0].wind_speed,t[0].wind_deg)),h(A,"class","wind_units"),h(k,"class","wind_speed"),h(x,"class","weather_description")},m(t,a){c(t,e,a),i(e,n),i(n,o),i(e,r),i(e,l),i(l,s),i(e,p),j&&j.m(e,null),c(t,f,a),c(t,$,a),c(t,y,a),c(t,v,a),P.m(v,null),c(t,b,a),c(t,x,a),i(x,T),i(x,E),i(x,k),i(k,M),i(k,C),i(k,S),i(k,A)},p(t,n){1&n&&D!==(D=X.timeToDayOfWeek(t[0].dt)+"")&&g(o,D),1&n&&N!==(N=X.timeToDate(t[0].dt)+"")&&g(s,N),t[0].time?j?j.p(t,n):((j=J(t)).c(),j.m(e,null)):j&&(j.d(1),j=null),1&n&&w!==(w="icon icon_"+t[0].weather[0].icon)&&h($,"class",w),L===(L=H(t))&&P?P.p(t,n):(P.d(1),(P=L(t))&&(P.c(),P.m(v,null))),1&n&&I!==(I=t[0].weather[0].main+"")&&g(T,I),1&n&&_(M,"transform",X.windSpeedAndDirection(t[0].wind_speed,t[0].wind_deg)),1&n&&O!==(O=X.roundSpeed(t[0].wind_speed)+"")&&g(S,O)},d(t){t&&a(e),j&&j.d(),t&&a(f),t&&a($),t&&a(y),t&&a(v),P.d(),t&&a(b),t&&a(x)}}}function J(t){let e,n,o,r=t[0].time+"";return{c(){e=u("span"),n=d(r),o=d(":00"),h(e,"class","hour_time")},m(t,r){c(t,e,r),i(e,n),i(e,o)},p(t,e){1&e&&r!==(r=t[0].time+"")&&g(n,r)},d(t){t&&a(e)}}}function q(t){let e,n,o,r,l,s,p=X.roundTemp(t[0].temp)+"";return{c(){e=u("div"),n=d(p),o=m(),(r=u("span")).textContent="°",l=m(),(s=u("span")).textContent="C",h(r,"class","degree_symbol"),h(s,"class","temperature_unit"),h(e,"class","high_temperature")},m(t,a){c(t,e,a),i(e,n),i(e,o),i(e,r),i(e,l),i(e,s)},p(t,e){1&e&&p!==(p=X.roundTemp(t[0].temp)+"")&&g(n,p)},d(t){t&&a(e)}}}function K(t){let e,n,o,r,l,s,p,f,_,$,w,y,v,b=X.roundTemp(t[0].temp.max)+"",x=X.roundTemp(t[0].temp.min)+"";return{c(){e=u("div"),n=d(b),o=m(),(r=u("span")).textContent="°",l=m(),(s=u("span")).textContent="C",p=m(),f=u("div"),_=d(x),$=m(),(w=u("span")).textContent="°",y=m(),(v=u("span")).textContent="C",h(r,"class","degree_symbol"),h(s,"class","temperature_unit"),h(e,"class","high_temperature"),h(w,"class","degree_symbol"),h(v,"class","temperature_unit"),h(f,"class","low_temperature")},m(t,a){c(t,e,a),i(e,n),i(e,o),i(e,r),i(e,l),i(e,s),c(t,p,a),c(t,f,a),i(f,_),i(f,$),i(f,w),i(f,y),i(f,v)},p(t,e){1&e&&b!==(b=X.roundTemp(t[0].temp.max)+"")&&g(n,b),1&e&&x!==(x=X.roundTemp(t[0].temp.min)+"")&&g(_,x)},d(t){t&&a(e),t&&a(p),t&&a(f)}}}function Q(e){let n,o=e[0].weather&&z(e);return{c(){n=u("div"),o&&o.c()},m(t,e){c(t,n,e),o&&o.m(n,null)},p(t,[e]){t[0].weather?o?o.p(t,e):((o=z(t)).c(),o.m(n,null)):o&&(o.d(1),o=null)},i:t,o:t,d(t){t&&a(n),o&&o.d()}}}function V(t,e,n){let{period:o}=e;return v(()=>{}),t.$$set=(t=>{"period"in t&&n(0,o=t.period)}),[o]}class Y extends W{constructor(t){super(),R(this,t,V,Q,l,{period:0})}}function Z(t,e,n){const o=t.slice();return o[20]=e[n],o}function tt(t,e,n){const o=t.slice();return o[23]=e[n],o[25]=n,o}function et(t,e,n){const o=t.slice();return o[26]=e[n],o[28]=n,o}function nt(t,e,n){const o=t.slice();return o[29]=e[n],o}function ot(t,e,n){const o=t.slice();return o[32]=e[n],o[34]=n,o}function rt(e){let n;return{c(){h(n=u("div"),"class","loading")},m(t,e){c(t,n,e)},p:t,i:t,o:t,d(t){t&&a(n)}}}function lt(t){let e,n,o,r,l,p=t[0],d=[];for(let e=0;e<p.length;e+=1)d[e]=_t(tt(t,p,e));const f=t=>P(d[t],1,1,()=>{d[t]=null});let g=X.available_locations,_=[];for(let e=0;e<g.length;e+=1)_[e]=$t(Z(t,g,e));return{c(){e=u("section");for(let t=0;t<d.length;t+=1)d[t].c();n=m(),o=u("section"),r=u("div");for(let t=0;t<_.length;t+=1)_[t].c();h(e,"id","seven_days"),h(r,"class","button_group")},m(t,a){c(t,e,a);for(let t=0;t<d.length;t+=1)d[t]&&d[t].m(e,null);c(t,n,a),c(t,o,a),i(o,r);for(let t=0;t<_.length;t+=1)_[t]&&_[t].m(r,null);l=!0},p(t,n){if(45&n[0]){let o;for(p=t[0],o=0;o<p.length;o+=1){const r=tt(t,p,o);d[o]?(d[o].p(r,n),L(d[o],1)):(d[o]=_t(r),d[o].c(),L(d[o],1),d[o].m(e,null))}for(j(),o=p.length;o<d.length;o+=1)f(o);H()}if(18&n[0]){let e;for(g=X.available_locations,e=0;e<g.length;e+=1){const o=Z(t,g,e);_[e]?_[e].p(o,n):(_[e]=$t(o),_[e].c(),_[e].m(r,null))}for(;e<_.length;e+=1)_[e].d(1);_.length=g.length}},i(t){if(!l){for(let t=0;t<p.length;t+=1)L(d[t]);l=!0}},o(t){d=d.filter(Boolean);for(let t=0;t<d.length;t+=1)P(d[t]);l=!1},d(t){t&&a(e),s(d,t),t&&a(n),t&&a(o),s(_,t)}}}function it(t){let e,n;return e=new Y({props:{period:t[23]}}),{c(){F(e.$$.fragment)},m(t,o){G(e,t,o),n=!0},p(t,n){const o={};1&n[0]&&(o.period=t[23]),e.$set(o)},i(t){n||(L(e.$$.fragment,t),n=!0)},o(t){P(e.$$.fragment,t),n=!1},d(t){U(e,t)}}}function ct(t){let e,n;return e=new Y({props:{period:t[3]}}),{c(){F(e.$$.fragment)},m(t,o){G(e,t,o),n=!0},p(t,n){const o={};8&n[0]&&(o.period=t[3]),e.$set(o)},i(t){n||(L(e.$$.fragment,t),n=!0)},o(t){P(e.$$.fragment,t),n=!1},d(t){U(e,t)}}}function at(t){let e,n,o=t[23].temp_bar_chart,r=[];for(let e=0;e<o.length;e+=1)r[e]=ut(ot(t,o,e));return{c(){e=u("div"),n=u("ul");for(let t=0;t<r.length;t+=1)r[t].c();h(n,"class","temperature_bar_chart"),h(e,"class","rain_thing")},m(t,o){c(t,e,o),i(e,n);for(let t=0;t<r.length;t+=1)r[t]&&r[t].m(n,null)},p(t,e){if(9&e[0]){let l;for(o=t[23].temp_bar_chart,l=0;l<o.length;l+=1){const i=ot(t,o,l);r[l]?r[l].p(i,e):(r[l]=ut(i),r[l].c(),r[l].m(n,null))}for(;l<r.length;l+=1)r[l].d(1);r.length=o.length}},d(t){t&&a(e),s(r,t)}}}function st(t){let e,n,o=t[32].rt+"";return{c(){e=u("span"),n=d(o),h(e,"class","record_temp")},m(t,o){c(t,e,o),i(e,n)},p(t,e){1&e[0]&&o!==(o=t[32].rt+"")&&g(n,o)},d(t){t&&a(e)}}}function ut(t){let e,n,o,r=t[32].rt&&st(t);return{c(){e=u("li"),r&&r.c(),n=m(),h(e,"class","temp"),h(e,"title",o=`${t[32].value}°`),$(e,"focussed",t[32].hour===t[3]),_(e,"height",`${t[32].height}%`)},m(t,o){c(t,e,o),r&&r.m(e,null),i(e,n)},p(t,l){t[32].rt?r?r.p(t,l):((r=st(t)).c(),r.m(e,n)):r&&(r.d(1),r=null),1&l[0]&&o!==(o=`${t[32].value}°`)&&h(e,"title",o),9&l[0]&&$(e,"focussed",t[32].hour===t[3]),1&l[0]&&_(e,"height",`${t[32].height}%`)},d(t){t&&a(e),r&&r.d()}}}function pt(t){let e,n,r,l,d,m,g,_=t[23].temp_svg.polygons,$=[];for(let e=0;e<_.length;e+=1)$[e]=dt(nt(t,_,e));function w(...e){return t[7](t[23],...e)}function y(...e){return t[8](t[23],...e)}return{c(){e=u("div"),n=p("svg"),r=p("polyline");for(let t=0;t<$.length;t+=1)$[t].c();h(r,"points",l=t[23].temp_svg.polyline),h(n,"class","sun_line_chart svelte-1slpjjj"),h(n,"height",yt),h(n,"width","100"),h(n,"viewBox",d="0 0 100 "+yt),h(n,"preserveAspectRatio","none"),h(e,"class","rain_thing")},m(t,o){c(t,e,o),i(e,n),i(n,r);for(let t=0;t<$.length;t+=1)$[t]&&$[t].m(n,null);m||(g=[f(n,"mousemove",w),f(n,"touchmove",y)],m=!0)},p(e,o){if(t=e,1&o[0]&&l!==(l=t[23].temp_svg.polyline)&&h(r,"points",l),9&o[0]){let e;for(_=t[23].temp_svg.polygons,e=0;e<_.length;e+=1){const r=nt(t,_,e);$[e]?$[e].p(r,o):($[e]=dt(r),$[e].c(),$[e].m(n,null))}for(;e<$.length;e+=1)$[e].d(1);$.length=_.length}},d(t){t&&a(e),s($,t),m=!1,o(g)}}}function dt(t){let e,n;return{c(){h(e=p("polygon"),"points",n=t[29].points),$(e,"focussed",t[29].hour===t[3])},m(t,n){c(t,e,n)},p(t,o){1&o[0]&&n!==(n=t[29].points)&&h(e,"points",n),9&o[0]&&$(e,"focussed",t[29].hour===t[3])},d(t){t&&a(e)}}}function mt(t){let e,n,o;return{c(){e=u("div"),h(n=u("div"),"class","rain_inner"),_(n,"width",`${100*t[23].pop}%`),h(e,"class","rain_thing rain_probability"),h(e,"title",o=`${100*t[23].pop}%`)},m(t,o){c(t,e,o),i(e,n)},p(t,r){1&r[0]&&_(n,"width",`${100*t[23].pop}%`),1&r[0]&&o!==(o=`${100*t[23].pop}%`)&&h(e,"title",o)},d(t){t&&a(e)}}}function ft(t){let e,n,o=t[23].hours,r=[];for(let e=0;e<o.length;e+=1)r[e]=gt(et(t,o,e));return{c(){e=u("div"),n=u("ul");for(let t=0;t<r.length;t+=1)r[t].c();h(n,"class","rain_chance_graph"),h(e,"class","rain_thing")},m(t,o){c(t,e,o),i(e,n);for(let t=0;t<r.length;t+=1)r[t]&&r[t].m(n,null)},p(t,e){if(1&e[0]){let l;for(o=t[23].hours,l=0;l<o.length;l+=1){const i=et(t,o,l);r[l]?r[l].p(i,e):(r[l]=gt(i),r[l].c(),r[l].m(n,null))}for(;l<r.length;l+=1)r[l].d(1);r.length=o.length}},d(t){t&&a(e),s(r,t)}}}function ht(t){let e,n,o=X.timeToHour(t[26].dt)+"";return{c(){e=u("span"),n=d(o)},m(t,o){c(t,e,o),i(e,n)},p(t,e){1&e[0]&&o!==(o=X.timeToHour(t[26].dt)+"")&&g(n,o)},d(t){t&&a(e)}}}function gt(t){let e,n,o,r=t[28]%Math.ceil(t[23].hours.length/4)==0,l=r&&ht(t);return{c(){e=u("li"),l&&l.c(),n=m(),h(e,"title",o=`${100*t[26].pop}%`),_(e,"height",`${100*t[26].pop}%`)},m(t,o){c(t,e,o),l&&l.m(e,null),i(e,n)},p(t,i){1&i[0]&&(r=t[28]%Math.ceil(t[23].hours.length/4)==0),r?l?l.p(t,i):((l=ht(t)).c(),l.m(e,n)):l&&(l.d(1),l=null),1&i[0]&&o!==(o=`${100*t[26].pop}%`)&&h(e,"title",o),1&i[0]&&_(e,"height",`${100*t[26].pop}%`)},d(t){t&&a(e),l&&l.d()}}}function _t(t){let e,n,o=t[25]<7&&function(t){let e,n,o,r,l,s,p,d,f;const g=[ct,it],_=[];function $(t,e){return t[3]&&t[2]==t[23]?0:1}n=$(t),o=_[n]=g[n](t);let w=t[23].temp_bar_chart&&at(t),y=t[23].temp_svg&&pt(t);function v(t,e){return t[23].hours.length>4?ft:mt}let b=v(t),x=b(t);return{c(){e=u("div"),o.c(),r=m(),w&&w.c(),l=m(),y&&y.c(),s=m(),x.c(),d=m(),h(e,"class",p="day weather_"+t[23].weather[0].icon)},m(t,o){c(t,e,o),_[n].m(e,null),i(e,r),w&&w.m(e,null),i(e,l),y&&y.m(e,null),i(e,s),x.m(e,null),c(t,d,o),f=!0},p(t,i){let c=n;(n=$(t))===c?_[n].p(t,i):(j(),P(_[c],1,1,()=>{_[c]=null}),H(),(o=_[n])?o.p(t,i):(o=_[n]=g[n](t)).c(),L(o,1),o.m(e,r)),t[23].temp_bar_chart?w?w.p(t,i):((w=at(t)).c(),w.m(e,l)):w&&(w.d(1),w=null),t[23].temp_svg?y?y.p(t,i):((y=pt(t)).c(),y.m(e,s)):y&&(y.d(1),y=null),b===(b=v(t))&&x?x.p(t,i):(x.d(1),(x=b(t))&&(x.c(),x.m(e,null))),(!f||1&i[0]&&p!==(p="day weather_"+t[23].weather[0].icon))&&h(e,"class",p)},i(t){f||(L(o),f=!0)},o(t){P(o),f=!1},d(t){t&&a(e),_[n].d(),w&&w.d(),y&&y.d(),x.d(),t&&a(d)}}}(t);return{c(){o&&o.c(),e=d("")},m(t,r){o&&o.m(t,r),c(t,e,r),n=!0},p(t,e){t[25]<7&&o.p(t,e)},i(t){n||(L(o),n=!0)},o(t){P(o),n=!1},d(t){o&&o.d(t),t&&a(e)}}}function $t(t){let e,n,o,r,l=t[20]+"";function s(){return t[9](t[20])}return{c(){e=u("a"),n=d(l),h(e,"href","#location"),h(e,"class","button"),$(e,"primary",t[20]==t[1].name)},m(t,l){c(t,e,l),i(e,n),o||(r=f(e,"click",s),o=!0)},p(n,o){t=n,2&o[0]&&$(e,"primary",t[20]==t[1].name)},d(t){t&&a(e),o=!1,r()}}}function wt(t){let e,n,o,r,l,s,d,g,_,w,y,v;const b=[lt,rt],x=[];function T(t,e){return t[0]?0:1}return o=T(t),r=x[o]=b[o](t),{c(){e=m(),n=u("div"),r.c(),l=m(),s=p("svg"),d=p("linearGradient"),g=p("stop"),_=p("stop"),h(g,"stop-color","#ddbf48"),h(g,"offset","0%"),h(_,"stop-color","#ddbf48"),h(_,"stop-opacity","0.1"),h(_,"offset","100%"),h(d,"id","Gradient1"),h(d,"x1","0"),h(d,"x2","0"),h(d,"y1","0"),h(d,"y2","1"),h(s,"class","svelte-1slpjjj"),$(n,"animated",X.ANIMATED_ICONS)},m(r,a){c(r,e,a),c(r,n,a),x[o].m(n,null),i(n,l),i(n,s),i(s,d),i(d,g),i(d,_),w=!0,y||(v=f(document.body,"keyup",t[6]),y=!0)},p(t,e){let i=o;(o=T(t))===i?x[o].p(t,e):(j(),P(x[i],1,1,()=>{x[i]=null}),H(),(r=x[o])?r.p(t,e):(r=x[o]=b[o](t)).c(),L(r,1),r.m(n,l))},i(t){w||(L(r),w=!0)},o(t){P(r),w=!1},d(t){t&&a(e),t&&a(n),x[o].d(),y=!1,v()}}}const yt=70;function vt(t,e,n){let o,r,l,i;function c(t){n(1,r=X.locations[t]),localStorage.setItem("weather_last_location",t),function(){n(0,o=null);const t=localStorage.getItem(`weather_${r.name}`);if(t&&X.USE_CACHE){const e=JSON.parse(t);Date.now()-e.now>X.CACHE_LENGTH?s():(console.log("from cache"),a(e))}else s()}()}function a(t){let e=0;t.daily.forEach((n,o)=>{const r=X.timeToDate(n.dt),l=t.hourly.filter(t=>X.timeToDate(t.dt)===r),i=l[0];if((0==o||2==o)&&l.length<23)for(;l.length<23;){const t={dt:0,temp:!1,pop:0};0==o?l.unshift(t):2==o&&l.push(t)}l.forEach(t=>{t.time=X.timeToHour(t.dt),t.index=e,e++}),n.hours=l,n.temp_svg=function(t){const e=t.filter(t=>!1!==t.temp).map(t=>t.temp),n=Math.max(...e),o=Math.min(...e);let r,l,i=!1,c=!1,a=[],s=[],u=t.map(t=>t.temp),p=[];return u.forEach((e,d)=>{if(e){const m=Math.round(X.map(d+1,0,u.length,0,100)),f=Math.round(10*X.map(e,X.MIN_TEMP,X.MAX_TEMP,yt,0))/10;r||(r=Math.round(X.map(d,0,u.length,0,100)),l=f,a.push(`${r}, ${f}`)),a.push(`${m}, ${f}`),l&&p.push({points:`${r}, ${l},${m}, ${f},${m}, ${yt},${r}, ${yt} `,hour:t[d]}),r=m,l=f,e!==n||i?e!==o||c||(c=!0,s.push({text:`${X.roundTemp(e)}°`,x:r,y:f-6})):(i=!0,s.push({text:`${X.roundTemp(e)}°`,x:r,y:f-6}))}}),{polyline:a.join(","),polygons:p,texts:s}}(l),0==o&&p(n,i)}),n(0,o=t.daily)}function s(){console.log("fromapi");const t=`https://api.openweathermap.org/data/3.0/onecall?lat=${r.lat}&lon=${r.lng}&exclude=minutely&appid=${X.api_key}&units=metric`;X.doFetch(t,"GET",null).then(t=>{a(t),t.now=Date.now();const e=JSON.stringify(t);localStorage.setItem(`weather_${r.name}`,e)}).catch(t=>{console.log(t)})}function u(t,e){let n=t.target;for(;"svg"!==n.nodeName;)n=n.parentElement;const o=t.touches?t.touches[0].clientX:t.clientX;if(o){const t=n.getBoundingClientRect(),r=t.width,l=(o-t.left)/r,i=e.hours.length,c=Math.floor(l*i),a=e.hours[c];a&&a.temp&&p(e,e.hours[c])}}function p(t,e){n(3,i=e),n(2,l=t)}v(()=>{c(function(){const t=localStorage.getItem("weather_last_location");return t&&""!=t&&null!=t?t:"woolwich"}())});return[o,r,l,i,c,u,function(t){if(("ArrowRight"==t.key||"ArrowLeft"==t.key)&&i){let e="ArrowRight"==t.key?1:-1;const n=i.index+e;let r=null,l=null;o.forEach(t=>{const e=t.hours.find(t=>t.index==n&&t.temp);e&&(l=t,r=e)}),r&&p(l,r)}},(t,e)=>u(e,t),(t,e)=>u(e,t),t=>c(t)]}const bt=document.querySelector("#svelte-weather");bt.innerHTML="";export default new class extends W{constructor(t){super(),R(this,t,vt,wt,l,{},null,[-1,-1])}}({target:bt,props:{}});
//# sourceMappingURL=weather.js.map

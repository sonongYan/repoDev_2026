import{$a as me,Aa as He,B as dt,Ba as je,C as Ve,Ca as he,D as ct,Da as Zt,E as Ut,Ea as Xt,F as qt,G as ut,Gb as Ue,Hb as R,I as pt,J as bt,Ja as Se,K as ae,Ka as Yt,Kb as ve,La as fe,Lb as D,Ma as Kt,Mb as sn,Na as Jt,Ua as en,Ya as Re,eb as gt,hb as tn,ib as nn,lb as ht,ra as xe,sb as We,ta as Gt,tb as on,ua as _e,wa as Qt}from"./chunk-UDJDSYOH.js";import{$a as $,$b as ue,$c as at,Aa as ee,Ab as ot,Ba as I,Bb as we,Cb as Le,Da as Mt,Db as Ae,Ea as v,Eb as ce,Ga as de,Ha as Pe,Ib as Pt,Jb as Nt,Ka as kt,Lc as Vt,Nb as Oe,Nc as st,Oa as y,Oc as z,Pb as C,Pc as P,Qb as X,Qc as d,Rb as Y,Sb as Fe,Tc as rt,Ub as K,Va as Ne,Vb as J,Wa as tt,Wb as Lt,Yb as At,Yc as Ht,Za as A,Zb as Ot,Zc as S,_a as F,_b as Ft,_c as jt,ac as $t,bb as j,bc as _,cb as x,cc as pe,db as H,dc as be,fd as Rt,hd as $e,ia as N,id as Wt,ja as O,jd as ze,ka as L,kb as T,lb as Bt,ma as p,mb as Dt,ob as G,qb as Q,ra as St,sa as Tt,ta as oe,ua as Et,va as De,vb as h,vc as M,wb as te,wd as W,xa as le,xb as ne,xc as zt,ya as It,yb as Z,yc as it,yd as ge,zb as nt,zd as lt}from"./chunk-BL7DIF2U.js";import{a as g,b as Be,e as _t,i as et}from"./chunk-RKVZCO54.js";function ie(...t){if(t){let r=[];for(let e=0;e<t.length;e++){let n=t[e];if(!n)continue;let o=typeof n;if(o==="string"||o==="number")r.push(n);else if(o==="object"){let i=Array.isArray(n)?[ie(...n)]:Object.entries(n).map(([s,a])=>a?s:void 0);r=i.length?r.concat(i.filter(s=>!!s)):r}}return r.join(" ").trim()}}var Rn=Object.defineProperty,rn=Object.getOwnPropertySymbols,Wn=Object.prototype.hasOwnProperty,Un=Object.prototype.propertyIsEnumerable,an=(t,r,e)=>r in t?Rn(t,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[r]=e,ln=(t,r)=>{for(var e in r||(r={}))Wn.call(r,e)&&an(t,e,r[e]);if(rn)for(var e of rn(r))Un.call(r,e)&&an(t,e,r[e]);return t};function dn(...t){if(t){let r=[];for(let e=0;e<t.length;e++){let n=t[e];if(!n)continue;let o=typeof n;if(o==="string"||o==="number")r.push(n);else if(o==="object"){let i=Array.isArray(n)?[dn(...n)]:Object.entries(n).map(([s,a])=>a?s:void 0);r=i.length?r.concat(i.filter(s=>!!s)):r}}return r.join(" ").trim()}}function qn(t){return typeof t=="function"&&"call"in t&&"apply"in t}function Gn({skipUndefined:t=!1},...r){return r?.reduce((e,n={})=>{for(let o in n){let i=n[o];if(!(t&&i===void 0))if(o==="style")e.style=ln(ln({},e.style),n.style);else if(o==="class"||o==="className")e[o]=dn(e[o],n[o]);else if(qn(i)){let s=e[o];e[o]=s?(...a)=>{s(...a),i(...a)}:i}else e[o]=i}return e},{})}function ft(...t){return Gn({skipUndefined:!1},...t)}var qe={};function Te(t="pui_id_"){return Object.hasOwn(qe,t)||(qe[t]=0),qe[t]++,`${t}${qe[t]}`}var cn=(()=>{class t extends D{name="common";static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac,providedIn:"root"})}return t})(),V=new L("PARENT_INSTANCE"),k=(()=>{class t{document=p(De);platformId=p(Pe);el=p(de);injector=p(Et);cd=p(Ht);renderer=p(Ne);config=p(sn);$parentInstance=p(V,{optional:!0,skipSelf:!0})??void 0;baseComponentStyle=p(cn);baseStyle=p(D);scopedStyleEl;parent=this.$params.parent;cn=ie;_themeScopedListener;themeChangeListenerMap=new Map;dt=d();unstyled=d();pt=d();ptOptions=d();$attrSelector=Te("pc");get $name(){return this.componentName||"UnknownComponent"}get $hostName(){return this.hostName}get $el(){return this.el?.nativeElement}directivePT=ee(void 0);directiveUnstyled=ee(void 0);$unstyled=z(()=>this.unstyled()??this.directiveUnstyled()??this.config?.unstyled()??!1);$pt=z(()=>He(this.pt()||this.directivePT(),this.$params));get $globalPT(){return this._getPT(this.config?.pt(),void 0,e=>He(e,this.$params))}get $defaultPT(){return this._getPT(this.config?.pt(),void 0,e=>this._getOptionValue(e,this.$hostName||this.$name,this.$params)||He(e,this.$params))}get $style(){return g(g({theme:void 0,css:void 0,classes:void 0,inlineStyles:void 0},(this._getHostInstance(this)||{}).$style),this._componentStyle)}get $styleOptions(){return{nonce:this.config?.csp().nonce}}get $params(){let e=this._getHostInstance(this)||this.$parentInstance;return{instance:this,parent:{instance:e}}}onInit(){}onChanges(e){}onDoCheck(){}onAfterContentInit(){}onAfterContentChecked(){}onAfterViewInit(){}onAfterViewChecked(){}onDestroy(){}constructor(){I(e=>{this.document&&!lt(this.platformId)&&(this.dt()?(this._loadScopedThemeStyles(this.dt()),this._themeScopedListener=()=>this._loadScopedThemeStyles(this.dt()),this._themeChangeListener("_themeScopedListener",this._themeScopedListener)):this._unloadScopedThemeStyles()),e(()=>{this._offThemeChangeListener("_themeScopedListener")})}),I(e=>{this.document&&!lt(this.platformId)&&(this.$unstyled()||(this._loadCoreStyles(),this._themeChangeListener("_loadCoreStyles",this._loadCoreStyles))),e(()=>{this._offThemeChangeListener("_loadCoreStyles")})}),this._hook("onBeforeInit")}ngOnInit(){this._loadCoreStyles(),this._loadStyles(),this.onInit(),this._hook("onInit")}ngOnChanges(e){this.onChanges(e),this._hook("onChanges",e)}ngDoCheck(){this.onDoCheck(),this._hook("onDoCheck")}ngAfterContentInit(){this.onAfterContentInit(),this._hook("onAfterContentInit")}ngAfterContentChecked(){this.onAfterContentChecked(),this._hook("onAfterContentChecked")}ngAfterViewInit(){this.$el?.setAttribute(this.$attrSelector,""),this.onAfterViewInit(),this._hook("onAfterViewInit")}ngAfterViewChecked(){this.onAfterViewChecked(),this._hook("onAfterViewChecked")}ngOnDestroy(){this._removeThemeListeners(),this._unloadScopedThemeStyles(),this.onDestroy(),this._hook("onDestroy")}_mergeProps(e,...n){return Gt(e)?e(...n):ft(...n)}_getHostInstance(e){return e?this.$hostName?this.$name===this.$hostName?e:this._getHostInstance(e.$parentInstance):e.$parentInstance:void 0}_getPropValue(e){return this[e]||this._getHostInstance(this)?.[e]}_getOptionValue(e,n="",o={}){return Zt(e,n,o)}_hook(e,...n){if(!this.$hostName){let o=this._usePT(this._getPT(this.$pt(),this.$name),this._getOptionValue,`hooks.${e}`),i=this._useDefaultPT(this._getOptionValue,`hooks.${e}`);o?.(...n),i?.(...n)}}_load(){ve.isStyleNameLoaded("base")||(this.baseStyle.loadBaseCSS(this.$styleOptions),this._loadGlobalStyles(),ve.setLoadedStyleName("base")),this._loadThemeStyles()}_loadStyles(){this._load(),this._themeChangeListener("_load",()=>this._load())}_loadGlobalStyles(){let e=this._useGlobalPT(this._getOptionValue,"global.css",this.$params);_e(e)&&this.baseStyle.load(e,g({name:"global"},this.$styleOptions))}_loadCoreStyles(){!ve.isStyleNameLoaded(this.$style?.name)&&this.$style?.name&&(this.baseComponentStyle.loadCSS(this.$styleOptions),this.$style.loadCSS(this.$styleOptions),ve.setLoadedStyleName(this.$style.name))}_loadThemeStyles(){if(!(this.$unstyled()||this.config?.theme()==="none")){if(!ae.isStyleNameLoaded("common")){let{primitive:e,semantic:n,global:o,style:i}=this.$style?.getCommonTheme?.()||{};this.baseStyle.load(e?.css,g({name:"primitive-variables"},this.$styleOptions)),this.baseStyle.load(n?.css,g({name:"semantic-variables"},this.$styleOptions)),this.baseStyle.load(o?.css,g({name:"global-variables"},this.$styleOptions)),this.baseStyle.loadBaseStyle(g({name:"global-style"},this.$styleOptions),i),ae.setLoadedStyleName("common")}if(!ae.isStyleNameLoaded(this.$style?.name)&&this.$style?.name){let{css:e,style:n}=this.$style?.getComponentTheme?.()||{};this.$style?.load(e,g({name:`${this.$style?.name}-variables`},this.$styleOptions)),this.$style?.loadStyle(g({name:`${this.$style?.name}-style`},this.$styleOptions),n),ae.setLoadedStyleName(this.$style?.name)}if(!ae.isStyleNameLoaded("layer-order")){let e=this.$style?.getLayerOrderThemeCSS?.();this.baseStyle.load(e,g({name:"layer-order",first:!0},this.$styleOptions)),ae.setLoadedStyleName("layer-order")}}}_loadScopedThemeStyles(e){let{css:n}=this.$style?.getPresetTheme?.(e,`[${this.$attrSelector}]`)||{},o=this.$style?.load(n,g({name:`${this.$attrSelector}-${this.$style?.name}`},this.$styleOptions));this.scopedStyleEl=o?.el}_unloadScopedThemeStyles(){this.scopedStyleEl?.remove()}_themeChangeListener(e,n=()=>{}){this._offThemeChangeListener(e),ve.clearLoadedStyleNames();let o=n.bind(this);this.themeChangeListenerMap.set(e,o),pt.on("theme:change",o)}_removeThemeListeners(){this._offThemeChangeListener("_themeScopedListener"),this._offThemeChangeListener("_loadCoreStyles"),this._offThemeChangeListener("_load")}_offThemeChangeListener(e){this.themeChangeListenerMap.has(e)&&(pt.off("theme:change",this.themeChangeListenerMap.get(e)),this.themeChangeListenerMap.delete(e))}_getPTValue(e={},n="",o={},i=!0){let s=/./g.test(n)&&!!o[n.split(".")[0]],{mergeSections:a=!0,mergeProps:l=!1}=this._getPropValue("ptOptions")?.()||this.config?.ptOptions?.()||{},u=i?s?this._useGlobalPT(this._getPTClassValue,n,o):this._useDefaultPT(this._getPTClassValue,n,o):void 0,c=s?void 0:this._usePT(this._getPT(e,this.$hostName||this.$name),this._getPTClassValue,n,Be(g({},o),{global:u||{}})),b=this._getPTDatasets(n);return a||!a&&c?l?this._mergeProps(l,u,c,b):g(g(g({},u),c),b):g(g({},c),b)}_getPTDatasets(e=""){let n="data-pc-",o=e==="root"&&_e(this.$pt()?.["data-pc-section"]);return e!=="transition"&&Be(g({},e==="root"&&Be(g({[`${n}name`]:he(o?this.$pt()?.["data-pc-section"]:this.$name)},o&&{[`${n}extend`]:he(this.$name)}),{[`${this.$attrSelector}`]:""})),{[`${n}section`]:he(e.includes(".")?e.split(".").at(-1)??"":e)})}_getPTClassValue(e,n,o){let i=this._getOptionValue(e,n,o);return je(i)||Xt(i)?{class:i}:i}_getPT(e,n="",o){let i=(s,a=!1)=>{let l=o?o(s):s,u=he(n),c=he(this.$hostName||this.$name);return(a?u!==c?l?.[u]:void 0:l?.[u])??l};return e?.hasOwnProperty("_usept")?{_usept:e._usept,originalValue:i(e.originalValue),value:i(e.value)}:i(e,!0)}_usePT(e,n,o,i){let s=a=>n?.call(this,a,o,i);if(e?.hasOwnProperty("_usept")){let{mergeSections:a=!0,mergeProps:l=!1}=e._usept||this.config?.ptOptions()||{},u=s(e.originalValue),c=s(e.value);return u===void 0&&c===void 0?void 0:je(c)?c:je(u)?u:a||!a&&c?l?this._mergeProps(l,u,c):g(g({},u),c):c}return s(e)}_useGlobalPT(e,n,o){return this._usePT(this.$globalPT,e,n,o)}_useDefaultPT(e,n,o){return this._usePT(this.$defaultPT,e,n,o)}ptm(e="",n={}){return this._getPTValue(this.$pt(),e,g(g({},this.$params),n))}ptms(e,n={}){return e.reduce((o,i)=>(o=ft(o,this.ptm(i,n))||{},o),{})}ptmo(e={},n="",o={}){return this._getPTValue(e,n,g({instance:this},o),!1)}cx(e,n={}){return this.$unstyled()?void 0:ie(this._getOptionValue(this.$style.classes,e,g(g({},this.$params),n)))}sx(e="",n=!0,o={}){if(n){let i=this._getOptionValue(this.$style.inlineStyles,e,g(g({},this.$params),o)),s=this._getOptionValue(this.baseComponentStyle.inlineStyles,e,g(g({},this.$params),o));return g(g({},s),i)}}static \u0275fac=function(n){return new(n||t)};static \u0275dir=$({type:t,inputs:{dt:[1,"dt"],unstyled:[1,"unstyled"],pt:[1,"pt"],ptOptions:[1,"ptOptions"]},features:[M([cn,D]),Mt]})}return t})();var mt=(()=>{class t{static zindex=1e3;static calculatedScrollbarWidth=null;static calculatedScrollbarHeight=null;static browser;static addClass(e,n){e&&n&&(e.classList?e.classList.add(n):e.className+=" "+n)}static addMultipleClasses(e,n){if(e&&n)if(e.classList){let o=n.trim().split(" ");for(let i=0;i<o.length;i++)e.classList.add(o[i])}else{let o=n.split(" ");for(let i=0;i<o.length;i++)e.className+=" "+o[i]}}static removeClass(e,n){e&&n&&(e.classList?e.classList.remove(n):e.className=e.className.replace(new RegExp("(^|\\b)"+n.split(" ").join("|")+"(\\b|$)","gi")," "))}static removeMultipleClasses(e,n){e&&n&&[n].flat().filter(Boolean).forEach(o=>o.split(" ").forEach(i=>this.removeClass(e,i)))}static hasClass(e,n){return e&&n?e.classList?e.classList.contains(n):new RegExp("(^| )"+n+"( |$)","gi").test(e.className):!1}static siblings(e){return Array.prototype.filter.call(e.parentNode.children,function(n){return n!==e})}static find(e,n){return Array.from(e.querySelectorAll(n))}static findSingle(e,n){return this.isElement(e)?e.querySelector(n):null}static index(e){let n=e.parentNode.childNodes,o=0;for(var i=0;i<n.length;i++){if(n[i]==e)return o;n[i].nodeType==1&&o++}return-1}static indexWithinGroup(e,n){let o=e.parentNode?e.parentNode.childNodes:[],i=0;for(var s=0;s<o.length;s++){if(o[s]==e)return i;o[s].attributes&&o[s].attributes[n]&&o[s].nodeType==1&&i++}return-1}static appendOverlay(e,n,o="self"){o!=="self"&&e&&n&&this.appendChild(e,n)}static alignOverlay(e,n,o="self",i=!0){e&&n&&(i&&(e.style.minWidth=`${t.getOuterWidth(n)}px`),o==="self"?this.relativePosition(e,n):this.absolutePosition(e,n))}static relativePosition(e,n,o=!0){let i=q=>{if(q)return getComputedStyle(q).getPropertyValue("position")==="relative"?q:i(q.parentElement)},s=e.offsetParent?{width:e.offsetWidth,height:e.offsetHeight}:this.getHiddenElementDimensions(e),a=n.offsetHeight,l=n.getBoundingClientRect(),u=this.getWindowScrollTop(),c=this.getWindowScrollLeft(),b=this.getViewport(),f=i(e)?.getBoundingClientRect()||{top:-1*u,left:-1*c},E,B,re="top";l.top+a+s.height>b.height?(E=l.top-f.top-s.height,re="bottom",l.top+E<0&&(E=-1*l.top)):(E=a+l.top-f.top,re="top");let Ce=l.left+s.width-b.width,ke=l.left-f.left;if(s.width>b.width?B=(l.left-f.left)*-1:Ce>0?B=ke-Ce:B=l.left-f.left,e.style.top=E+"px",e.style.left=B+"px",e.style.transformOrigin=re,o){let q=Jt(/-anchor-gutter$/)?.value;e.style.marginTop=re==="bottom"?`calc(${q??"2px"} * -1)`:q??""}}static absolutePosition(e,n,o=!0){let i=e.offsetParent?{width:e.offsetWidth,height:e.offsetHeight}:this.getHiddenElementDimensions(e),s=i.height,a=i.width,l=n.offsetHeight,u=n.offsetWidth,c=n.getBoundingClientRect(),b=this.getWindowScrollTop(),w=this.getWindowScrollLeft(),f=this.getViewport(),E,B;c.top+l+s>f.height?(E=c.top+b-s,e.style.transformOrigin="bottom",E<0&&(E=b)):(E=l+c.top+b,e.style.transformOrigin="top"),c.left+a>f.width?B=Math.max(0,c.left+w+u-a):B=c.left+w,e.style.top=E+"px",e.style.left=B+"px",o&&(e.style.marginTop=origin==="bottom"?"calc(var(--p-anchor-gutter) * -1)":"calc(var(--p-anchor-gutter))")}static getParents(e,n=[]){return e.parentNode===null?n:this.getParents(e.parentNode,n.concat([e.parentNode]))}static getScrollableParents(e){let n=[];if(e){let o=this.getParents(e),i=/(auto|scroll)/,s=a=>{let l=window.getComputedStyle(a,null);return i.test(l.getPropertyValue("overflow"))||i.test(l.getPropertyValue("overflowX"))||i.test(l.getPropertyValue("overflowY"))};for(let a of o){let l=a.nodeType===1&&a.dataset.scrollselectors;if(l){let u=l.split(",");for(let c of u){let b=this.findSingle(a,c);b&&s(b)&&n.push(b)}}a.nodeType!==9&&s(a)&&n.push(a)}}return n}static getHiddenElementOuterHeight(e){e.style.visibility="hidden",e.style.display="block";let n=e.offsetHeight;return e.style.display="none",e.style.visibility="visible",n}static getHiddenElementOuterWidth(e){e.style.visibility="hidden",e.style.display="block";let n=e.offsetWidth;return e.style.display="none",e.style.visibility="visible",n}static getHiddenElementDimensions(e){let n={};return e.style.visibility="hidden",e.style.display="block",n.width=e.offsetWidth,n.height=e.offsetHeight,e.style.display="none",e.style.visibility="visible",n}static scrollInView(e,n){let o=getComputedStyle(e).getPropertyValue("borderTopWidth"),i=o?parseFloat(o):0,s=getComputedStyle(e).getPropertyValue("paddingTop"),a=s?parseFloat(s):0,l=e.getBoundingClientRect(),c=n.getBoundingClientRect().top+document.body.scrollTop-(l.top+document.body.scrollTop)-i-a,b=e.scrollTop,w=e.clientHeight,f=this.getOuterHeight(n);c<0?e.scrollTop=b+c:c+f>w&&(e.scrollTop=b+c-w+f)}static fadeIn(e,n){e.style.opacity=0;let o=+new Date,i=0,s=function(){i=+e.style.opacity.replace(",",".")+(new Date().getTime()-o)/n,e.style.opacity=i,o=+new Date,+i<1&&(window.requestAnimationFrame?window.requestAnimationFrame(s):setTimeout(s,16))};s()}static fadeOut(e,n){var o=1,i=50,s=n,a=i/s;let l=setInterval(()=>{o=o-a,o<=0&&(o=0,clearInterval(l)),e.style.opacity=o},i)}static getWindowScrollTop(){let e=document.documentElement;return(window.pageYOffset||e.scrollTop)-(e.clientTop||0)}static getWindowScrollLeft(){let e=document.documentElement;return(window.pageXOffset||e.scrollLeft)-(e.clientLeft||0)}static matches(e,n){var o=Element.prototype,i=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.msMatchesSelector||function(s){return[].indexOf.call(document.querySelectorAll(s),this)!==-1};return i.call(e,n)}static getOuterWidth(e,n){let o=e.offsetWidth;if(n){let i=getComputedStyle(e);o+=parseFloat(i.marginLeft)+parseFloat(i.marginRight)}return o}static getHorizontalPadding(e){let n=getComputedStyle(e);return parseFloat(n.paddingLeft)+parseFloat(n.paddingRight)}static getHorizontalMargin(e){let n=getComputedStyle(e);return parseFloat(n.marginLeft)+parseFloat(n.marginRight)}static innerWidth(e){let n=e.offsetWidth,o=getComputedStyle(e);return n+=parseFloat(o.paddingLeft)+parseFloat(o.paddingRight),n}static width(e){let n=e.offsetWidth,o=getComputedStyle(e);return n-=parseFloat(o.paddingLeft)+parseFloat(o.paddingRight),n}static getInnerHeight(e){let n=e.offsetHeight,o=getComputedStyle(e);return n+=parseFloat(o.paddingTop)+parseFloat(o.paddingBottom),n}static getOuterHeight(e,n){let o=e.offsetHeight;if(n){let i=getComputedStyle(e);o+=parseFloat(i.marginTop)+parseFloat(i.marginBottom)}return o}static getHeight(e){let n=e.offsetHeight,o=getComputedStyle(e);return n-=parseFloat(o.paddingTop)+parseFloat(o.paddingBottom)+parseFloat(o.borderTopWidth)+parseFloat(o.borderBottomWidth),n}static getWidth(e){let n=e.offsetWidth,o=getComputedStyle(e);return n-=parseFloat(o.paddingLeft)+parseFloat(o.paddingRight)+parseFloat(o.borderLeftWidth)+parseFloat(o.borderRightWidth),n}static getViewport(){let e=window,n=document,o=n.documentElement,i=n.getElementsByTagName("body")[0],s=e.innerWidth||o.clientWidth||i.clientWidth,a=e.innerHeight||o.clientHeight||i.clientHeight;return{width:s,height:a}}static getOffset(e){var n=e.getBoundingClientRect();return{top:n.top+(window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0),left:n.left+(window.pageXOffset||document.documentElement.scrollLeft||document.body.scrollLeft||0)}}static replaceElementWith(e,n){let o=e.parentNode;if(!o)throw"Can't replace element";return o.replaceChild(n,e)}static getUserAgent(){if(navigator&&this.isClient())return navigator.userAgent}static isIE(){var e=window.navigator.userAgent,n=e.indexOf("MSIE ");if(n>0)return!0;var o=e.indexOf("Trident/");if(o>0){var i=e.indexOf("rv:");return!0}var s=e.indexOf("Edge/");return s>0}static isIOS(){return/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream}static isAndroid(){return/(android)/i.test(navigator.userAgent)}static isTouchDevice(){return"ontouchstart"in window||navigator.maxTouchPoints>0}static appendChild(e,n){if(this.isElement(n))n.appendChild(e);else if(n&&n.el&&n.el.nativeElement)n.el.nativeElement.appendChild(e);else throw"Cannot append "+n+" to "+e}static removeChild(e,n){if(this.isElement(n))n.removeChild(e);else if(n.el&&n.el.nativeElement)n.el.nativeElement.removeChild(e);else throw"Cannot remove "+e+" from "+n}static removeElement(e){"remove"in Element.prototype?e.remove():e.parentNode?.removeChild(e)}static isElement(e){return typeof HTMLElement=="object"?e instanceof HTMLElement:e&&typeof e=="object"&&e!==null&&e.nodeType===1&&typeof e.nodeName=="string"}static calculateScrollbarWidth(e){if(e){let n=getComputedStyle(e);return e.offsetWidth-e.clientWidth-parseFloat(n.borderLeftWidth)-parseFloat(n.borderRightWidth)}else{if(this.calculatedScrollbarWidth!==null)return this.calculatedScrollbarWidth;let n=document.createElement("div");n.className="p-scrollbar-measure",document.body.appendChild(n);let o=n.offsetWidth-n.clientWidth;return document.body.removeChild(n),this.calculatedScrollbarWidth=o,o}}static calculateScrollbarHeight(){if(this.calculatedScrollbarHeight!==null)return this.calculatedScrollbarHeight;let e=document.createElement("div");e.className="p-scrollbar-measure",document.body.appendChild(e);let n=e.offsetHeight-e.clientHeight;return document.body.removeChild(e),this.calculatedScrollbarWidth=n,n}static invokeElementMethod(e,n,o){e[n].apply(e,o)}static clearSelection(){if(window.getSelection&&window.getSelection())window.getSelection()?.empty?window.getSelection()?.empty():window.getSelection()?.removeAllRanges&&(window.getSelection()?.rangeCount||0)>0&&(window.getSelection()?.getRangeAt(0)?.getClientRects()?.length||0)>0&&window.getSelection()?.removeAllRanges();else if(document.selection&&document.selection.empty)try{document.selection.empty()}catch(e){}}static getBrowser(){if(!this.browser){let e=this.resolveUserAgent();this.browser={},e.browser&&(this.browser[e.browser]=!0,this.browser.version=e.version),this.browser.chrome?this.browser.webkit=!0:this.browser.webkit&&(this.browser.safari=!0)}return this.browser}static resolveUserAgent(){let e=navigator.userAgent.toLowerCase(),n=/(chrome)[ \/]([\w.]+)/.exec(e)||/(webkit)[ \/]([\w.]+)/.exec(e)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(e)||/(msie) ([\w.]+)/.exec(e)||e.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(e)||[];return{browser:n[1]||"",version:n[2]||"0"}}static isInteger(e){return Number.isInteger?Number.isInteger(e):typeof e=="number"&&isFinite(e)&&Math.floor(e)===e}static isHidden(e){return!e||e.offsetParent===null}static isVisible(e){return e&&e.offsetParent!=null}static isExist(e){return e!==null&&typeof e<"u"&&e.nodeName&&e.parentNode}static focus(e,n){e&&document.activeElement!==e&&e.focus(n)}static getFocusableSelectorString(e=""){return`button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        .p-inputtext:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e},
        .p-button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${e}`}static getFocusableElements(e,n=""){let o=this.find(e,this.getFocusableSelectorString(n)),i=[];for(let s of o){let a=getComputedStyle(s);this.isVisible(s)&&a.display!="none"&&a.visibility!="hidden"&&i.push(s)}return i}static getFocusableElement(e,n=""){let o=this.findSingle(e,this.getFocusableSelectorString(n));if(o){let i=getComputedStyle(o);if(this.isVisible(o)&&i.display!="none"&&i.visibility!="hidden")return o}return null}static getFirstFocusableElement(e,n=""){let o=this.getFocusableElements(e,n);return o.length>0?o[0]:null}static getLastFocusableElement(e,n){let o=this.getFocusableElements(e,n);return o.length>0?o[o.length-1]:null}static getNextFocusableElement(e,n=!1){let o=t.getFocusableElements(e),i=0;if(o&&o.length>0){let s=o.indexOf(o[0].ownerDocument.activeElement);n?s==-1||s===0?i=o.length-1:i=s-1:s!=-1&&s!==o.length-1&&(i=s+1)}return o[i]}static generateZIndex(){return this.zindex=this.zindex||999,++this.zindex}static getSelection(){return window.getSelection?window.getSelection()?.toString():document.getSelection?document.getSelection()?.toString():document.selection?document.selection.createRange().text:null}static getTargetElement(e,n){if(!e)return null;switch(e){case"document":return document;case"window":return window;case"@next":return n?.nextElementSibling;case"@prev":return n?.previousElementSibling;case"@parent":return n?.parentElement;case"@grandparent":return n?.parentElement?.parentElement;default:let o=typeof e;if(o==="string")return document.querySelector(e);if(o==="object"&&e.hasOwnProperty("nativeElement"))return this.isExist(e.nativeElement)?e.nativeElement:void 0;let s=(a=>!!(a&&a.constructor&&a.call&&a.apply))(e)?e():e;return s&&s.nodeType===9||this.isExist(s)?s:null}}static isClient(){return!!(typeof window<"u"&&window.document&&window.document.createElement)}static getAttribute(e,n){if(e){let o=e.getAttribute(n);return isNaN(o)?o==="true"||o==="false"?o==="true":o:+o}}static calculateBodyScrollbarWidth(){return window.innerWidth-document.documentElement.offsetWidth}static blockBodyScroll(e="p-overflow-hidden"){document.body.style.setProperty("--scrollbar-width",this.calculateBodyScrollbarWidth()+"px"),this.addClass(document.body,e)}static unblockBodyScroll(e="p-overflow-hidden"){document.body.style.removeProperty("--scrollbar-width"),this.removeClass(document.body,e)}static createElement(e,n={},...o){if(e){let i=document.createElement(e);return this.setAttributes(i,n),i.append(...o),i}}static setAttribute(e,n="",o){this.isElement(e)&&o!==null&&o!==void 0&&e.setAttribute(n,o)}static setAttributes(e,n={}){if(this.isElement(e)){let o=(i,s)=>{let a=e?.$attrs?.[i]?[e?.$attrs?.[i]]:[];return[s].flat().reduce((l,u)=>{if(u!=null){let c=typeof u;if(c==="string"||c==="number")l.push(u);else if(c==="object"){let b=Array.isArray(u)?o(i,u):Object.entries(u).map(([w,f])=>i==="style"&&(f||f===0)?`${w.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}:${f}`:f?w:void 0);l=b.length?l.concat(b.filter(w=>!!w)):l}}return l},a)};Object.entries(n).forEach(([i,s])=>{if(s!=null){let a=i.match(/^on(.+)/);a?e.addEventListener(a[1].toLowerCase(),s):i==="pBind"?this.setAttributes(e,s):(s=i==="class"?[...new Set(o("class",s))].join(" ").trim():i==="style"?o("style",s).join(";").trim():s,(e.$attrs=e.$attrs||{})&&(e.$attrs[i]=s),e.setAttribute(i,s))}})}}static isFocusableElement(e,n=""){return this.isElement(e)?e.matches(`button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${n},
                [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${n},
                input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${n},
                select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${n},
                textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${n},
                [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${n},
                [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])${n}`):!1}}return t})();function Mi(){Yt({variableName:bt("scrollbar.width").name})}function ki(){Kt({variableName:bt("scrollbar.width").name})}var un=class{element;listener;scrollableParents;constructor(r,e=()=>{}){this.element=r,this.listener=e}bindScrollListener(){this.scrollableParents=mt.getScrollableParents(this.element);for(let r=0;r<this.scrollableParents.length;r++)this.scrollableParents[r].addEventListener("scroll",this.listener)}unbindScrollListener(){if(this.scrollableParents)for(let r=0;r<this.scrollableParents.length;r++)this.scrollableParents[r].removeEventListener("scroll",this.listener)}destroy(){this.unbindScrollListener(),this.element=null,this.listener=null,this.scrollableParents=null}};var pn=(()=>{class t extends k{autofocus=!1;focused=!1;platformId=p(Pe);document=p(De);host=p(de);onAfterContentChecked(){this.autofocus===!1?this.host.nativeElement.removeAttribute("autofocus"):this.host.nativeElement.setAttribute("autofocus",!0),this.focused||this.autoFocus()}onAfterViewChecked(){this.focused||this.autoFocus()}autoFocus(){ge(this.platformId)&&this.autofocus&&setTimeout(()=>{let e=mt.getFocusableElements(this.host?.nativeElement);e.length===0&&this.host.nativeElement.focus(),e.length>0&&e[0].focus(),this.focused=!0})}static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275dir=$({type:t,selectors:[["","pAutoFocus",""]],inputs:{autofocus:[0,"pAutoFocus","autofocus"]},features:[x]})}return t})(),$i=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=F({type:t});static \u0275inj=O({})}return t})();var m=(()=>{class t{el;renderer;pBind=d(void 0);_attrs=ee(void 0);attrs=z(()=>this._attrs()||this.pBind());styles=z(()=>this.attrs()?.style);classes=z(()=>ie(this.attrs()?.class));listeners=[];constructor(e,n){this.el=e,this.renderer=n,I(()=>{let a=this.attrs()||{},{style:o,class:i}=a,s=_t(a,["style","class"]);for(let[l,u]of Object.entries(s))if(l.startsWith("on")&&typeof u=="function"){let c=l.slice(2).toLowerCase();if(!this.listeners.some(b=>b.eventName===c)){let b=this.renderer.listen(this.el.nativeElement,c,u);this.listeners.push({eventName:c,unlisten:b})}}else u==null?this.renderer.removeAttribute(this.el.nativeElement,l):(this.renderer.setAttribute(this.el.nativeElement,l,u.toString()),l in this.el.nativeElement&&(this.el.nativeElement[l]=u))})}ngOnDestroy(){this.clearListeners()}setAttrs(e){Qt(this._attrs(),e)||this._attrs.set(e)}clearListeners(){this.listeners.forEach(({unlisten:e})=>e()),this.listeners=[]}static \u0275fac=function(n){return new(n||t)(tt(de),tt(Ne))};static \u0275dir=$({type:t,selectors:[["","pBind",""]],hostVars:4,hostBindings:function(n,o){n&2&&($t(o.styles()),_(o.classes()))},inputs:{pBind:[1,"pBind"]}})}return t})(),Ge=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=F({type:t});static \u0275inj=O({})}return t})();var bn=`
    .p-badge {
        display: inline-flex;
        border-radius: dt('badge.border.radius');
        align-items: center;
        justify-content: center;
        padding: dt('badge.padding');
        background: dt('badge.primary.background');
        color: dt('badge.primary.color');
        font-size: dt('badge.font.size');
        font-weight: dt('badge.font.weight');
        min-width: dt('badge.min.width');
        height: dt('badge.height');
    }

    .p-badge-dot {
        width: dt('badge.dot.size');
        min-width: dt('badge.dot.size');
        height: dt('badge.dot.size');
        border-radius: 50%;
        padding: 0;
    }

    .p-badge-circle {
        padding: 0;
        border-radius: 50%;
    }

    .p-badge-secondary {
        background: dt('badge.secondary.background');
        color: dt('badge.secondary.color');
    }

    .p-badge-success {
        background: dt('badge.success.background');
        color: dt('badge.success.color');
    }

    .p-badge-info {
        background: dt('badge.info.background');
        color: dt('badge.info.color');
    }

    .p-badge-warn {
        background: dt('badge.warn.background');
        color: dt('badge.warn.color');
    }

    .p-badge-danger {
        background: dt('badge.danger.background');
        color: dt('badge.danger.color');
    }

    .p-badge-contrast {
        background: dt('badge.contrast.background');
        color: dt('badge.contrast.color');
    }

    .p-badge-sm {
        font-size: dt('badge.sm.font.size');
        min-width: dt('badge.sm.min.width');
        height: dt('badge.sm.height');
    }

    .p-badge-lg {
        font-size: dt('badge.lg.font.size');
        min-width: dt('badge.lg.min.width');
        height: dt('badge.lg.height');
    }

    .p-badge-xl {
        font-size: dt('badge.xl.font.size');
        min-width: dt('badge.xl.min.width');
        height: dt('badge.xl.height');
    }
`;var Qn=`
    ${bn}

    /* For PrimeNG (directive)*/
    .p-overlay-badge {
        position: relative;
    }

    .p-overlay-badge > .p-badge {
        position: absolute;
        top: 0;
        inset-inline-end: 0;
        transform: translate(50%, -50%);
        transform-origin: 100% 0;
        margin: 0;
    }
`,Zn={root:({instance:t})=>{let r=typeof t.value=="function"?t.value():t.value,e=typeof t.size=="function"?t.size():t.size,n=typeof t.badgeSize=="function"?t.badgeSize():t.badgeSize,o=typeof t.severity=="function"?t.severity():t.severity;return["p-badge p-component",{"p-badge-circle":_e(r)&&String(r).length===1,"p-badge-dot":xe(r),"p-badge-sm":e==="small"||n==="small","p-badge-lg":e==="large"||n==="large","p-badge-xl":e==="xlarge"||n==="xlarge","p-badge-info":o==="info","p-badge-success":o==="success","p-badge-warn":o==="warn","p-badge-danger":o==="danger","p-badge-secondary":o==="secondary","p-badge-contrast":o==="contrast"}]}},gn=(()=>{class t extends D{name="badge";style=Qn;classes=Zn;static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac})}return t})();var hn=new L("BADGE_INSTANCE");var vt=(()=>{class t extends k{componentName="Badge";$pcBadge=p(hn,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=p(m,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}styleClass=d();badgeSize=d();size=d();severity=d();value=d();badgeDisabled=d(!1,{transform:S});_componentStyle=p(gn);get dataP(){return this.cn({circle:this.value()!=null&&String(this.value()).length===1,empty:this.value()==null,disabled:this.badgeDisabled(),[this.severity()]:this.severity(),[this.size()]:this.size()})}static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275cmp=A({type:t,selectors:[["p-badge"]],hostVars:5,hostBindings:function(n,o){n&2&&(T("data-p",o.dataP),_(o.cn(o.cx("root"),o.styleClass())),Ft("display",o.badgeDisabled()?"none":null))},inputs:{styleClass:[1,"styleClass"],badgeSize:[1,"badgeSize"],size:[1,"size"],severity:[1,"severity"],value:[1,"value"],badgeDisabled:[1,"badgeDisabled"]},features:[M([gn,{provide:hn,useExisting:t},{provide:V,useExisting:t}]),j([m]),x],decls:1,vars:1,template:function(n,o){n&1&&pe(0),n&2&&be(o.value())},dependencies:[W,R,Ge],encapsulation:2,changeDetection:0})}return t})(),fn=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=F({type:t});static \u0275inj=O({imports:[vt,R,R]})}return t})();var Yn=["*"],Kn={root:"p-fluid"},mn=(()=>{class t extends D{name="fluid";classes=Kn;static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac})}return t})();var vn=new L("FLUID_INSTANCE"),yt=(()=>{class t extends k{componentName="Fluid";$pcFluid=p(vn,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=p(m,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}_componentStyle=p(mn);static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275cmp=A({type:t,selectors:[["p-fluid"]],hostVars:2,hostBindings:function(n,o){n&2&&_(o.cx("root"))},features:[M([mn,{provide:vn,useExisting:t},{provide:V,useExisting:t}]),j([m]),x],ngContentSelectors:Yn,decls:1,vars:0,template:function(n,o){n&1&&(X(),Y(0))},dependencies:[W],encapsulation:2,changeDetection:0})}return t})();var Jn=["*"],eo=`
.p-icon {
    display: inline-block;
    vertical-align: baseline;
    flex-shrink: 0;
}

.p-icon-spin {
    -webkit-animation: p-icon-spin 2s infinite linear;
    animation: p-icon-spin 2s infinite linear;
}

@-webkit-keyframes p-icon-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}

@keyframes p-icon-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}
`,yn=(()=>{class t extends D{name="baseicon";css=eo;static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac,providedIn:"root"})}return t})();var Qe=(()=>{class t extends k{spin=!1;_componentStyle=p(yn);getClassNames(){return ie("p-icon",{"p-icon-spin":this.spin})}static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275cmp=A({type:t,selectors:[["ng-component"]],hostAttrs:["width","14","height","14","viewBox","0 0 14 14","fill","none","xmlns","http://www.w3.org/2000/svg"],hostVars:2,hostBindings:function(n,o){n&2&&_(o.getClassNames())},inputs:{spin:[2,"spin","spin",S]},features:[M([yn]),x],ngContentSelectors:Jn,decls:1,vars:0,template:function(n,o){n&1&&(X(),Y(0))},encapsulation:2,changeDetection:0})}return t})();var to=["data-p-icon","spinner"],Cn=(()=>{class t extends Qe{pathId;onInit(){this.pathId="url(#"+Te()+")"}static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275cmp=A({type:t,selectors:[["","data-p-icon","spinner"]],features:[x],attrs:to,decls:5,vars:2,consts:[["d","M6.99701 14C5.85441 13.999 4.72939 13.7186 3.72012 13.1832C2.71084 12.6478 1.84795 11.8737 1.20673 10.9284C0.565504 9.98305 0.165424 8.89526 0.041387 7.75989C-0.0826496 6.62453 0.073125 5.47607 0.495122 4.4147C0.917119 3.35333 1.59252 2.4113 2.46241 1.67077C3.33229 0.930247 4.37024 0.413729 5.4857 0.166275C6.60117 -0.0811796 7.76026 -0.0520535 8.86188 0.251112C9.9635 0.554278 10.9742 1.12227 11.8057 1.90555C11.915 2.01493 11.9764 2.16319 11.9764 2.31778C11.9764 2.47236 11.915 2.62062 11.8057 2.73C11.7521 2.78503 11.688 2.82877 11.6171 2.85864C11.5463 2.8885 11.4702 2.90389 11.3933 2.90389C11.3165 2.90389 11.2404 2.8885 11.1695 2.85864C11.0987 2.82877 11.0346 2.78503 10.9809 2.73C9.9998 1.81273 8.73246 1.26138 7.39226 1.16876C6.05206 1.07615 4.72086 1.44794 3.62279 2.22152C2.52471 2.99511 1.72683 4.12325 1.36345 5.41602C1.00008 6.70879 1.09342 8.08723 1.62775 9.31926C2.16209 10.5513 3.10478 11.5617 4.29713 12.1803C5.48947 12.7989 6.85865 12.988 8.17414 12.7157C9.48963 12.4435 10.6711 11.7264 11.5196 10.6854C12.3681 9.64432 12.8319 8.34282 12.8328 7C12.8328 6.84529 12.8943 6.69692 13.0038 6.58752C13.1132 6.47812 13.2616 6.41667 13.4164 6.41667C13.5712 6.41667 13.7196 6.47812 13.8291 6.58752C13.9385 6.69692 14 6.84529 14 7C14 8.85651 13.2622 10.637 11.9489 11.9497C10.6356 13.2625 8.85432 14 6.99701 14Z","fill","currentColor"],[3,"id"],["width","14","height","14","fill","white"]],template:function(n,o){n&1&&(oe(),nt(0,"g"),we(1,"path",0),ot(),nt(2,"defs")(3,"clipPath",1),we(4,"rect",2),ot()()),n&2&&(T("clip-path",o.pathId),y(3),Nt("id",o.pathId))},encapsulation:2})}return t})();var no=["data-p-icon","times"],wn=(()=>{class t extends Qe{static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275cmp=A({type:t,selectors:[["","data-p-icon","times"]],features:[x],attrs:no,decls:1,vars:0,consts:[["d","M8.01186 7.00933L12.27 2.75116C12.341 2.68501 12.398 2.60524 12.4375 2.51661C12.4769 2.42798 12.4982 2.3323 12.4999 2.23529C12.5016 2.13827 12.4838 2.0419 12.4474 1.95194C12.4111 1.86197 12.357 1.78024 12.2884 1.71163C12.2198 1.64302 12.138 1.58893 12.0481 1.55259C11.9581 1.51625 11.8617 1.4984 11.7647 1.50011C11.6677 1.50182 11.572 1.52306 11.4834 1.56255C11.3948 1.60204 11.315 1.65898 11.2488 1.72997L6.99067 5.98814L2.7325 1.72997C2.59553 1.60234 2.41437 1.53286 2.22718 1.53616C2.03999 1.53946 1.8614 1.61529 1.72901 1.74767C1.59663 1.88006 1.5208 2.05865 1.5175 2.24584C1.5142 2.43303 1.58368 2.61419 1.71131 2.75116L5.96948 7.00933L1.71131 11.2675C1.576 11.403 1.5 11.5866 1.5 11.7781C1.5 11.9696 1.576 12.1532 1.71131 12.2887C1.84679 12.424 2.03043 12.5 2.2219 12.5C2.41338 12.5 2.59702 12.424 2.7325 12.2887L6.99067 8.03052L11.2488 12.2887C11.3843 12.424 11.568 12.5 11.7594 12.5C11.9509 12.5 12.1346 12.424 12.27 12.2887C12.4053 12.1532 12.4813 11.9696 12.4813 11.7781C12.4813 11.5866 12.4053 11.403 12.27 11.2675L8.01186 7.00933Z","fill","currentColor"]],template:function(n,o){n&1&&(oe(),we(0,"path",0))},encapsulation:2})}return t})();var xn=`
    .p-ink {
        display: block;
        position: absolute;
        background: dt('ripple.background');
        border-radius: 100%;
        transform: scale(0);
        pointer-events: none;
    }

    .p-ink-active {
        animation: ripple 0.4s linear;
    }

    @keyframes ripple {
        100% {
            opacity: 0;
            transform: scale(2.5);
        }
    }
`;var oo=`
    ${xn}

    /* For PrimeNG */
    .p-ripple {
        overflow: hidden;
        position: relative;
    }

    .p-ripple-disabled .p-ink {
        display: none !important;
    }

    @keyframes ripple {
        100% {
            opacity: 0;
            transform: scale(2.5);
        }
    }
`,io={root:"p-ink"},_n=(()=>{class t extends D{name="ripple";style=oo;classes=io;static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac})}return t})();var Ze=(()=>{class t extends k{componentName="Ripple";zone=p(It);_componentStyle=p(_n);animationListener;mouseDownListener;timeout;constructor(){super(),I(()=>{ge(this.platformId)&&(this.config.ripple()?this.zone.runOutsideAngular(()=>{this.create(),this.mouseDownListener=this.renderer.listen(this.el.nativeElement,"mousedown",this.onMouseDown.bind(this))}):this.remove())})}onAfterViewInit(){}onMouseDown(e){let n=this.getInk();if(!n||this.document.defaultView?.getComputedStyle(n,null).display==="none")return;if(!this.$unstyled()&&fe(n,"p-ink-active"),n.setAttribute("data-p-ink-active","false"),!gt(n)&&!ht(n)){let a=Math.max(en(this.el.nativeElement),nn(this.el.nativeElement));n.style.height=a+"px",n.style.width=a+"px"}let o=tn(this.el.nativeElement),i=e.pageX-o.left+this.document.body.scrollTop-ht(n)/2,s=e.pageY-o.top+this.document.body.scrollLeft-gt(n)/2;this.renderer.setStyle(n,"top",s+"px"),this.renderer.setStyle(n,"left",i+"px"),!this.$unstyled()&&Se(n,"p-ink-active"),n.setAttribute("data-p-ink-active","true"),this.timeout=setTimeout(()=>{let a=this.getInk();a&&(!this.$unstyled()&&fe(a,"p-ink-active"),a.setAttribute("data-p-ink-active","false"))},401)}getInk(){let e=this.el.nativeElement.children;for(let n=0;n<e.length;n++)if(typeof e[n].className=="string"&&e[n].className.indexOf("p-ink")!==-1)return e[n];return null}resetInk(){let e=this.getInk();e&&(!this.$unstyled()&&fe(e,"p-ink-active"),e.setAttribute("data-p-ink-active","false"))}onAnimationEnd(e){this.timeout&&clearTimeout(this.timeout),!this.$unstyled()&&fe(e.currentTarget,"p-ink-active"),e.currentTarget.setAttribute("data-p-ink-active","false")}create(){let e=this.renderer.createElement("span");this.renderer.addClass(e,"p-ink"),this.renderer.appendChild(this.el.nativeElement,e),this.renderer.setAttribute(e,"data-p-ink","true"),this.renderer.setAttribute(e,"data-p-ink-active","false"),this.renderer.setAttribute(e,"aria-hidden","true"),this.renderer.setAttribute(e,"role","presentation"),this.animationListener||(this.animationListener=this.renderer.listen(e,"animationend",this.onAnimationEnd.bind(this)))}remove(){let e=this.getInk();e&&(this.mouseDownListener&&this.mouseDownListener(),this.animationListener&&this.animationListener(),this.mouseDownListener=null,this.animationListener=null,on(e))}onDestroy(){this.config&&this.config.ripple()&&this.remove()}static \u0275fac=function(n){return new(n||t)};static \u0275dir=$({type:t,selectors:[["","pRipple",""]],hostAttrs:[1,"p-ripple"],features:[M([_n]),x]})}return t})(),Us=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=F({type:t});static \u0275inj=O({})}return t})();var Sn=`
    .p-button {
        display: inline-flex;
        cursor: pointer;
        user-select: none;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        color: dt('button.primary.color');
        background: dt('button.primary.background');
        border: 1px solid dt('button.primary.border.color');
        padding: dt('button.padding.y') dt('button.padding.x');
        font-size: 1rem;
        font-family: inherit;
        font-feature-settings: inherit;
        transition:
            background dt('button.transition.duration'),
            color dt('button.transition.duration'),
            border-color dt('button.transition.duration'),
            outline-color dt('button.transition.duration'),
            box-shadow dt('button.transition.duration');
        border-radius: dt('button.border.radius');
        outline-color: transparent;
        gap: dt('button.gap');
    }

    .p-button:disabled {
        cursor: default;
    }

    .p-button-icon-right {
        order: 1;
    }

    .p-button-icon-right:dir(rtl) {
        order: -1;
    }

    .p-button:not(.p-button-vertical) .p-button-icon:not(.p-button-icon-right):dir(rtl) {
        order: 1;
    }

    .p-button-icon-bottom {
        order: 2;
    }

    .p-button-icon-only {
        width: dt('button.icon.only.width');
        padding-inline-start: 0;
        padding-inline-end: 0;
        gap: 0;
    }

    .p-button-icon-only.p-button-rounded {
        border-radius: 50%;
        height: dt('button.icon.only.width');
    }

    .p-button-icon-only .p-button-label {
        visibility: hidden;
        width: 0;
    }

    .p-button-icon-only::after {
        content: "\xA0";
        visibility: hidden;
        width: 0;
    }

    .p-button-sm {
        font-size: dt('button.sm.font.size');
        padding: dt('button.sm.padding.y') dt('button.sm.padding.x');
    }

    .p-button-sm .p-button-icon {
        font-size: dt('button.sm.font.size');
    }

    .p-button-sm.p-button-icon-only {
        width: dt('button.sm.icon.only.width');
    }

    .p-button-sm.p-button-icon-only.p-button-rounded {
        height: dt('button.sm.icon.only.width');
    }

    .p-button-lg {
        font-size: dt('button.lg.font.size');
        padding: dt('button.lg.padding.y') dt('button.lg.padding.x');
    }

    .p-button-lg .p-button-icon {
        font-size: dt('button.lg.font.size');
    }

    .p-button-lg.p-button-icon-only {
        width: dt('button.lg.icon.only.width');
    }

    .p-button-lg.p-button-icon-only.p-button-rounded {
        height: dt('button.lg.icon.only.width');
    }

    .p-button-vertical {
        flex-direction: column;
    }

    .p-button-label {
        font-weight: dt('button.label.font.weight');
    }

    .p-button-fluid {
        width: 100%;
    }

    .p-button-fluid.p-button-icon-only {
        width: dt('button.icon.only.width');
    }

    .p-button:not(:disabled):hover {
        background: dt('button.primary.hover.background');
        border: 1px solid dt('button.primary.hover.border.color');
        color: dt('button.primary.hover.color');
    }

    .p-button:not(:disabled):active {
        background: dt('button.primary.active.background');
        border: 1px solid dt('button.primary.active.border.color');
        color: dt('button.primary.active.color');
    }

    .p-button:focus-visible {
        box-shadow: dt('button.primary.focus.ring.shadow');
        outline: dt('button.focus.ring.width') dt('button.focus.ring.style') dt('button.primary.focus.ring.color');
        outline-offset: dt('button.focus.ring.offset');
    }

    .p-button .p-badge {
        min-width: dt('button.badge.size');
        height: dt('button.badge.size');
        line-height: dt('button.badge.size');
    }

    .p-button-raised {
        box-shadow: dt('button.raised.shadow');
    }

    .p-button-rounded {
        border-radius: dt('button.rounded.border.radius');
    }

    .p-button-secondary {
        background: dt('button.secondary.background');
        border: 1px solid dt('button.secondary.border.color');
        color: dt('button.secondary.color');
    }

    .p-button-secondary:not(:disabled):hover {
        background: dt('button.secondary.hover.background');
        border: 1px solid dt('button.secondary.hover.border.color');
        color: dt('button.secondary.hover.color');
    }

    .p-button-secondary:not(:disabled):active {
        background: dt('button.secondary.active.background');
        border: 1px solid dt('button.secondary.active.border.color');
        color: dt('button.secondary.active.color');
    }

    .p-button-secondary:focus-visible {
        outline-color: dt('button.secondary.focus.ring.color');
        box-shadow: dt('button.secondary.focus.ring.shadow');
    }

    .p-button-success {
        background: dt('button.success.background');
        border: 1px solid dt('button.success.border.color');
        color: dt('button.success.color');
    }

    .p-button-success:not(:disabled):hover {
        background: dt('button.success.hover.background');
        border: 1px solid dt('button.success.hover.border.color');
        color: dt('button.success.hover.color');
    }

    .p-button-success:not(:disabled):active {
        background: dt('button.success.active.background');
        border: 1px solid dt('button.success.active.border.color');
        color: dt('button.success.active.color');
    }

    .p-button-success:focus-visible {
        outline-color: dt('button.success.focus.ring.color');
        box-shadow: dt('button.success.focus.ring.shadow');
    }

    .p-button-info {
        background: dt('button.info.background');
        border: 1px solid dt('button.info.border.color');
        color: dt('button.info.color');
    }

    .p-button-info:not(:disabled):hover {
        background: dt('button.info.hover.background');
        border: 1px solid dt('button.info.hover.border.color');
        color: dt('button.info.hover.color');
    }

    .p-button-info:not(:disabled):active {
        background: dt('button.info.active.background');
        border: 1px solid dt('button.info.active.border.color');
        color: dt('button.info.active.color');
    }

    .p-button-info:focus-visible {
        outline-color: dt('button.info.focus.ring.color');
        box-shadow: dt('button.info.focus.ring.shadow');
    }

    .p-button-warn {
        background: dt('button.warn.background');
        border: 1px solid dt('button.warn.border.color');
        color: dt('button.warn.color');
    }

    .p-button-warn:not(:disabled):hover {
        background: dt('button.warn.hover.background');
        border: 1px solid dt('button.warn.hover.border.color');
        color: dt('button.warn.hover.color');
    }

    .p-button-warn:not(:disabled):active {
        background: dt('button.warn.active.background');
        border: 1px solid dt('button.warn.active.border.color');
        color: dt('button.warn.active.color');
    }

    .p-button-warn:focus-visible {
        outline-color: dt('button.warn.focus.ring.color');
        box-shadow: dt('button.warn.focus.ring.shadow');
    }

    .p-button-help {
        background: dt('button.help.background');
        border: 1px solid dt('button.help.border.color');
        color: dt('button.help.color');
    }

    .p-button-help:not(:disabled):hover {
        background: dt('button.help.hover.background');
        border: 1px solid dt('button.help.hover.border.color');
        color: dt('button.help.hover.color');
    }

    .p-button-help:not(:disabled):active {
        background: dt('button.help.active.background');
        border: 1px solid dt('button.help.active.border.color');
        color: dt('button.help.active.color');
    }

    .p-button-help:focus-visible {
        outline-color: dt('button.help.focus.ring.color');
        box-shadow: dt('button.help.focus.ring.shadow');
    }

    .p-button-danger {
        background: dt('button.danger.background');
        border: 1px solid dt('button.danger.border.color');
        color: dt('button.danger.color');
    }

    .p-button-danger:not(:disabled):hover {
        background: dt('button.danger.hover.background');
        border: 1px solid dt('button.danger.hover.border.color');
        color: dt('button.danger.hover.color');
    }

    .p-button-danger:not(:disabled):active {
        background: dt('button.danger.active.background');
        border: 1px solid dt('button.danger.active.border.color');
        color: dt('button.danger.active.color');
    }

    .p-button-danger:focus-visible {
        outline-color: dt('button.danger.focus.ring.color');
        box-shadow: dt('button.danger.focus.ring.shadow');
    }

    .p-button-contrast {
        background: dt('button.contrast.background');
        border: 1px solid dt('button.contrast.border.color');
        color: dt('button.contrast.color');
    }

    .p-button-contrast:not(:disabled):hover {
        background: dt('button.contrast.hover.background');
        border: 1px solid dt('button.contrast.hover.border.color');
        color: dt('button.contrast.hover.color');
    }

    .p-button-contrast:not(:disabled):active {
        background: dt('button.contrast.active.background');
        border: 1px solid dt('button.contrast.active.border.color');
        color: dt('button.contrast.active.color');
    }

    .p-button-contrast:focus-visible {
        outline-color: dt('button.contrast.focus.ring.color');
        box-shadow: dt('button.contrast.focus.ring.shadow');
    }

    .p-button-outlined {
        background: transparent;
        border-color: dt('button.outlined.primary.border.color');
        color: dt('button.outlined.primary.color');
    }

    .p-button-outlined:not(:disabled):hover {
        background: dt('button.outlined.primary.hover.background');
        border-color: dt('button.outlined.primary.border.color');
        color: dt('button.outlined.primary.color');
    }

    .p-button-outlined:not(:disabled):active {
        background: dt('button.outlined.primary.active.background');
        border-color: dt('button.outlined.primary.border.color');
        color: dt('button.outlined.primary.color');
    }

    .p-button-outlined.p-button-secondary {
        border-color: dt('button.outlined.secondary.border.color');
        color: dt('button.outlined.secondary.color');
    }

    .p-button-outlined.p-button-secondary:not(:disabled):hover {
        background: dt('button.outlined.secondary.hover.background');
        border-color: dt('button.outlined.secondary.border.color');
        color: dt('button.outlined.secondary.color');
    }

    .p-button-outlined.p-button-secondary:not(:disabled):active {
        background: dt('button.outlined.secondary.active.background');
        border-color: dt('button.outlined.secondary.border.color');
        color: dt('button.outlined.secondary.color');
    }

    .p-button-outlined.p-button-success {
        border-color: dt('button.outlined.success.border.color');
        color: dt('button.outlined.success.color');
    }

    .p-button-outlined.p-button-success:not(:disabled):hover {
        background: dt('button.outlined.success.hover.background');
        border-color: dt('button.outlined.success.border.color');
        color: dt('button.outlined.success.color');
    }

    .p-button-outlined.p-button-success:not(:disabled):active {
        background: dt('button.outlined.success.active.background');
        border-color: dt('button.outlined.success.border.color');
        color: dt('button.outlined.success.color');
    }

    .p-button-outlined.p-button-info {
        border-color: dt('button.outlined.info.border.color');
        color: dt('button.outlined.info.color');
    }

    .p-button-outlined.p-button-info:not(:disabled):hover {
        background: dt('button.outlined.info.hover.background');
        border-color: dt('button.outlined.info.border.color');
        color: dt('button.outlined.info.color');
    }

    .p-button-outlined.p-button-info:not(:disabled):active {
        background: dt('button.outlined.info.active.background');
        border-color: dt('button.outlined.info.border.color');
        color: dt('button.outlined.info.color');
    }

    .p-button-outlined.p-button-warn {
        border-color: dt('button.outlined.warn.border.color');
        color: dt('button.outlined.warn.color');
    }

    .p-button-outlined.p-button-warn:not(:disabled):hover {
        background: dt('button.outlined.warn.hover.background');
        border-color: dt('button.outlined.warn.border.color');
        color: dt('button.outlined.warn.color');
    }

    .p-button-outlined.p-button-warn:not(:disabled):active {
        background: dt('button.outlined.warn.active.background');
        border-color: dt('button.outlined.warn.border.color');
        color: dt('button.outlined.warn.color');
    }

    .p-button-outlined.p-button-help {
        border-color: dt('button.outlined.help.border.color');
        color: dt('button.outlined.help.color');
    }

    .p-button-outlined.p-button-help:not(:disabled):hover {
        background: dt('button.outlined.help.hover.background');
        border-color: dt('button.outlined.help.border.color');
        color: dt('button.outlined.help.color');
    }

    .p-button-outlined.p-button-help:not(:disabled):active {
        background: dt('button.outlined.help.active.background');
        border-color: dt('button.outlined.help.border.color');
        color: dt('button.outlined.help.color');
    }

    .p-button-outlined.p-button-danger {
        border-color: dt('button.outlined.danger.border.color');
        color: dt('button.outlined.danger.color');
    }

    .p-button-outlined.p-button-danger:not(:disabled):hover {
        background: dt('button.outlined.danger.hover.background');
        border-color: dt('button.outlined.danger.border.color');
        color: dt('button.outlined.danger.color');
    }

    .p-button-outlined.p-button-danger:not(:disabled):active {
        background: dt('button.outlined.danger.active.background');
        border-color: dt('button.outlined.danger.border.color');
        color: dt('button.outlined.danger.color');
    }

    .p-button-outlined.p-button-contrast {
        border-color: dt('button.outlined.contrast.border.color');
        color: dt('button.outlined.contrast.color');
    }

    .p-button-outlined.p-button-contrast:not(:disabled):hover {
        background: dt('button.outlined.contrast.hover.background');
        border-color: dt('button.outlined.contrast.border.color');
        color: dt('button.outlined.contrast.color');
    }

    .p-button-outlined.p-button-contrast:not(:disabled):active {
        background: dt('button.outlined.contrast.active.background');
        border-color: dt('button.outlined.contrast.border.color');
        color: dt('button.outlined.contrast.color');
    }

    .p-button-outlined.p-button-plain {
        border-color: dt('button.outlined.plain.border.color');
        color: dt('button.outlined.plain.color');
    }

    .p-button-outlined.p-button-plain:not(:disabled):hover {
        background: dt('button.outlined.plain.hover.background');
        border-color: dt('button.outlined.plain.border.color');
        color: dt('button.outlined.plain.color');
    }

    .p-button-outlined.p-button-plain:not(:disabled):active {
        background: dt('button.outlined.plain.active.background');
        border-color: dt('button.outlined.plain.border.color');
        color: dt('button.outlined.plain.color');
    }

    .p-button-text {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.primary.color');
    }

    .p-button-text:not(:disabled):hover {
        background: dt('button.text.primary.hover.background');
        border-color: transparent;
        color: dt('button.text.primary.color');
    }

    .p-button-text:not(:disabled):active {
        background: dt('button.text.primary.active.background');
        border-color: transparent;
        color: dt('button.text.primary.color');
    }

    .p-button-text.p-button-secondary {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.secondary.color');
    }

    .p-button-text.p-button-secondary:not(:disabled):hover {
        background: dt('button.text.secondary.hover.background');
        border-color: transparent;
        color: dt('button.text.secondary.color');
    }

    .p-button-text.p-button-secondary:not(:disabled):active {
        background: dt('button.text.secondary.active.background');
        border-color: transparent;
        color: dt('button.text.secondary.color');
    }

    .p-button-text.p-button-success {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.success.color');
    }

    .p-button-text.p-button-success:not(:disabled):hover {
        background: dt('button.text.success.hover.background');
        border-color: transparent;
        color: dt('button.text.success.color');
    }

    .p-button-text.p-button-success:not(:disabled):active {
        background: dt('button.text.success.active.background');
        border-color: transparent;
        color: dt('button.text.success.color');
    }

    .p-button-text.p-button-info {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.info.color');
    }

    .p-button-text.p-button-info:not(:disabled):hover {
        background: dt('button.text.info.hover.background');
        border-color: transparent;
        color: dt('button.text.info.color');
    }

    .p-button-text.p-button-info:not(:disabled):active {
        background: dt('button.text.info.active.background');
        border-color: transparent;
        color: dt('button.text.info.color');
    }

    .p-button-text.p-button-warn {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.warn.color');
    }

    .p-button-text.p-button-warn:not(:disabled):hover {
        background: dt('button.text.warn.hover.background');
        border-color: transparent;
        color: dt('button.text.warn.color');
    }

    .p-button-text.p-button-warn:not(:disabled):active {
        background: dt('button.text.warn.active.background');
        border-color: transparent;
        color: dt('button.text.warn.color');
    }

    .p-button-text.p-button-help {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.help.color');
    }

    .p-button-text.p-button-help:not(:disabled):hover {
        background: dt('button.text.help.hover.background');
        border-color: transparent;
        color: dt('button.text.help.color');
    }

    .p-button-text.p-button-help:not(:disabled):active {
        background: dt('button.text.help.active.background');
        border-color: transparent;
        color: dt('button.text.help.color');
    }

    .p-button-text.p-button-danger {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.danger.color');
    }

    .p-button-text.p-button-danger:not(:disabled):hover {
        background: dt('button.text.danger.hover.background');
        border-color: transparent;
        color: dt('button.text.danger.color');
    }

    .p-button-text.p-button-danger:not(:disabled):active {
        background: dt('button.text.danger.active.background');
        border-color: transparent;
        color: dt('button.text.danger.color');
    }

    .p-button-text.p-button-contrast {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.contrast.color');
    }

    .p-button-text.p-button-contrast:not(:disabled):hover {
        background: dt('button.text.contrast.hover.background');
        border-color: transparent;
        color: dt('button.text.contrast.color');
    }

    .p-button-text.p-button-contrast:not(:disabled):active {
        background: dt('button.text.contrast.active.background');
        border-color: transparent;
        color: dt('button.text.contrast.color');
    }

    .p-button-text.p-button-plain {
        background: transparent;
        border-color: transparent;
        color: dt('button.text.plain.color');
    }

    .p-button-text.p-button-plain:not(:disabled):hover {
        background: dt('button.text.plain.hover.background');
        border-color: transparent;
        color: dt('button.text.plain.color');
    }

    .p-button-text.p-button-plain:not(:disabled):active {
        background: dt('button.text.plain.active.background');
        border-color: transparent;
        color: dt('button.text.plain.color');
    }

    .p-button-link {
        background: transparent;
        border-color: transparent;
        color: dt('button.link.color');
    }

    .p-button-link:not(:disabled):hover {
        background: transparent;
        border-color: transparent;
        color: dt('button.link.hover.color');
    }

    .p-button-link:not(:disabled):hover .p-button-label {
        text-decoration: underline;
    }

    .p-button-link:not(:disabled):active {
        background: transparent;
        border-color: transparent;
        color: dt('button.link.active.color');
    }
`;var ro=["content"],ao=["loadingicon"],lo=["icon"],co=["*"],Dn=(t,r)=>({class:t,pt:r});function uo(t,r){t&1&&ce(0)}function po(t,r){if(t&1&&Z(0,"span",7),t&2){let e=C(3);_(e.cn(e.cx("loadingIcon"),"pi-spin",e.loadingIcon||(e.buttonProps==null?null:e.buttonProps.loadingIcon))),h("pBind",e.ptm("loadingIcon")),T("aria-hidden",!0)}}function bo(t,r){if(t&1&&(oe(),Z(0,"svg",8)),t&2){let e=C(3);_(e.cn(e.cx("loadingIcon"),e.cx("spinnerIcon"))),h("pBind",e.ptm("loadingIcon"))("spin",!0),T("aria-hidden",!0)}}function go(t,r){if(t&1&&(Le(0),H(1,po,1,4,"span",3)(2,bo,1,5,"svg",6),Ae()),t&2){let e=C(2);y(),h("ngIf",e.loadingIcon||(e.buttonProps==null?null:e.buttonProps.loadingIcon)),y(),h("ngIf",!(e.loadingIcon||e.buttonProps!=null&&e.buttonProps.loadingIcon))}}function ho(t,r){}function fo(t,r){if(t&1&&H(0,ho,0,0,"ng-template",9),t&2){let e=C(2);h("ngIf",e.loadingIconTemplate||e._loadingIconTemplate)}}function mo(t,r){if(t&1&&(Le(0),H(1,go,3,2,"ng-container",2)(2,fo,1,1,null,5),Ae()),t&2){let e=C();y(),h("ngIf",!e.loadingIconTemplate&&!e._loadingIconTemplate),y(),h("ngTemplateOutlet",e.loadingIconTemplate||e._loadingIconTemplate)("ngTemplateOutletContext",it(3,Dn,e.cx("loadingIcon"),e.ptm("loadingIcon")))}}function vo(t,r){if(t&1&&Z(0,"span",7),t&2){let e=C(2);_(e.cn(e.cx("icon"),e.icon||(e.buttonProps==null?null:e.buttonProps.icon))),h("pBind",e.ptm("icon")),T("data-p",e.dataIconP)}}function yo(t,r){}function Co(t,r){if(t&1&&H(0,yo,0,0,"ng-template",9),t&2){let e=C(2);h("ngIf",!e.icon&&(e.iconTemplate||e._iconTemplate))}}function wo(t,r){if(t&1&&(Le(0),H(1,vo,1,4,"span",3)(2,Co,1,1,null,5),Ae()),t&2){let e=C();y(),h("ngIf",(e.icon||(e.buttonProps==null?null:e.buttonProps.icon))&&!e.iconTemplate&&!e._iconTemplate),y(),h("ngTemplateOutlet",e.iconTemplate||e._iconTemplate)("ngTemplateOutletContext",it(3,Dn,e.cx("icon"),e.ptm("icon")))}}function xo(t,r){if(t&1&&(te(0,"span",7),pe(1),ne()),t&2){let e=C();_(e.cx("label")),h("pBind",e.ptm("label")),T("aria-hidden",(e.icon||(e.buttonProps==null?null:e.buttonProps.icon))&&!(e.label||e.buttonProps!=null&&e.buttonProps.label))("data-p",e.dataLabelP),y(),be(e.label||(e.buttonProps==null?null:e.buttonProps.label))}}function _o(t,r){if(t&1&&Z(0,"p-badge",10),t&2){let e=C();h("value",e.badge||(e.buttonProps==null?null:e.buttonProps.badge))("severity",e.badgeSeverity||(e.buttonProps==null?null:e.buttonProps.badgeSeverity))("pt",e.ptm("pcBadge"))("unstyled",e.unstyled())}}var So={root:({instance:t})=>["p-button p-component",{"p-button-icon-only":t.hasIcon&&!t.label&&!t.buttonProps?.label&&!t.badge,"p-button-vertical":(t.iconPos==="top"||t.iconPos==="bottom")&&t.label,"p-button-loading":t.loading||t.buttonProps?.loading,"p-button-link":t.link||t.buttonProps?.link,[`p-button-${t.severity||t.buttonProps?.severity}`]:t.severity||t.buttonProps?.severity,"p-button-raised":t.raised||t.buttonProps?.raised,"p-button-rounded":t.rounded||t.buttonProps?.rounded,"p-button-text":t.text||t.variant==="text"||t.buttonProps?.text||t.buttonProps?.variant==="text","p-button-outlined":t.outlined||t.variant==="outlined"||t.buttonProps?.outlined||t.buttonProps?.variant==="outlined","p-button-sm":t.size==="small"||t.buttonProps?.size==="small","p-button-lg":t.size==="large"||t.buttonProps?.size==="large","p-button-plain":t.plain||t.buttonProps?.plain,"p-button-fluid":t.hasFluid}],loadingIcon:"p-button-loading-icon",icon:({instance:t})=>["p-button-icon",{[`p-button-icon-${t.iconPos||t.buttonProps?.iconPos}`]:t.label||t.buttonProps?.label,"p-button-icon-left":(t.iconPos==="left"||t.buttonProps?.iconPos==="left")&&t.label||t.buttonProps?.label,"p-button-icon-right":(t.iconPos==="right"||t.buttonProps?.iconPos==="right")&&t.label||t.buttonProps?.label,"p-button-icon-top":(t.iconPos==="top"||t.buttonProps?.iconPos==="top")&&t.label||t.buttonProps?.label,"p-button-icon-bottom":(t.iconPos==="bottom"||t.buttonProps?.iconPos==="bottom")&&t.label||t.buttonProps?.label},t.icon,t.buttonProps?.icon],spinnerIcon:({instance:t})=>Object.entries(t.cx("icon")).filter(([,r])=>!!r).reduce((r,[e])=>r+` ${e}`,"p-button-loading-icon"),label:"p-button-label"},ye=(()=>{class t extends D{name="button";style=Sn;classes=So;static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac})}return t})();var Tn=new L("BUTTON_INSTANCE"),En=new L("BUTTON_DIRECTIVE_INSTANCE"),In=new L("BUTTON_LABEL_INSTANCE"),Mn=new L("BUTTON_ICON_INSTANCE"),se={button:"p-button",component:"p-component",iconOnly:"p-button-icon-only",disabled:"p-disabled",loading:"p-button-loading",labelOnly:"p-button-loading-label-only"},kn=(()=>{class t extends k{componentName="ButtonLabel";ptButtonLabel=d();pButtonLabelPT=d();pButtonLabelUnstyled=d();$pcButtonLabel=p(In,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=p(m,{self:!0});constructor(){super(),I(()=>{let e=this.ptButtonLabel()||this.pButtonLabelPT();e&&this.directivePT.set(e)}),I(()=>{this.pButtonLabelUnstyled()&&this.directiveUnstyled.set(this.pButtonLabelUnstyled())})}onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}static \u0275fac=function(n){return new(n||t)};static \u0275dir=$({type:t,selectors:[["","pButtonLabel",""]],hostVars:2,hostBindings:function(n,o){n&2&&ue("p-button-label",!o.$unstyled()&&!0)},inputs:{ptButtonLabel:[1,"ptButtonLabel"],pButtonLabelPT:[1,"pButtonLabelPT"],pButtonLabelUnstyled:[1,"pButtonLabelUnstyled"]},features:[M([ye,{provide:In,useExisting:t},{provide:V,useExisting:t}]),j([m]),x]})}return t})(),Bn=(()=>{class t extends k{componentName="ButtonIcon";ptButtonIcon=d();pButtonIconPT=d();pButtonUnstyled=d();$pcButtonIcon=p(Mn,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=p(m,{self:!0});constructor(){super(),I(()=>{let e=this.ptButtonIcon()||this.pButtonIconPT();e&&this.directivePT.set(e)}),I(()=>{this.pButtonUnstyled()&&this.directiveUnstyled.set(this.pButtonUnstyled())})}onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}static \u0275fac=function(n){return new(n||t)};static \u0275dir=$({type:t,selectors:[["","pButtonIcon",""]],hostVars:2,hostBindings:function(n,o){n&2&&ue("p-button-icon",!o.$unstyled()&&!0)},inputs:{ptButtonIcon:[1,"ptButtonIcon"],pButtonIconPT:[1,"pButtonIconPT"],pButtonUnstyled:[1,"pButtonUnstyled"]},features:[M([ye,{provide:Mn,useExisting:t},{provide:V,useExisting:t}]),j([m]),x]})}return t})(),mr=(()=>{class t extends k{componentName="Button";$pcButtonDirective=p(En,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=p(m,{self:!0});_componentStyle=p(ye);ptButtonDirective=d();pButtonPT=d();pButtonUnstyled=d();hostName="";onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("root"))}constructor(){super(),I(()=>{let e=this.ptButtonDirective()||this.pButtonPT();e&&this.directivePT.set(e)}),I(()=>{this.pButtonUnstyled()&&this.directiveUnstyled.set(this.pButtonUnstyled())}),I(()=>{let e=this.$unstyled();this.initialized&&e&&this.setStyleClass()})}text=!1;plain=!1;raised=!1;size;outlined=!1;rounded=!1;iconPos="left";loadingIcon;fluid=d(void 0,{transform:S});iconSignal=rt(Bn);labelSignal=rt(kn);isIconOnly=z(()=>!!(!this.labelSignal()&&this.iconSignal()));_label;_icon;_loading=!1;_severity;_buttonProps;initialized;get htmlElement(){return this.el.nativeElement}_internalClasses=Object.values(se);pcFluid=p(yt,{optional:!0,host:!0,skipSelf:!0});isTextButton=z(()=>!!(!this.iconSignal()&&this.labelSignal()&&this.text));get label(){return this._label}set label(e){this._label=e,this.initialized&&(this.updateLabel(),this.updateIcon(),this.setStyleClass())}get icon(){return this._icon}set icon(e){this._icon=e,this.initialized&&(this.updateIcon(),this.setStyleClass())}get loading(){return this._loading}set loading(e){this._loading=e,this.initialized&&(this.updateIcon(),this.setStyleClass())}get buttonProps(){return this._buttonProps}set buttonProps(e){this._buttonProps=e,e&&typeof e=="object"&&Object.entries(e).forEach(([n,o])=>this[`_${n}`]!==o&&(this[`_${n}`]=o))}get severity(){return this._severity}set severity(e){this._severity=e,this.initialized&&this.setStyleClass()}spinnerIcon=`<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="p-icon-spin">
        <g clip-path="url(#clip0_417_21408)">
            <path
                d="M6.99701 14C5.85441 13.999 4.72939 13.7186 3.72012 13.1832C2.71084 12.6478 1.84795 11.8737 1.20673 10.9284C0.565504 9.98305 0.165424 8.89526 0.041387 7.75989C-0.0826496 6.62453 0.073125 5.47607 0.495122 4.4147C0.917119 3.35333 1.59252 2.4113 2.46241 1.67077C3.33229 0.930247 4.37024 0.413729 5.4857 0.166275C6.60117 -0.0811796 7.76026 -0.0520535 8.86188 0.251112C9.9635 0.554278 10.9742 1.12227 11.8057 1.90555C11.915 2.01493 11.9764 2.16319 11.9764 2.31778C11.9764 2.47236 11.915 2.62062 11.8057 2.73C11.7521 2.78503 11.688 2.82877 11.6171 2.85864C11.5463 2.8885 11.4702 2.90389 11.3933 2.90389C11.3165 2.90389 11.2404 2.8885 11.1695 2.85864C11.0987 2.82877 11.0346 2.78503 10.9809 2.73C9.9998 1.81273 8.73246 1.26138 7.39226 1.16876C6.05206 1.07615 4.72086 1.44794 3.62279 2.22152C2.52471 2.99511 1.72683 4.12325 1.36345 5.41602C1.00008 6.70879 1.09342 8.08723 1.62775 9.31926C2.16209 10.5513 3.10478 11.5617 4.29713 12.1803C5.48947 12.7989 6.85865 12.988 8.17414 12.7157C9.48963 12.4435 10.6711 11.7264 11.5196 10.6854C12.3681 9.64432 12.8319 8.34282 12.8328 7C12.8328 6.84529 12.8943 6.69692 13.0038 6.58752C13.1132 6.47812 13.2616 6.41667 13.4164 6.41667C13.5712 6.41667 13.7196 6.47812 13.8291 6.58752C13.9385 6.69692 14 6.84529 14 7C14 8.85651 13.2622 10.637 11.9489 11.9497C10.6356 13.2625 8.85432 14 6.99701 14Z"
                fill="currentColor"
            />
        </g>
        <defs>
            <clipPath id="clip0_417_21408">
                <rect width="14" height="14" fill="white" />
            </clipPath>
        </defs>
    </svg>`;onAfterViewInit(){!this.$unstyled()&&Se(this.htmlElement,this.getStyleClass().join(" ")),ge(this.platformId)&&(this.createIcon(),this.createLabel(),this.initialized=!0)}getStyleClass(){let e=[se.button,se.component];return this.icon&&!this.label&&xe(this.htmlElement.textContent)&&e.push(se.iconOnly),this.loading&&(e.push(se.disabled,se.loading),!this.icon&&this.label&&e.push(se.labelOnly),this.icon&&!this.label&&!xe(this.htmlElement.textContent)&&e.push(se.iconOnly)),this.text&&e.push("p-button-text"),this.severity&&e.push(`p-button-${this.severity}`),this.plain&&e.push("p-button-plain"),this.raised&&e.push("p-button-raised"),this.size&&e.push(`p-button-${this.size}`),this.outlined&&e.push("p-button-outlined"),this.rounded&&e.push("p-button-rounded"),this.size==="small"&&e.push("p-button-sm"),this.size==="large"&&e.push("p-button-lg"),this.hasFluid&&e.push("p-button-fluid"),this.$unstyled()?[]:e}get hasFluid(){return this.fluid()??!!this.pcFluid}setStyleClass(){let e=this.getStyleClass();this.removeExistingSeverityClass(),this.htmlElement.classList.remove(...this._internalClasses),this.htmlElement.classList.add(...e)}removeExistingSeverityClass(){let e=["success","info","warn","danger","help","primary","secondary","contrast"],n=this.htmlElement.classList.value.split(" ").find(o=>e.some(i=>o===`p-button-${i}`));n&&this.htmlElement.classList.remove(n)}createLabel(){if(!me(this.htmlElement,'[data-pc-section="buttonlabel"]')&&this.label){let n=Re("span",{class:this.cx("label"),"p-bind":this.ptm("buttonlabel"),"aria-hidden":this.icon&&!this.label?"true":null});n.appendChild(this.document.createTextNode(this.label)),this.htmlElement.appendChild(n)}}createIcon(){if(!me(this.htmlElement,'[data-pc-section="buttonicon"]')&&(this.icon||this.loading)){let n=this.label&&!this.$unstyled()?"p-button-icon-"+this.iconPos:null,o=!this.$unstyled()&&this.getIconClass(),i=Re("span",{class:this.cn(this.cx("icon"),n,o),"aria-hidden":"true","p-bind":this.ptm("buttonicon")});!this.loadingIcon&&this.loading&&(i.innerHTML=this.spinnerIcon),this.htmlElement.insertBefore(i,this.htmlElement.firstChild)}}updateLabel(){let e=me(this.htmlElement,'[data-pc-section="buttonlabel"]');if(!this.label){e&&this.htmlElement.removeChild(e);return}e?e.textContent=this.label:this.createLabel()}updateIcon(){let e=me(this.htmlElement,'[data-pc-section="buttonicon"]'),n=me(this.htmlElement,'[data-pc-section="buttonlabel"]');this.loading&&!this.loadingIcon&&e?e.innerHTML=this.spinnerIcon:e?.innerHTML&&(e.innerHTML=""),e&&!this.$unstyled()?this.iconPos?e.className="p-button-icon "+(n?"p-button-icon-"+this.iconPos:"")+" "+this.getIconClass():e.className="p-button-icon "+this.getIconClass():this.createIcon()}getIconClass(){return this.loading?"p-button-loading-icon "+(this.loadingIcon?this.loadingIcon:"p-icon"):this.icon||"p-hidden"}onDestroy(){this.initialized=!1}static \u0275fac=function(n){return new(n||t)};static \u0275dir=$({type:t,selectors:[["","pButton",""]],contentQueries:function(n,o,i){n&1&&Lt(i,o.iconSignal,Bn,5)(i,o.labelSignal,kn,5),n&2&&At(2)},hostVars:4,hostBindings:function(n,o){n&2&&ue("p-button-icon-only",!o.$unstyled()&&o.isIconOnly())("p-button-text",!o.$unstyled()&&o.isTextButton())},inputs:{ptButtonDirective:[1,"ptButtonDirective"],pButtonPT:[1,"pButtonPT"],pButtonUnstyled:[1,"pButtonUnstyled"],hostName:"hostName",text:[2,"text","text",S],plain:[2,"plain","plain",S],raised:[2,"raised","raised",S],size:"size",outlined:[2,"outlined","outlined",S],rounded:[2,"rounded","rounded",S],iconPos:"iconPos",loadingIcon:"loadingIcon",fluid:[1,"fluid"],label:"label",icon:"icon",loading:"loading",buttonProps:"buttonProps",severity:"severity"},features:[M([ye,{provide:En,useExisting:t},{provide:V,useExisting:t}]),j([m]),x]})}return t})(),To=(()=>{class t extends k{componentName="Button";hostName="";$pcButton=p(Tn,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=p(m,{self:!0});_componentStyle=p(ye);onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("host"))}type="button";badge;disabled;raised=!1;rounded=!1;text=!1;plain=!1;outlined=!1;link=!1;tabindex;size;variant;style;styleClass;badgeClass;badgeSeverity="secondary";ariaLabel;autofocus;iconPos="left";icon;label;loading=!1;loadingIcon;severity;buttonProps;fluid=d(void 0,{transform:S});onClick=new le;onFocus=new le;onBlur=new le;contentTemplate;loadingIconTemplate;iconTemplate;templates;pcFluid=p(yt,{optional:!0,host:!0,skipSelf:!0});get hasFluid(){return this.fluid()??!!this.pcFluid}get hasIcon(){return this.icon||this.buttonProps?.icon||this.iconTemplate||this._iconTemplate||this.loadingIcon||this.loadingIconTemplate||this._loadingIconTemplate}_contentTemplate;_iconTemplate;_loadingIconTemplate;onAfterContentInit(){this.templates?.forEach(e=>{switch(e.getType()){case"content":this._contentTemplate=e.template;break;case"icon":this._iconTemplate=e.template;break;case"loadingicon":this._loadingIconTemplate=e.template;break;default:this._contentTemplate=e.template;break}})}get dataP(){return this.cn({[this.size]:this.size,"icon-only":this.hasIcon&&!this.label&&!this.badge,loading:this.loading,fluid:this.hasFluid,rounded:this.rounded,raised:this.raised,outlined:this.outlined||this.variant==="outlined",text:this.text||this.variant==="text",link:this.link,vertical:(this.iconPos==="top"||this.iconPos==="bottom")&&this.label})}get dataIconP(){return this.cn({[this.iconPos]:this.iconPos,[this.size]:this.size})}get dataLabelP(){return this.cn({[this.size]:this.size,"icon-only":this.hasIcon&&!this.label&&!this.badge})}static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275cmp=A({type:t,selectors:[["p-button"]],contentQueries:function(n,o,i){if(n&1&&Fe(i,ro,5)(i,ao,5)(i,lo,5)(i,Ue,4),n&2){let s;K(s=J())&&(o.contentTemplate=s.first),K(s=J())&&(o.loadingIconTemplate=s.first),K(s=J())&&(o.iconTemplate=s.first),K(s=J())&&(o.templates=s)}},inputs:{hostName:"hostName",type:"type",badge:"badge",disabled:[2,"disabled","disabled",S],raised:[2,"raised","raised",S],rounded:[2,"rounded","rounded",S],text:[2,"text","text",S],plain:[2,"plain","plain",S],outlined:[2,"outlined","outlined",S],link:[2,"link","link",S],tabindex:[2,"tabindex","tabindex",jt],size:"size",variant:"variant",style:"style",styleClass:"styleClass",badgeClass:"badgeClass",badgeSeverity:"badgeSeverity",ariaLabel:"ariaLabel",autofocus:[2,"autofocus","autofocus",S],iconPos:"iconPos",icon:"icon",label:"label",loading:[2,"loading","loading",S],loadingIcon:"loadingIcon",severity:"severity",buttonProps:"buttonProps",fluid:[1,"fluid"]},outputs:{onClick:"onClick",onFocus:"onFocus",onBlur:"onBlur"},features:[M([ye,{provide:Tn,useExisting:t},{provide:V,useExisting:t}]),j([m]),x],ngContentSelectors:co,decls:7,vars:17,consts:[["pRipple","",3,"click","focus","blur","ngStyle","disabled","pAutoFocus","pBind"],[4,"ngTemplateOutlet"],[4,"ngIf"],[3,"class","pBind",4,"ngIf"],[3,"value","severity","pt","unstyled",4,"ngIf"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],["data-p-icon","spinner",3,"class","pBind","spin",4,"ngIf"],[3,"pBind"],["data-p-icon","spinner",3,"pBind","spin"],[3,"ngIf"],[3,"value","severity","pt","unstyled"]],template:function(n,o){n&1&&(X(),te(0,"button",0),Oe("click",function(s){return o.onClick.emit(s)})("focus",function(s){return o.onFocus.emit(s)})("blur",function(s){return o.onBlur.emit(s)}),Y(1),H(2,uo,1,0,"ng-container",1)(3,mo,3,6,"ng-container",2)(4,wo,3,6,"ng-container",2)(5,xo,2,6,"span",3)(6,_o,1,4,"p-badge",4),ne()),n&2&&(_(o.cn(o.cx("root"),o.styleClass,o.buttonProps==null?null:o.buttonProps.styleClass)),h("ngStyle",o.style||(o.buttonProps==null?null:o.buttonProps.style))("disabled",o.disabled||o.loading||(o.buttonProps==null?null:o.buttonProps.disabled))("pAutoFocus",o.autofocus||(o.buttonProps==null?null:o.buttonProps.autofocus))("pBind",o.ptm("root")),T("type",o.type||(o.buttonProps==null?null:o.buttonProps.type))("aria-label",o.ariaLabel||(o.buttonProps==null?null:o.buttonProps.ariaLabel))("tabindex",o.tabindex||(o.buttonProps==null?null:o.buttonProps.tabindex))("data-p",o.dataP)("data-p-disabled",o.disabled||o.loading||(o.buttonProps==null?null:o.buttonProps.disabled))("data-p-severity",o.severity||(o.buttonProps==null?null:o.buttonProps.severity)),y(2),h("ngTemplateOutlet",o.contentTemplate||o._contentTemplate),y(),h("ngIf",o.loading||(o.buttonProps==null?null:o.buttonProps.loading)),y(),h("ngIf",!(o.loading||o.buttonProps!=null&&o.buttonProps.loading)),y(),h("ngIf",!o.contentTemplate&&!o._contentTemplate&&(o.label||(o.buttonProps==null?null:o.buttonProps.label))),y(),h("ngIf",!o.contentTemplate&&!o._contentTemplate&&(o.badge||(o.buttonProps==null?null:o.buttonProps.badge))))},dependencies:[W,$e,ze,Wt,Ze,pn,Cn,fn,vt,R,m],encapsulation:2,changeDetection:0})}return t})(),vr=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=F({type:t});static \u0275inj=O({imports:[W,To,R,R]})}return t})();var Eo=Object.defineProperty,Pn=Object.getOwnPropertySymbols,Io=Object.prototype.hasOwnProperty,Mo=Object.prototype.propertyIsEnumerable,Nn=(t,r,e)=>r in t?Eo(t,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[r]=e,Ln=(t,r)=>{for(var e in r||(r={}))Io.call(r,e)&&Nn(t,e,r[e]);if(Pn)for(var e of Pn(r))Mo.call(r,e)&&Nn(t,e,r[e]);return t},ko=(t,r,e)=>new Promise((n,o)=>{var i=l=>{try{a(e.next(l))}catch(u){o(u)}},s=l=>{try{a(e.throw(l))}catch(u){o(u)}},a=l=>l.done?n(l.value):Promise.resolve(l.value).then(i,s);a((e=e.apply(t,r)).next())}),Xe="animation",Ie="transition";function Bo(t){return t?t.disabled||!!(t.safe&&qt()):!1}function Do(t,r){return t?Ln(Ln({},t),Object.entries(r).reduce((e,[n,o])=>{var i;return e[n]=(i=t[n])!=null?i:o,e},{})):r}function Po(t){let{name:r,enterClass:e,leaveClass:n}=t||{};return{enter:{from:e?.from||`${r}-enter-from`,to:e?.to||`${r}-enter-to`,active:e?.active||`${r}-enter-active`},leave:{from:n?.from||`${r}-leave-from`,to:n?.to||`${r}-leave-to`,active:n?.active||`${r}-leave-active`}}}function No(t){return{enter:{onBefore:t?.onBeforeEnter,onStart:t?.onEnter,onAfter:t?.onAfterEnter,onCancelled:t?.onEnterCancelled},leave:{onBefore:t?.onBeforeLeave,onStart:t?.onLeave,onAfter:t?.onAfterLeave,onCancelled:t?.onLeaveCancelled}}}function Lo(t,r){let e=window.getComputedStyle(t),n=f=>{let E=e[`${f}Delay`],B=e[`${f}Duration`];return[E.split(", ").map(dt),B.split(", ").map(dt)]},[o,i]=n(Ie),[s,a]=n(Xe),l=Math.max(...i.map((f,E)=>f+o[E])),u=Math.max(...a.map((f,E)=>f+s[E])),c,b=0,w=0;return r===Ie?l>0&&(c=Ie,b=l,w=i.length):r===Xe?u>0&&(c=Xe,b=u,w=a.length):(b=Math.max(l,u),c=b>0?l>u?Ie:Xe:void 0,w=c?c===Ie?i.length:a.length:0),{type:c,timeout:b,count:w}}function Ye(t,r){return typeof t=="number"?t:typeof t=="object"&&t[r]!=null?t[r]:null}function Ao(t,r=!0,e=!1){if(!r&&!e)return;let n=Ut(t);r&&ut(t,"--pui-motion-height",n.height+"px"),e&&ut(t,"--pui-motion-width",n.width+"px")}var Oo={name:"p",safe:!0,disabled:!1,enter:!0,leave:!0,autoHeight:!0,autoWidth:!1};function Ct(t,r){if(!t)throw new Error("Element is required.");let e={},n=!1,o={},i=null,s={},a=c=>{if(Object.assign(e,Do(c,Oo)),!e.enter&&!e.leave)throw new Error("Enter or leave must be true.");s=No(e),n=Bo(e),o=Po(e),i=null},l=c=>ko(null,null,function*(){i?.();let{onBefore:b,onStart:w,onAfter:f,onCancelled:E}=s[c]||{},B={element:t};if(n){b?.(B),w?.(B),f?.(B);return}let{from:re,active:Ce,to:ke}=o[c]||{};return Ao(t,e.autoHeight,e.autoWidth),b?.(B),Ve(t,re),Ve(t,Ce),t.offsetHeight,ct(t,re),Ve(t,ke),w?.(B),new Promise(q=>{let Hn=Ye(e.duration,c),xt=()=>{ct(t,[ke,Ce]),i=null},jn=()=>{xt(),f?.(B),q()};i=()=>{xt(),E?.(B),q()},$o(t,e.type,Hn,jn)})});a(r);let u={enter:()=>e.enter?l("enter"):Promise.resolve(),leave:()=>e.leave?l("leave"):Promise.resolve(),cancel:()=>{i?.(),i=null},update:(c,b)=>{if(!c)throw new Error("Element is required.");t=c,u.cancel(),a(b)}};return e.appear&&u.enter(),u}var Fo=0;function $o(t,r,e,n){let o=t._motionEndId=++Fo,i=()=>{o===t._motionEndId&&n()};if(e!=null)return setTimeout(i,e);let{type:s,timeout:a,count:l}=Lo(t,r);if(!s){n();return}let u=s+"end",c=0,b=()=>{t.removeEventListener(u,w,!0),i()},w=f=>{f.target===t&&++c>=l&&b()};t.addEventListener(u,w,{capture:!0,once:!0}),setTimeout(()=>{c<l&&b()},a+1)}var zo=["*"];function Vo(t,r){t&1&&Y(0)}var Ke=new WeakMap;function Me(t,r){if(t)switch(Ke.has(t)||Ke.set(t,{display:t.style.display,visibility:t.style.visibility,maxHeight:t.style.maxHeight,overflow:t.style.overflow}),r){case"display":t.style.display="none";break;case"visibility":t.style.visibility="hidden",t.style.maxHeight="0",t.style.overflow="hidden";break}}function Je(t,r){if(!t)return;let e=Ke.get(t)??t.style;switch(r){case"display":t.style.display=e?.display||"";break;case"visibility":t.style.visibility=e?.visibility||"",t.style.maxHeight=e?.maxHeight||"",t.style.overflow=e?.overflow||"";break}Ke.delete(t)}var Ho=`
    .p-motion {
        display: block;
    }
`,jo={root:"p-motion"},wt=(()=>{class t extends D{name="motion";style=Ho;classes=jo;static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac})}return t})();var An=new L("MOTION_INSTANCE"),Ro=(()=>{class t extends k{$pcMotion=p(An,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=p(m,{self:!0});onAfterViewChecked(){let n=this.options()?.root||{};this.bindDirectiveInstance.setAttrs(g(g({},this.ptms(["host","root"])),n))}_componentStyle=p(wt);visible=d(!1);mountOnEnter=d(!0);unmountOnLeave=d(!0);name=d(void 0);type=d(void 0);safe=d(void 0);disabled=d(!1);appear=d(!1);enter=d(!0);leave=d(!0);duration=d(void 0);hideStrategy=d("display");enterFromClass=d(void 0);enterToClass=d(void 0);enterActiveClass=d(void 0);leaveFromClass=d(void 0);leaveToClass=d(void 0);leaveActiveClass=d(void 0);options=d({});onBeforeEnter=P();onEnter=P();onAfterEnter=P();onEnterCancelled=P();onBeforeLeave=P();onLeave=P();onAfterLeave=P();onLeaveCancelled=P();motionOptions=z(()=>{let e=this.options();return{name:e.name??this.name(),type:e.type??this.type(),safe:e.safe??this.safe(),disabled:e.disabled??this.disabled(),appear:!1,enter:e.enter??this.enter(),leave:e.leave??this.leave(),duration:e.duration??this.duration(),enterClass:{from:e.enterClass?.from??(e.name?void 0:this.enterFromClass()),to:e.enterClass?.to??(e.name?void 0:this.enterToClass()),active:e.enterClass?.active??(e.name?void 0:this.enterActiveClass())},leaveClass:{from:e.leaveClass?.from??(e.name?void 0:this.leaveFromClass()),to:e.leaveClass?.to??(e.name?void 0:this.leaveToClass()),active:e.leaveClass?.active??(e.name?void 0:this.leaveActiveClass())},onBeforeEnter:e.onBeforeEnter??this.handleBeforeEnter,onEnter:e.onEnter??this.handleEnter,onAfterEnter:e.onAfterEnter??this.handleAfterEnter,onEnterCancelled:e.onEnterCancelled??this.handleEnterCancelled,onBeforeLeave:e.onBeforeLeave??this.handleBeforeLeave,onLeave:e.onLeave??this.handleLeave,onAfterLeave:e.onAfterLeave??this.handleAfterLeave,onLeaveCancelled:e.onLeaveCancelled??this.handleLeaveCancelled}});motion;isInitialMount=!0;cancelled=!1;destroyed=!1;rendered=ee(!1);handleBeforeEnter=e=>!this.destroyed&&this.onBeforeEnter.emit(e);handleEnter=e=>!this.destroyed&&this.onEnter.emit(e);handleAfterEnter=e=>!this.destroyed&&this.onAfterEnter.emit(e);handleEnterCancelled=e=>!this.destroyed&&this.onEnterCancelled.emit(e);handleBeforeLeave=e=>!this.destroyed&&this.onBeforeLeave.emit(e);handleLeave=e=>!this.destroyed&&this.onLeave.emit(e);handleAfterLeave=e=>!this.destroyed&&this.onAfterLeave.emit(e);handleLeaveCancelled=e=>!this.destroyed&&this.onLeaveCancelled.emit(e);constructor(){super(),I(()=>{let e=this.hideStrategy();this.isInitialMount?(Me(this.$el,e),this.rendered.set(this.visible()&&this.mountOnEnter()||!this.mountOnEnter())):this.visible()&&!this.rendered()&&(Me(this.$el,e),this.rendered.set(!0))}),I(()=>{this.motion||(this.motion=Ct(this.$el,this.motionOptions()))}),at(()=>et(this,null,function*(){if(!this.$el)return;let e=this.isInitialMount&&this.visible()&&this.appear(),n=this.hideStrategy();this.visible()?(yield We(),Je(this.$el,n),(e||!this.isInitialMount)&&(this.applyMotionDuration("enter"),this.motion?.enter())):this.isInitialMount||(yield We(),this.applyMotionDuration("leave"),this.motion?.leave()?.then(()=>et(this,null,function*(){this.$el&&!this.cancelled&&!this.visible()&&(Me(this.$el,n),this.unmountOnLeave()&&(yield We(),this.cancelled||this.rendered.set(!1)))}))),this.isInitialMount=!1}))}applyMotionDuration(e){let n=st(this.motionOptions),o=Ye(n.duration,e);if(o==null||!this.$el)return;let i=this.$el,s=`${o}ms`;n.type==="transition"?i.style.transitionDuration=s:i.style.animationDuration=s}onDestroy(){this.destroyed=!0,this.cancelled=!0,this.motion?.cancel(),this.motion=void 0,Je(this.$el,this.hideStrategy()),this.$el?.remove(),this.isInitialMount=!0}static \u0275fac=function(n){return new(n||t)};static \u0275cmp=A({type:t,selectors:[["p-motion"]],hostVars:2,hostBindings:function(n,o){n&2&&_(o.cx("root"))},inputs:{visible:[1,"visible"],mountOnEnter:[1,"mountOnEnter"],unmountOnLeave:[1,"unmountOnLeave"],name:[1,"name"],type:[1,"type"],safe:[1,"safe"],disabled:[1,"disabled"],appear:[1,"appear"],enter:[1,"enter"],leave:[1,"leave"],duration:[1,"duration"],hideStrategy:[1,"hideStrategy"],enterFromClass:[1,"enterFromClass"],enterToClass:[1,"enterToClass"],enterActiveClass:[1,"enterActiveClass"],leaveFromClass:[1,"leaveFromClass"],leaveToClass:[1,"leaveToClass"],leaveActiveClass:[1,"leaveActiveClass"],options:[1,"options"]},outputs:{onBeforeEnter:"onBeforeEnter",onEnter:"onEnter",onAfterEnter:"onAfterEnter",onEnterCancelled:"onEnterCancelled",onBeforeLeave:"onBeforeLeave",onLeave:"onLeave",onAfterLeave:"onAfterLeave",onLeaveCancelled:"onLeaveCancelled"},features:[M([wt,{provide:An,useExisting:t},{provide:V,useExisting:t}]),j([m]),x],ngContentSelectors:zo,decls:1,vars:1,template:function(n,o){n&1&&(X(),G(0,Vo,1,0)),n&2&&Q(o.rendered()?0:-1)},dependencies:[W,Ge],encapsulation:2})}return t})(),On=new L("MOTION_DIRECTIVE_INSTANCE"),Ar=(()=>{class t extends k{$pcMotionDirective=p(On,{optional:!0,skipSelf:!0})??void 0;visible=d(!1,{alias:"pMotion"});name=d(void 0,{alias:"pMotionName"});type=d(void 0,{alias:"pMotionType"});safe=d(void 0,{alias:"pMotionSafe"});disabled=d(!1,{alias:"pMotionDisabled"});appear=d(!1,{alias:"pMotionAppear"});enter=d(!0,{alias:"pMotionEnter"});leave=d(!0,{alias:"pMotionLeave"});duration=d(void 0,{alias:"pMotionDuration"});hideStrategy=d("display",{alias:"pMotionHideStrategy"});enterFromClass=d(void 0,{alias:"pMotionEnterFromClass"});enterToClass=d(void 0,{alias:"pMotionEnterToClass"});enterActiveClass=d(void 0,{alias:"pMotionEnterActiveClass"});leaveFromClass=d(void 0,{alias:"pMotionLeaveFromClass"});leaveToClass=d(void 0,{alias:"pMotionLeaveToClass"});leaveActiveClass=d(void 0,{alias:"pMotionLeaveActiveClass"});options=d({},{alias:"pMotionOptions"});onBeforeEnter=P({alias:"pMotionOnBeforeEnter"});onEnter=P({alias:"pMotionOnEnter"});onAfterEnter=P({alias:"pMotionOnAfterEnter"});onEnterCancelled=P({alias:"pMotionOnEnterCancelled"});onBeforeLeave=P({alias:"pMotionOnBeforeLeave"});onLeave=P({alias:"pMotionOnLeave"});onAfterLeave=P({alias:"pMotionOnAfterLeave"});onLeaveCancelled=P({alias:"pMotionOnLeaveCancelled"});motionOptions=z(()=>{let e=this.options()??{};return{name:e.name??this.name(),type:e.type??this.type(),safe:e.safe??this.safe(),disabled:e.disabled??this.disabled(),appear:!1,enter:e.enter??this.enter(),leave:e.leave??this.leave(),duration:e.duration??this.duration(),enterClass:{from:e.enterClass?.from??(e.name?void 0:this.enterFromClass()),to:e.enterClass?.to??(e.name?void 0:this.enterToClass()),active:e.enterClass?.active??(e.name?void 0:this.enterActiveClass())},leaveClass:{from:e.leaveClass?.from??(e.name?void 0:this.leaveFromClass()),to:e.leaveClass?.to??(e.name?void 0:this.leaveToClass()),active:e.leaveClass?.active??(e.name?void 0:this.leaveActiveClass())},onBeforeEnter:e.onBeforeEnter??this.handleBeforeEnter,onEnter:e.onEnter??this.handleEnter,onAfterEnter:e.onAfterEnter??this.handleAfterEnter,onEnterCancelled:e.onEnterCancelled??this.handleEnterCancelled,onBeforeLeave:e.onBeforeLeave??this.handleBeforeLeave,onLeave:e.onLeave??this.handleLeave,onAfterLeave:e.onAfterLeave??this.handleAfterLeave,onLeaveCancelled:e.onLeaveCancelled??this.handleLeaveCancelled}});motion;isInitialMount=!0;cancelled=!1;destroyed=!1;handleBeforeEnter=e=>!this.destroyed&&this.onBeforeEnter.emit(e);handleEnter=e=>!this.destroyed&&this.onEnter.emit(e);handleAfterEnter=e=>!this.destroyed&&this.onAfterEnter.emit(e);handleEnterCancelled=e=>!this.destroyed&&this.onEnterCancelled.emit(e);handleBeforeLeave=e=>!this.destroyed&&this.onBeforeLeave.emit(e);handleLeave=e=>!this.destroyed&&this.onLeave.emit(e);handleAfterLeave=e=>!this.destroyed&&this.onAfterLeave.emit(e);handleLeaveCancelled=e=>!this.destroyed&&this.onLeaveCancelled.emit(e);constructor(){super(),I(()=>{this.motion||(this.motion=Ct(this.$el,this.motionOptions()))}),at(()=>{if(!this.$el)return;let e=this.isInitialMount&&this.visible()&&this.appear(),n=this.hideStrategy();this.visible()?(Je(this.$el,n),(e||!this.isInitialMount)&&(this.applyMotionDuration("enter"),this.motion?.enter())):this.isInitialMount?Me(this.$el,n):(this.applyMotionDuration("leave"),this.motion?.leave()?.then(()=>{this.$el&&!this.cancelled&&!this.visible()&&Me(this.$el,n)})),this.isInitialMount=!1})}applyMotionDuration(e){let n=st(this.motionOptions),o=Ye(n.duration,e);if(o==null||!this.$el)return;let i=this.$el,s=`${o}ms`;n.type==="transition"?i.style.transitionDuration=s:i.style.animationDuration=s}onDestroy(){this.destroyed=!0,this.cancelled=!0,this.motion?.cancel(),this.motion=void 0,Je(this.$el,this.hideStrategy()),this.$el?.remove(),this.isInitialMount=!0}static \u0275fac=function(n){return new(n||t)};static \u0275dir=$({type:t,selectors:[["","pMotion",""]],inputs:{visible:[1,"pMotion","visible"],name:[1,"pMotionName","name"],type:[1,"pMotionType","type"],safe:[1,"pMotionSafe","safe"],disabled:[1,"pMotionDisabled","disabled"],appear:[1,"pMotionAppear","appear"],enter:[1,"pMotionEnter","enter"],leave:[1,"pMotionLeave","leave"],duration:[1,"pMotionDuration","duration"],hideStrategy:[1,"pMotionHideStrategy","hideStrategy"],enterFromClass:[1,"pMotionEnterFromClass","enterFromClass"],enterToClass:[1,"pMotionEnterToClass","enterToClass"],enterActiveClass:[1,"pMotionEnterActiveClass","enterActiveClass"],leaveFromClass:[1,"pMotionLeaveFromClass","leaveFromClass"],leaveToClass:[1,"pMotionLeaveToClass","leaveToClass"],leaveActiveClass:[1,"pMotionLeaveActiveClass","leaveActiveClass"],options:[1,"pMotionOptions","options"]},outputs:{onBeforeEnter:"pMotionOnBeforeEnter",onEnter:"pMotionOnEnter",onAfterEnter:"pMotionOnAfterEnter",onEnterCancelled:"pMotionOnEnterCancelled",onBeforeLeave:"pMotionOnBeforeLeave",onLeave:"pMotionOnLeave",onAfterLeave:"pMotionOnAfterLeave",onLeaveCancelled:"pMotionOnLeaveCancelled"},features:[M([wt,{provide:On,useExisting:t},{provide:V,useExisting:t}]),x]})}return t})(),Fn=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=F({type:t});static \u0275inj=O({imports:[Ro]})}return t})();var $n=`
    .p-message {
        display: grid;
        grid-template-rows: 1fr;
        border-radius: dt('message.border.radius');
        outline-width: dt('message.border.width');
        outline-style: solid;
    }

    .p-message-content-wrapper {
        min-height: 0;
    }

    .p-message-content {
        display: flex;
        align-items: center;
        padding: dt('message.content.padding');
        gap: dt('message.content.gap');
    }

    .p-message-icon {
        flex-shrink: 0;
    }

    .p-message-close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-inline-start: auto;
        overflow: hidden;
        position: relative;
        width: dt('message.close.button.width');
        height: dt('message.close.button.height');
        border-radius: dt('message.close.button.border.radius');
        background: transparent;
        transition:
            background dt('message.transition.duration'),
            color dt('message.transition.duration'),
            outline-color dt('message.transition.duration'),
            box-shadow dt('message.transition.duration'),
            opacity 0.3s;
        outline-color: transparent;
        color: inherit;
        padding: 0;
        border: none;
        cursor: pointer;
        user-select: none;
    }

    .p-message-close-icon {
        font-size: dt('message.close.icon.size');
        width: dt('message.close.icon.size');
        height: dt('message.close.icon.size');
    }

    .p-message-close-button:focus-visible {
        outline-width: dt('message.close.button.focus.ring.width');
        outline-style: dt('message.close.button.focus.ring.style');
        outline-offset: dt('message.close.button.focus.ring.offset');
    }

    .p-message-info {
        background: dt('message.info.background');
        outline-color: dt('message.info.border.color');
        color: dt('message.info.color');
        box-shadow: dt('message.info.shadow');
    }

    .p-message-info .p-message-close-button:focus-visible {
        outline-color: dt('message.info.close.button.focus.ring.color');
        box-shadow: dt('message.info.close.button.focus.ring.shadow');
    }

    .p-message-info .p-message-close-button:hover {
        background: dt('message.info.close.button.hover.background');
    }

    .p-message-info.p-message-outlined {
        color: dt('message.info.outlined.color');
        outline-color: dt('message.info.outlined.border.color');
    }

    .p-message-info.p-message-simple {
        color: dt('message.info.simple.color');
    }

    .p-message-success {
        background: dt('message.success.background');
        outline-color: dt('message.success.border.color');
        color: dt('message.success.color');
        box-shadow: dt('message.success.shadow');
    }

    .p-message-success .p-message-close-button:focus-visible {
        outline-color: dt('message.success.close.button.focus.ring.color');
        box-shadow: dt('message.success.close.button.focus.ring.shadow');
    }

    .p-message-success .p-message-close-button:hover {
        background: dt('message.success.close.button.hover.background');
    }

    .p-message-success.p-message-outlined {
        color: dt('message.success.outlined.color');
        outline-color: dt('message.success.outlined.border.color');
    }

    .p-message-success.p-message-simple {
        color: dt('message.success.simple.color');
    }

    .p-message-warn {
        background: dt('message.warn.background');
        outline-color: dt('message.warn.border.color');
        color: dt('message.warn.color');
        box-shadow: dt('message.warn.shadow');
    }

    .p-message-warn .p-message-close-button:focus-visible {
        outline-color: dt('message.warn.close.button.focus.ring.color');
        box-shadow: dt('message.warn.close.button.focus.ring.shadow');
    }

    .p-message-warn .p-message-close-button:hover {
        background: dt('message.warn.close.button.hover.background');
    }

    .p-message-warn.p-message-outlined {
        color: dt('message.warn.outlined.color');
        outline-color: dt('message.warn.outlined.border.color');
    }

    .p-message-warn.p-message-simple {
        color: dt('message.warn.simple.color');
    }

    .p-message-error {
        background: dt('message.error.background');
        outline-color: dt('message.error.border.color');
        color: dt('message.error.color');
        box-shadow: dt('message.error.shadow');
    }

    .p-message-error .p-message-close-button:focus-visible {
        outline-color: dt('message.error.close.button.focus.ring.color');
        box-shadow: dt('message.error.close.button.focus.ring.shadow');
    }

    .p-message-error .p-message-close-button:hover {
        background: dt('message.error.close.button.hover.background');
    }

    .p-message-error.p-message-outlined {
        color: dt('message.error.outlined.color');
        outline-color: dt('message.error.outlined.border.color');
    }

    .p-message-error.p-message-simple {
        color: dt('message.error.simple.color');
    }

    .p-message-secondary {
        background: dt('message.secondary.background');
        outline-color: dt('message.secondary.border.color');
        color: dt('message.secondary.color');
        box-shadow: dt('message.secondary.shadow');
    }

    .p-message-secondary .p-message-close-button:focus-visible {
        outline-color: dt('message.secondary.close.button.focus.ring.color');
        box-shadow: dt('message.secondary.close.button.focus.ring.shadow');
    }

    .p-message-secondary .p-message-close-button:hover {
        background: dt('message.secondary.close.button.hover.background');
    }

    .p-message-secondary.p-message-outlined {
        color: dt('message.secondary.outlined.color');
        outline-color: dt('message.secondary.outlined.border.color');
    }

    .p-message-secondary.p-message-simple {
        color: dt('message.secondary.simple.color');
    }

    .p-message-contrast {
        background: dt('message.contrast.background');
        outline-color: dt('message.contrast.border.color');
        color: dt('message.contrast.color');
        box-shadow: dt('message.contrast.shadow');
    }

    .p-message-contrast .p-message-close-button:focus-visible {
        outline-color: dt('message.contrast.close.button.focus.ring.color');
        box-shadow: dt('message.contrast.close.button.focus.ring.shadow');
    }

    .p-message-contrast .p-message-close-button:hover {
        background: dt('message.contrast.close.button.hover.background');
    }

    .p-message-contrast.p-message-outlined {
        color: dt('message.contrast.outlined.color');
        outline-color: dt('message.contrast.outlined.border.color');
    }

    .p-message-contrast.p-message-simple {
        color: dt('message.contrast.simple.color');
    }

    .p-message-text {
        font-size: dt('message.text.font.size');
        font-weight: dt('message.text.font.weight');
    }

    .p-message-icon {
        font-size: dt('message.icon.size');
        width: dt('message.icon.size');
        height: dt('message.icon.size');
    }

    .p-message-sm .p-message-content {
        padding: dt('message.content.sm.padding');
    }

    .p-message-sm .p-message-text {
        font-size: dt('message.text.sm.font.size');
    }

    .p-message-sm .p-message-icon {
        font-size: dt('message.icon.sm.size');
        width: dt('message.icon.sm.size');
        height: dt('message.icon.sm.size');
    }

    .p-message-sm .p-message-close-icon {
        font-size: dt('message.close.icon.sm.size');
        width: dt('message.close.icon.sm.size');
        height: dt('message.close.icon.sm.size');
    }

    .p-message-lg .p-message-content {
        padding: dt('message.content.lg.padding');
    }

    .p-message-lg .p-message-text {
        font-size: dt('message.text.lg.font.size');
    }

    .p-message-lg .p-message-icon {
        font-size: dt('message.icon.lg.size');
        width: dt('message.icon.lg.size');
        height: dt('message.icon.lg.size');
    }

    .p-message-lg .p-message-close-icon {
        font-size: dt('message.close.icon.lg.size');
        width: dt('message.close.icon.lg.size');
        height: dt('message.close.icon.lg.size');
    }

    .p-message-outlined {
        background: transparent;
        outline-width: dt('message.outlined.border.width');
    }

    .p-message-simple {
        background: transparent;
        outline-color: transparent;
        box-shadow: none;
    }

    .p-message-simple .p-message-content {
        padding: dt('message.simple.content.padding');
    }

    .p-message-outlined .p-message-close-button:hover,
    .p-message-simple .p-message-close-button:hover {
        background: transparent;
    }

    .p-message-enter-active {
        animation: p-animate-message-enter 0.3s ease-out forwards;
        overflow: hidden;
    }

    .p-message-leave-active {
        animation: p-animate-message-leave 0.15s ease-in forwards;
        overflow: hidden;
    }

    @keyframes p-animate-message-enter {
        from {
            opacity: 0;
            grid-template-rows: 0fr;
        }
        to {
            opacity: 1;
            grid-template-rows: 1fr;
        }
    }

    @keyframes p-animate-message-leave {
        from {
            opacity: 1;
            grid-template-rows: 1fr;
        }
        to {
            opacity: 0;
            margin: 0;
            grid-template-rows: 0fr;
        }
    }
`;var Wo=["container"],Uo=["icon"],qo=["closeicon"],Go=["*"],Qo=t=>({closeCallback:t});function Zo(t,r){t&1&&ce(0)}function Xo(t,r){if(t&1&&H(0,Zo,1,0,"ng-container",4),t&2){let e=C();h("ngTemplateOutlet",e.iconTemplate||e._iconTemplate)}}function Yo(t,r){if(t&1&&Z(0,"i",1),t&2){let e=C();_(e.cn(e.cx("icon"),e.icon)),h("pBind",e.ptm("icon")),T("data-p",e.dataP)}}function Ko(t,r){t&1&&ce(0)}function Jo(t,r){if(t&1&&H(0,Ko,1,0,"ng-container",5),t&2){let e=C();h("ngTemplateOutlet",e.containerTemplate||e._containerTemplate)("ngTemplateOutletContext",zt(2,Qo,e.closeCallback))}}function ei(t,r){if(t&1&&Z(0,"span",9),t&2){let e=C(3);h("pBind",e.ptm("text"))("ngClass",e.cx("text"))("innerHTML",e.text,kt),T("data-p",e.dataP)}}function ti(t,r){if(t&1&&(te(0,"div"),H(1,ei,1,4,"span",8),ne()),t&2){let e=C(2);y(),h("ngIf",!e.escape)}}function ni(t,r){if(t&1&&(te(0,"span",7),pe(1),ne()),t&2){let e=C(3);h("pBind",e.ptm("text"))("ngClass",e.cx("text")),T("data-p",e.dataP),y(),be(e.text)}}function oi(t,r){if(t&1&&H(0,ni,2,4,"span",10),t&2){let e=C(2);h("ngIf",e.escape&&e.text)}}function ii(t,r){if(t&1&&(H(0,ti,2,1,"div",6)(1,oi,1,1,"ng-template",null,0,Vt),te(3,"span",7),Y(4),ne()),t&2){let e=Ot(2),n=C();h("ngIf",!n.escape)("ngIfElse",e),y(3),h("pBind",n.ptm("text"))("ngClass",n.cx("text")),T("data-p",n.dataP)}}function si(t,r){if(t&1&&Z(0,"i",7),t&2){let e=C(2);_(e.cn(e.cx("closeIcon"),e.closeIcon)),h("pBind",e.ptm("closeIcon"))("ngClass",e.closeIcon),T("data-p",e.dataP)}}function ri(t,r){t&1&&ce(0)}function ai(t,r){if(t&1&&H(0,ri,1,0,"ng-container",4),t&2){let e=C(2);h("ngTemplateOutlet",e.closeIconTemplate||e._closeIconTemplate)}}function li(t,r){if(t&1&&(oe(),Z(0,"svg",14)),t&2){let e=C(2);_(e.cx("closeIcon")),h("pBind",e.ptm("closeIcon")),T("data-p",e.dataP)}}function di(t,r){if(t&1){let e=Pt();te(0,"button",11),Oe("click",function(o){St(e);let i=C();return Tt(i.close(o))}),G(1,si,1,5,"i",12),G(2,ai,1,1,"ng-container"),G(3,li,1,4,":svg:svg",13),ne()}if(t&2){let e=C();_(e.cx("closeButton")),h("pBind",e.ptm("closeButton")),T("aria-label",e.closeAriaLabel)("data-p",e.dataP),y(),Q(e.closeIcon?1:-1),y(),Q(e.closeIconTemplate||e._closeIconTemplate?2:-1),y(),Q(!e.closeIconTemplate&&!e._closeIconTemplate&&!e.closeIcon?3:-1)}}var ci={root:({instance:t})=>["p-message p-component p-message-"+t.severity,t.variant&&"p-message-"+t.variant,{"p-message-sm":t.size==="small","p-message-lg":t.size==="large"}],contentWrapper:"p-message-content-wrapper",content:"p-message-content",icon:"p-message-icon",text:"p-message-text",closeButton:"p-message-close-button",closeIcon:"p-message-close-icon"},zn=(()=>{class t extends D{name="message";style=$n;classes=ci;static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275prov=N({token:t,factory:t.\u0275fac})}return t})();var Vn=new L("MESSAGE_INSTANCE"),ui=(()=>{class t extends k{componentName="Message";_componentStyle=p(zn);bindDirectiveInstance=p(m,{self:!0});$pcMessage=p(Vn,{optional:!0,skipSelf:!0})??void 0;onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}severity="info";text;escape=!0;style;styleClass;closable=!1;icon;closeIcon;life;showTransitionOptions="300ms ease-out";hideTransitionOptions="200ms cubic-bezier(0.86, 0, 0.07, 1)";size;variant;motionOptions=d(void 0);computedMotionOptions=z(()=>g(g({},this.ptm("motion")),this.motionOptions()));onClose=new le;get closeAriaLabel(){return this.config.translation.aria?this.config.translation.aria.close:void 0}visible=ee(!0);containerTemplate;iconTemplate;closeIconTemplate;templates;_containerTemplate;_iconTemplate;_closeIconTemplate;closeCallback=e=>{this.close(e)};onInit(){this.life&&setTimeout(()=>{this.visible.set(!1)},this.life)}onAfterContentInit(){this.templates?.forEach(e=>{switch(e.getType()){case"container":this._containerTemplate=e.template;break;case"icon":this._iconTemplate=e.template;break;case"closeicon":this._closeIconTemplate=e.template;break}})}close(e){this.visible.set(!1),this.onClose.emit({originalEvent:e})}get dataP(){return this.cn({outlined:this.variant==="outlined",simple:this.variant==="simple",[this.severity]:this.severity,[this.size]:this.size})}static \u0275fac=(()=>{let e;return function(o){return(e||(e=v(t)))(o||t)}})();static \u0275cmp=A({type:t,selectors:[["p-message"]],contentQueries:function(n,o,i){if(n&1&&Fe(i,Wo,4)(i,Uo,4)(i,qo,4)(i,Ue,4),n&2){let s;K(s=J())&&(o.containerTemplate=s.first),K(s=J())&&(o.iconTemplate=s.first),K(s=J())&&(o.closeIconTemplate=s.first),K(s=J())&&(o.templates=s)}},hostAttrs:["role","alert","aria-live","polite"],hostVars:5,hostBindings:function(n,o){n&1&&(Bt(function(){return"p-message-enter-active"}),Dt(function(){return"p-message-leave-active"})),n&2&&(T("data-p",o.dataP),_(o.cn(o.cx("root"),o.styleClass)),ue("p-message-leave-active",!o.visible()))},inputs:{severity:"severity",text:"text",escape:[2,"escape","escape",S],style:"style",styleClass:"styleClass",closable:[2,"closable","closable",S],icon:"icon",closeIcon:"closeIcon",life:"life",showTransitionOptions:"showTransitionOptions",hideTransitionOptions:"hideTransitionOptions",size:"size",variant:"variant",motionOptions:[1,"motionOptions"]},outputs:{onClose:"onClose"},features:[M([zn,{provide:Vn,useExisting:t},{provide:V,useExisting:t}]),j([m]),x],ngContentSelectors:Go,decls:7,vars:12,consts:[["escapeOut",""],[3,"pBind"],[3,"pBind","class"],["pRipple","","type","button",3,"pBind","class"],[4,"ngTemplateOutlet"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],[4,"ngIf","ngIfElse"],[3,"pBind","ngClass"],[3,"pBind","ngClass","innerHTML",4,"ngIf"],[3,"pBind","ngClass","innerHTML"],[3,"pBind","ngClass",4,"ngIf"],["pRipple","","type","button",3,"click","pBind"],[3,"pBind","class","ngClass"],["data-p-icon","times",3,"pBind","class"],["data-p-icon","times",3,"pBind"]],template:function(n,o){n&1&&(X(),te(0,"div",1)(1,"div",1),G(2,Xo,1,1,"ng-container"),G(3,Yo,1,4,"i",2),G(4,Jo,1,4,"ng-container")(5,ii,5,5),G(6,di,4,8,"button",3),ne()()),n&2&&(_(o.cx("contentWrapper")),h("pBind",o.ptm("contentWrapper")),T("data-p",o.dataP),y(),_(o.cx("content")),h("pBind",o.ptm("content")),T("data-p",o.dataP),y(),Q(o.iconTemplate||o._iconTemplate?2:-1),y(),Q(o.icon?3:-1),y(),Q(o.containerTemplate||o._containerTemplate?4:5),y(2),Q(o.closable?6:-1))},dependencies:[W,Rt,$e,ze,wn,Ze,R,m,Fn],encapsulation:2,changeDetection:0})}return t})(),ia=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=F({type:t});static \u0275inj=O({imports:[ui,R,R]})}return t})();export{Te as a,V as b,k as c,mt as d,Mi as e,ki as f,un as g,pn as h,$i as i,m as j,Ge as k,vt as l,fn as m,yt as n,Qe as o,Cn as p,wn as q,Ze as r,Us as s,mr as t,To as u,vr as v,Ro as w,Ar as x,Fn as y,ui as z,ia as A};

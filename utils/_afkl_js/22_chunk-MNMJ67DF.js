import{a as Pe,b as He}from"./chunk-D6JNGXQJ.js";import{a as Me,g as te}from"./chunk-RYI5EGTO.js";import{a as Y,b as B,c as F,j as p,k as H,o as ne,r as ke,w as Be,y as Fe}from"./chunk-RI2OWVHL.js";import{$a as L,Gb as De,Hb as R,Ib as Ne,Lb as ee,ab as pe,bb as W}from"./chunk-UDJDSYOH.js";import{Aa as fe,Ab as de,Bb as $,Cb as V,Db as K,Ea as h,Ib as z,Jb as be,La as ge,Lc as Ee,Nb as A,Oa as s,Oc as g,Pb as c,Qb as N,Qc as G,Rb as M,Sb as Z,Ub as Q,Vb as U,Vc as se,Za as v,Zb as Ce,Zc as le,_a as ae,_b as ye,ac as xe,ba as he,bb as T,bc as l,cb as _,cc as Ie,db as f,dc as Ae,fd as Te,ha as S,hd as J,ia as q,ja as re,jd as X,ka as E,kb as u,ma as d,ob as ve,qb as _e,ra as C,sa as y,ta as b,vb as r,vc as P,wb as x,wd as k,xa as O,xb as I,xc as we,yb as D,zb as ce}from"./chunk-BL7DIF2U.js";import{a as j}from"./chunk-RKVZCO54.js";var Qe=n=>`${n.slice(0,3)}-${n.slice(3)}`;function Pn(n){return a=>{let e=a.value;if(!e)return null;let i=e.substring(0,3);if(n&&i!==n)return Object.keys(He).includes(i)?{prefixMismatch:!0}:{prefixInvalid:!0};let t=e.match(/^\d{3}-?(\d{7})(\d)$/);return t?.length!==3?{pattern:!0}:+t[1]%7===+t[2]?null:{pattern:!0}}}function kn(n,a){n.get("isGenerateAwbChecked").valueChanges.pipe(he(a)).subscribe(e=>{e?(n.get("awbNumber").reset(),n.get("awbNumber").disable()):n.get("awbNumber").enable()})}var Ue=n=>`${n.replace("-","")}`,Bn=n=>{let a=(n??"").trim();if(!a)return;let e=Qe(Ue(a)),t=/^(\d{3})-(\d{8})$/.exec(e);if(t)return{waybillPrefix:t[1],waybillNumber:t[2]}};var Ge=["data-p-icon","angle-right"],Sn=(()=>{class n extends ne{static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275cmp=v({type:n,selectors:[["","data-p-icon","angle-right"]],features:[_],attrs:Ge,decls:1,vars:0,consts:[["d","M5.25 11.1728C5.14929 11.1694 5.05033 11.1455 4.9592 11.1025C4.86806 11.0595 4.78666 10.9984 4.72 10.9228C4.57955 10.7822 4.50066 10.5916 4.50066 10.3928C4.50066 10.1941 4.57955 10.0035 4.72 9.86283L7.72 6.86283L4.72 3.86283C4.66067 3.71882 4.64765 3.55991 4.68275 3.40816C4.71785 3.25642 4.79932 3.11936 4.91585 3.01602C5.03238 2.91268 5.17819 2.84819 5.33305 2.83149C5.4879 2.81479 5.64411 2.84671 5.78 2.92283L9.28 6.42283C9.42045 6.56346 9.49934 6.75408 9.49934 6.95283C9.49934 7.15158 9.42045 7.34221 9.28 7.48283L5.78 10.9228C5.71333 10.9984 5.63193 11.0595 5.5408 11.1025C5.44966 11.1455 5.35071 11.1694 5.25 11.1728Z","fill","currentColor"]],template:function(i,t){i&1&&(b(),$(0,"path",0))},encapsulation:2})}return n})();var We=["data-p-icon","times-circle"],Se=(()=>{class n extends ne{pathId;onInit(){this.pathId="url(#"+Y()+")"}static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275cmp=v({type:n,selectors:[["","data-p-icon","times-circle"]],features:[_],attrs:We,decls:5,vars:2,consts:[["fill-rule","evenodd","clip-rule","evenodd","d","M7 14C5.61553 14 4.26215 13.5895 3.11101 12.8203C1.95987 12.0511 1.06266 10.9579 0.532846 9.67879C0.00303296 8.3997 -0.13559 6.99224 0.134506 5.63437C0.404603 4.2765 1.07129 3.02922 2.05026 2.05026C3.02922 1.07129 4.2765 0.404603 5.63437 0.134506C6.99224 -0.13559 8.3997 0.00303296 9.67879 0.532846C10.9579 1.06266 12.0511 1.95987 12.8203 3.11101C13.5895 4.26215 14 5.61553 14 7C14 8.85652 13.2625 10.637 11.9497 11.9497C10.637 13.2625 8.85652 14 7 14ZM7 1.16667C5.84628 1.16667 4.71846 1.50879 3.75918 2.14976C2.79989 2.79074 2.05222 3.70178 1.61071 4.76768C1.16919 5.83358 1.05367 7.00647 1.27876 8.13803C1.50384 9.26958 2.05941 10.309 2.87521 11.1248C3.69102 11.9406 4.73042 12.4962 5.86198 12.7212C6.99353 12.9463 8.16642 12.8308 9.23232 12.3893C10.2982 11.9478 11.2093 11.2001 11.8502 10.2408C12.4912 9.28154 12.8333 8.15373 12.8333 7C12.8333 5.45291 12.2188 3.96918 11.1248 2.87521C10.0308 1.78125 8.5471 1.16667 7 1.16667ZM4.66662 9.91668C4.58998 9.91704 4.51404 9.90209 4.44325 9.87271C4.37246 9.84333 4.30826 9.8001 4.2544 9.74557C4.14516 9.6362 4.0838 9.48793 4.0838 9.33335C4.0838 9.17876 4.14516 9.0305 4.2544 8.92113L6.17553 7L4.25443 5.07891C4.15139 4.96832 4.09529 4.82207 4.09796 4.67094C4.10063 4.51982 4.16185 4.37563 4.26872 4.26876C4.3756 4.16188 4.51979 4.10066 4.67091 4.09799C4.82204 4.09532 4.96829 4.15142 5.07887 4.25446L6.99997 6.17556L8.92106 4.25446C9.03164 4.15142 9.1779 4.09532 9.32903 4.09799C9.48015 4.10066 9.62434 4.16188 9.73121 4.26876C9.83809 4.37563 9.89931 4.51982 9.90198 4.67094C9.90464 4.82207 9.84855 4.96832 9.74551 5.07891L7.82441 7L9.74554 8.92113C9.85478 9.0305 9.91614 9.17876 9.91614 9.33335C9.91614 9.48793 9.85478 9.6362 9.74554 9.74557C9.69168 9.8001 9.62748 9.84333 9.55669 9.87271C9.4859 9.90209 9.40996 9.91704 9.33332 9.91668C9.25668 9.91704 9.18073 9.90209 9.10995 9.87271C9.03916 9.84333 8.97495 9.8001 8.9211 9.74557L6.99997 7.82444L5.07884 9.74557C5.02499 9.8001 4.96078 9.84333 4.88999 9.87271C4.81921 9.90209 4.74326 9.91704 4.66662 9.91668Z","fill","currentColor"],[3,"id"],["width","14","height","14","fill","white"]],template:function(i,t){i&1&&(b(),ce(0,"g"),$(1,"path",0),de(),ce(2,"defs")(3,"clipPath",1),$(4,"rect",2),de()()),i&2&&(u("clip-path",t.pathId),s(3),be("id",t.pathId))},encapsulation:2})}return n})();var Oe=`
    .p-accordionpanel {
        display: flex;
        flex-direction: column;
        border-style: solid;
        border-width: dt('accordion.panel.border.width');
        border-color: dt('accordion.panel.border.color');
    }

    .p-accordionheader {
        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: dt('accordion.header.padding');
        color: dt('accordion.header.color');
        background: dt('accordion.header.background');
        border-style: solid;
        border-width: dt('accordion.header.border.width');
        border-color: dt('accordion.header.border.color');
        font-weight: dt('accordion.header.font.weight');
        border-radius: dt('accordion.header.border.radius');
        transition:
            background dt('accordion.transition.duration'),
            color dt('accordion.transition.duration'),
            outline-color dt('accordion.transition.duration'),
            box-shadow dt('accordion.transition.duration');
        outline-color: transparent;
    }

    .p-accordionpanel:first-child > .p-accordionheader {
        border-width: dt('accordion.header.first.border.width');
        border-start-start-radius: dt('accordion.header.first.top.border.radius');
        border-start-end-radius: dt('accordion.header.first.top.border.radius');
    }

    .p-accordionpanel:last-child > .p-accordionheader {
        border-end-start-radius: dt('accordion.header.last.bottom.border.radius');
        border-end-end-radius: dt('accordion.header.last.bottom.border.radius');
    }

    .p-accordionpanel:last-child.p-accordionpanel-active > .p-accordionheader {
        border-end-start-radius: dt('accordion.header.last.active.bottom.border.radius');
        border-end-end-radius: dt('accordion.header.last.active.bottom.border.radius');
    }

    .p-accordionheader-toggle-icon {
        color: dt('accordion.header.toggle.icon.color');
    }

    .p-accordionpanel:not(.p-disabled) .p-accordionheader:focus-visible {
        box-shadow: dt('accordion.header.focus.ring.shadow');
        outline: dt('accordion.header.focus.ring.width') dt('accordion.header.focus.ring.style') dt('accordion.header.focus.ring.color');
        outline-offset: dt('accordion.header.focus.ring.offset');
    }

    .p-accordionpanel:not(.p-accordionpanel-active):not(.p-disabled) > .p-accordionheader:hover {
        background: dt('accordion.header.hover.background');
        color: dt('accordion.header.hover.color');
    }

    .p-accordionpanel:not(.p-accordionpanel-active):not(.p-disabled) .p-accordionheader:hover .p-accordionheader-toggle-icon {
        color: dt('accordion.header.toggle.icon.hover.color');
    }

    .p-accordionpanel:not(.p-disabled).p-accordionpanel-active > .p-accordionheader {
        background: dt('accordion.header.active.background');
        color: dt('accordion.header.active.color');
    }

    .p-accordionpanel:not(.p-disabled).p-accordionpanel-active > .p-accordionheader .p-accordionheader-toggle-icon {
        color: dt('accordion.header.toggle.icon.active.color');
    }

    .p-accordionpanel:not(.p-disabled).p-accordionpanel-active > .p-accordionheader:hover {
        background: dt('accordion.header.active.hover.background');
        color: dt('accordion.header.active.hover.color');
    }

    .p-accordionpanel:not(.p-disabled).p-accordionpanel-active > .p-accordionheader:hover .p-accordionheader-toggle-icon {
        color: dt('accordion.header.toggle.icon.active.hover.color');
    }

    .p-accordioncontent {
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-accordioncontent-wrapper {
        min-height: 0;
    }

    .p-accordioncontent-content {
        border-style: solid;
        border-width: dt('accordion.content.border.width');
        border-color: dt('accordion.content.border.color');
        background-color: dt('accordion.content.background');
        color: dt('accordion.content.color');
        padding: dt('accordion.content.padding');
    }
`;var ie=["*"],Je=["toggleicon"],Xe=n=>({active:n});function Ye(n,a){}function en(n,a){n&1&&f(0,Ye,0,0,"ng-template")}function nn(n,a){if(n&1&&f(0,en,1,0,null,0),n&2){let e=c();r("ngTemplateOutlet",e.toggleicon)("ngTemplateOutletContext",we(2,Xe,e.active()))}}function tn(n,a){if(n&1&&D(0,"span",4),n&2){let e=c(3);l(e.cn(e.cx("toggleicon"),e.pcAccordion.collapseIcon)),r("pBind",e.ptm("toggleicon")),u("aria-hidden",!0)}}function on(n,a){if(n&1&&(b(),D(0,"svg",5)),n&2){let e=c(3);l(e.cx("toggleicon")),r("pBind",e.ptm("toggleicon")),u("aria-hidden",!0)}}function rn(n,a){if(n&1&&(V(0),f(1,tn,1,4,"span",2)(2,on,1,4,"svg",3),K()),n&2){let e=c(2);s(),r("ngIf",e.pcAccordion.collapseIcon),s(),r("ngIf",!e.pcAccordion.collapseIcon)}}function an(n,a){if(n&1&&D(0,"span",4),n&2){let e=c(3);l(e.cn(e.cx("toggleicon"),e.pcAccordion.expandIcon)),r("pBind",e.ptm("toggleicon")),u("aria-hidden",!0)}}function cn(n,a){if(n&1&&(b(),D(0,"svg",7)),n&2){let e=c(3);r("pBind",e.ptm("toggleicon")),u("aria-hidden",!0)}}function dn(n,a){if(n&1&&(V(0),f(1,an,1,4,"span",2)(2,cn,1,2,"svg",6),K()),n&2){let e=c(2);s(),r("ngIf",e.pcAccordion.expandIcon),s(),r("ngIf",!e.pcAccordion.expandIcon)}}function sn(n,a){if(n&1&&f(0,rn,3,2,"ng-container",1)(1,dn,3,2,"ng-container",1),n&2){let e=c();r("ngIf",e.active()),s(),r("ngIf",!e.active())}}var ln=`
${Oe}

/* For PrimeNG */
.p-accordionheader-toggle-icon.icon-start {
    order: -1;
}

.p-accordionheader:has(.p-accordionheader-toggle-icon.icon-start) {
    justify-content: flex-start;
    gap: dt('accordion.header.padding');
}

.p-accordionheader.p-ripple {
    overflow: hidden;
    position: relative;
}

.p-accordioncontent .p-motion {
    display: grid;
    grid-template-rows: 1fr;
}
`,pn={root:"p-accordion p-component",panel:({instance:n})=>["p-accordionpanel",{"p-accordionpanel-active":n.active(),"p-disabled":n.disabled()}],header:"p-accordionheader",toggleicon:"p-accordionheader-toggle-icon",contentContainer:"p-accordioncontent",contentWrapper:"p-accordioncontent-wrapper",content:"p-accordioncontent-content"},w=(()=>{class n extends ee{name="accordion";style=ln;classes=pn;static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275prov=q({token:n,factory:n.\u0275fac})}return n})();var Ve=new E("ACCORDION_PANEL_INSTANCE"),Ke=new E("ACCORDION_HEADER_INSTANCE"),Le=new E("ACCORDION_CONTENT_INSTANCE"),Re=new E("ACCORDION_INSTANCE"),me=(()=>{class n extends F{$pcAccordionPanel=d(Ve,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=d(p,{self:!0});componentName="AccordionPanel";onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("root"))}pcAccordion=d(S(()=>oe));value=se(void 0);disabled=G(!1,{transform:e=>te(e)});active=g(()=>this.pcAccordion.multiple()?this.valueEquals(this.pcAccordion.value(),this.value()):this.pcAccordion.value()===this.value());valueEquals(e,i){return Array.isArray(e)?e.includes(i):e===i}_componentStyle=d(w);static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275cmp=v({type:n,selectors:[["p-accordion-panel"],["p-accordionpanel"]],hostVars:4,hostBindings:function(i,t){i&2&&(u("data-p-disabled",t.disabled())("data-p-active",t.active()),l(t.cx("panel")))},inputs:{value:[1,"value"],disabled:[1,"disabled"]},outputs:{value:"valueChange"},features:[P([w,{provide:Ve,useExisting:n},{provide:B,useExisting:n}]),T([p]),_],ngContentSelectors:ie,decls:1,vars:0,template:function(i,t){i&1&&(N(),M(0))},dependencies:[k,H],encapsulation:2,changeDetection:0})}return n})(),un=(()=>{class n extends F{$pcAccordionHeader=d(Ke,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=d(p,{self:!0});componentName="AccordionHeader";onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("root"))}pcAccordion=d(S(()=>oe));pcAccordionPanel=d(S(()=>me));id=g(()=>`${this.pcAccordion.id()}_accordionheader_${this.pcAccordionPanel.value()}`);active=g(()=>this.pcAccordionPanel.active());disabled=g(()=>this.pcAccordionPanel.disabled());ariaControls=g(()=>`${this.pcAccordion.id()}_accordioncontent_${this.pcAccordionPanel.value()}`);toggleicon;onClick(e){if(this.disabled())return;let i=this.active();this.changeActiveValue();let t=this.active(),o=this.pcAccordionPanel.value();!i&&t?this.pcAccordion.onOpen.emit({originalEvent:e,index:o}):i&&!t&&this.pcAccordion.onClose.emit({originalEvent:e,index:o})}onFocus(){!this.disabled()&&this.pcAccordion.selectOnFocus()&&this.changeActiveValue()}onKeydown(e){switch(e.code){case"ArrowDown":this.arrowDownKey(e);break;case"ArrowUp":this.arrowUpKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"Enter":case"Space":case"NumpadEnter":this.onEnterKey(e);break;default:break}}_componentStyle=d(w);changeActiveValue(){this.pcAccordion.updateValue(this.pcAccordionPanel.value())}findPanel(e){return e?.closest('[data-pc-name="accordionpanel"]')}findHeader(e){return L(e,'[data-pc-name="accordionheader"]')}findNextPanel(e,i=!1){let t=i?e:e.nextElementSibling;return t?W(t,"data-p-disabled")?this.findNextPanel(t):this.findHeader(t):null}findPrevPanel(e,i=!1){let t=i?e:e.previousElementSibling;return t?W(t,"data-p-disabled")?this.findPrevPanel(t):this.findHeader(t):null}findFirstPanel(){return this.findNextPanel(this.pcAccordion.el.nativeElement.firstElementChild,!0)}findLastPanel(){return this.findPrevPanel(this.pcAccordion.el.nativeElement.lastElementChild,!0)}changeFocusedPanel(e,i){pe(i)}arrowDownKey(e){let i=this.findNextPanel(this.findPanel(e.currentTarget));i?this.changeFocusedPanel(e,i):this.onHomeKey(e),e.preventDefault()}arrowUpKey(e){let i=this.findPrevPanel(this.findPanel(e.currentTarget));i?this.changeFocusedPanel(e,i):this.onEndKey(e),e.preventDefault()}onHomeKey(e){let i=this.findFirstPanel();this.changeFocusedPanel(e,i),e.preventDefault()}onEndKey(e){let i=this.findLastPanel();this.changeFocusedPanel(e,i),e.preventDefault()}onEnterKey(e){this.disabled()||this.changeActiveValue(),e.preventDefault()}get dataP(){return this.cn({active:this.active()})}static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275cmp=v({type:n,selectors:[["p-accordion-header"],["p-accordionheader"]],contentQueries:function(i,t,o){if(i&1&&Z(o,Je,5),i&2){let m;Q(m=U())&&(t.toggleicon=m.first)}},hostVars:13,hostBindings:function(i,t){i&1&&A("click",function(m){return t.onClick(m)})("focus",function(){return t.onFocus()})("keydown",function(m){return t.onKeydown(m)}),i&2&&(u("id",t.id())("aria-expanded",t.active())("aria-controls",t.ariaControls())("aria-disabled",t.disabled())("role","button")("tabindex",t.disabled()?"-1":"0")("data-p-active",t.active())("data-p-disabled",t.disabled())("data-p",t.dataP),l(t.cx("header")),ye("user-select","none"))},features:[P([w,{provide:Ke,useExisting:n},{provide:B,useExisting:n}]),T([ke,p]),_],ngContentSelectors:ie,decls:3,vars:1,consts:[[4,"ngTemplateOutlet","ngTemplateOutletContext"],[4,"ngIf"],[3,"class","pBind",4,"ngIf"],["data-p-icon","chevron-up",3,"class","pBind",4,"ngIf"],[3,"pBind"],["data-p-icon","chevron-up",3,"pBind"],["data-p-icon","chevron-down",3,"pBind",4,"ngIf"],["data-p-icon","chevron-down",3,"pBind"]],template:function(i,t){i&1&&(N(),M(0),ve(1,nn,1,4)(2,sn,2,2)),i&2&&(s(),_e(t.toggleicon?1:2))},dependencies:[k,J,X,Me,Pe,H,p],encapsulation:2,changeDetection:0})}return n})(),mn=(()=>{class n extends F{$pcAccordionContent=d(Le,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=d(p,{self:!0});componentName="AccordionContent";onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("root"))}pcAccordion=d(S(()=>oe));pcAccordionPanel=d(S(()=>me));active=g(()=>this.pcAccordionPanel.active());ariaLabelledby=g(()=>`${this.pcAccordion.id()}_accordionheader_${this.pcAccordionPanel.value()}`);id=g(()=>`${this.pcAccordion.id()}_accordioncontent_${this.pcAccordionPanel.value()}`);_componentStyle=d(w);ptParams=g(()=>({context:this.active()}));computedMotionOptions=g(()=>j(j({},this.ptm("motion",this.ptParams())),this.pcAccordion.computedMotionOptions()));static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275cmp=v({type:n,selectors:[["p-accordion-content"],["p-accordioncontent"]],hostVars:6,hostBindings:function(i,t){i&2&&(u("id",t.id())("role","region")("data-p-active",t.active())("aria-labelledby",t.ariaLabelledby()),l(t.cx("contentContainer")))},features:[P([w,{provide:Le,useExisting:n},{provide:B,useExisting:n}]),T([p]),_],ngContentSelectors:ie,decls:4,vars:10,consts:[["name","p-collapsible","hideStrategy","visibility",3,"visible","mountOnEnter","unmountOnLeave","options"],[3,"pBind"]],template:function(i,t){i&1&&(N(),x(0,"p-motion",0)(1,"div",1)(2,"div",1),M(3),I()()()),i&2&&(r("visible",t.active())("mountOnEnter",!1)("unmountOnLeave",!1)("options",t.computedMotionOptions()),s(),l(t.cx("contentWrapper")),r("pBind",t.ptm("contentWrapper",t.ptParams())),s(),l(t.cx("content")),r("pBind",t.ptm("content",t.ptParams())))},dependencies:[k,H,p,Fe,Be],encapsulation:2,changeDetection:0})}return n})(),oe=(()=>{class n extends F{componentName="Accordion";$pcAccordion=d(Re,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=d(p,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("root"))}value=se(void 0);multiple=G(!1,{transform:e=>te(e)});styleClass;expandIcon;collapseIcon;selectOnFocus=G(!1,{transform:e=>te(e)});transitionOptions="400ms cubic-bezier(0.86, 0, 0.07, 1)";motionOptions=G(void 0);computedMotionOptions=g(()=>j(j({},this.ptm("motion")),this.motionOptions()));onClose=new O;onOpen=new O;id=fe(Y("pn_id_"));_componentStyle=d(w);onKeydown(e){switch(e.code){case"ArrowDown":this.onTabArrowDownKey(e);break;case"ArrowUp":this.onTabArrowUpKey(e);break;case"Home":e.shiftKey||this.onTabHomeKey(e);break;case"End":e.shiftKey||this.onTabEndKey(e);break}}onTabArrowDownKey(e){let i=this.findNextHeaderAction(e.target.parentElement);i?this.changeFocusedTab(i):this.onTabHomeKey(e),e.preventDefault()}onTabArrowUpKey(e){let i=this.findPrevHeaderAction(e.target.parentElement);i?this.changeFocusedTab(i):this.onTabEndKey(e),e.preventDefault()}onTabHomeKey(e){let i=this.findFirstHeaderAction();this.changeFocusedTab(i),e.preventDefault()}changeFocusedTab(e){e&&pe(e)}findNextHeaderAction(e,i=!1){let t=i?e:e.nextElementSibling,o=L(t,'[data-pc-section="accordionheader"]');return o?W(o,"data-p-disabled")?this.findNextHeaderAction(o.parentElement):L(o.parentElement,'[data-pc-section="accordionheader"]'):null}findPrevHeaderAction(e,i=!1){let t=i?e:e.previousElementSibling,o=L(t,'[data-pc-section="accordionheader"]');return o?W(o,"data-p-disabled")?this.findPrevHeaderAction(o.parentElement):L(o.parentElement,'[data-pc-section="accordionheader"]'):null}findFirstHeaderAction(){let e=this.el.nativeElement.firstElementChild;return this.findNextHeaderAction(e,!0)}findLastHeaderAction(){let e=this.el.nativeElement.lastElementChild;return this.findPrevHeaderAction(e,!0)}onTabEndKey(e){let i=this.findLastHeaderAction();this.changeFocusedTab(i),e.preventDefault()}getBlockableElement(){return this.el.nativeElement.children[0]}updateValue(e){let i=this.value();if(this.multiple()){let t=Array.isArray(i)?[...i]:[],o=t.indexOf(e);o!==-1?t.splice(o,1):t.push(e),this.value.set(t)}else i===e?this.value.set(void 0):this.value.set(e)}static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275cmp=v({type:n,selectors:[["p-accordion"]],hostVars:2,hostBindings:function(i,t){i&1&&A("keydown",function(m){return t.onKeydown(m)}),i&2&&l(t.cn(t.cx("root"),t.styleClass))},inputs:{value:[1,"value"],multiple:[1,"multiple"],styleClass:"styleClass",expandIcon:"expandIcon",collapseIcon:"collapseIcon",selectOnFocus:[1,"selectOnFocus"],transitionOptions:"transitionOptions",motionOptions:[1,"motionOptions"]},outputs:{value:"valueChange",onClose:"onClose",onOpen:"onOpen"},features:[P([w,{provide:Re,useExisting:n},{provide:B,useExisting:n}]),T([p]),_],ngContentSelectors:ie,decls:1,vars:0,template:function(i,t){i&1&&(N(),M(0))},dependencies:[k,R,H],encapsulation:2,changeDetection:0})}return n})(),lt=(()=>{class n{static \u0275fac=function(i){return new(i||n)};static \u0275mod=ae({type:n});static \u0275inj=re({imports:[oe,R,me,un,mn,H,R,H]})}return n})();var je=`
    .p-chip {
        display: inline-flex;
        align-items: center;
        background: dt('chip.background');
        color: dt('chip.color');
        border-radius: dt('chip.border.radius');
        padding-block: dt('chip.padding.y');
        padding-inline: dt('chip.padding.x');
        gap: dt('chip.gap');
    }

    .p-chip-icon {
        color: dt('chip.icon.color');
        font-size: dt('chip.icon.size');
        width: dt('chip.icon.size');
        height: dt('chip.icon.size');
    }

    .p-chip-image {
        border-radius: 50%;
        width: dt('chip.image.width');
        height: dt('chip.image.height');
        margin-inline-start: calc(-1 * dt('chip.padding.y'));
    }

    .p-chip:has(.p-chip-remove-icon) {
        padding-inline-end: dt('chip.padding.y');
    }

    .p-chip:has(.p-chip-image) {
        padding-block-start: calc(dt('chip.padding.y') / 2);
        padding-block-end: calc(dt('chip.padding.y') / 2);
    }

    .p-chip-remove-icon {
        cursor: pointer;
        font-size: dt('chip.remove.icon.size');
        width: dt('chip.remove.icon.size');
        height: dt('chip.remove.icon.size');
        color: dt('chip.remove.icon.color');
        border-radius: 50%;
        transition:
            outline-color dt('chip.transition.duration'),
            box-shadow dt('chip.transition.duration');
        outline-color: transparent;
    }

    .p-chip-remove-icon:focus-visible {
        box-shadow: dt('chip.remove.icon.focus.ring.shadow');
        outline: dt('chip.remove.icon.focus.ring.width') dt('chip.remove.icon.focus.ring.style') dt('chip.remove.icon.focus.ring.color');
        outline-offset: dt('chip.remove.icon.focus.ring.offset');
    }
`;var hn=["removeicon"],fn=["*"];function gn(n,a){if(n&1){let e=z();x(0,"img",4),A("error",function(t){C(e);let o=c();return y(o.imageError(t))}),I()}if(n&2){let e=c();l(e.cx("image")),r("pBind",e.ptm("image"))("src",e.image,ge)("alt",e.alt)}}function vn(n,a){if(n&1&&D(0,"span",6),n&2){let e=c(2);l(e.icon),r("pBind",e.ptm("icon"))("ngClass",e.cx("icon"))}}function _n(n,a){if(n&1&&f(0,vn,1,4,"span",5),n&2){let e=c();r("ngIf",e.icon)}}function bn(n,a){if(n&1&&(x(0,"div",7),Ie(1),I()),n&2){let e=c();l(e.cx("label")),r("pBind",e.ptm("label")),s(),Ae(e.label)}}function Cn(n,a){if(n&1){let e=z();x(0,"span",11),A("click",function(t){C(e);let o=c(3);return y(o.close(t))})("keydown",function(t){C(e);let o=c(3);return y(o.onKeydown(t))}),I()}if(n&2){let e=c(3);l(e.removeIcon),r("pBind",e.ptm("removeIcon"))("ngClass",e.cx("removeIcon")),u("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel)}}function yn(n,a){if(n&1){let e=z();b(),x(0,"svg",12),A("click",function(t){C(e);let o=c(3);return y(o.close(t))})("keydown",function(t){C(e);let o=c(3);return y(o.onKeydown(t))}),I()}if(n&2){let e=c(3);l(e.cx("removeIcon")),r("pBind",e.ptm("removeIcon")),u("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel)}}function xn(n,a){if(n&1&&(V(0),f(1,Cn,1,6,"span",9)(2,yn,1,5,"svg",10),K()),n&2){let e=c(2);s(),r("ngIf",e.removeIcon),s(),r("ngIf",!e.removeIcon)}}function In(n,a){}function An(n,a){n&1&&f(0,In,0,0,"ng-template")}function wn(n,a){if(n&1){let e=z();x(0,"span",13),A("click",function(t){C(e);let o=c(2);return y(o.close(t))})("keydown",function(t){C(e);let o=c(2);return y(o.onKeydown(t))}),f(1,An,1,0,null,14),I()}if(n&2){let e=c(2);l(e.cx("removeIcon")),r("pBind",e.ptm("removeIcon")),u("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel),s(),r("ngTemplateOutlet",e.removeIconTemplate||e._removeIconTemplate)}}function En(n,a){if(n&1&&(V(0),f(1,xn,3,2,"ng-container",3)(2,wn,2,6,"span",8),K()),n&2){let e=c();s(),r("ngIf",!e.removeIconTemplate&&!e._removeIconTemplate),s(),r("ngIf",e.removeIconTemplate||e._removeIconTemplate)}}var Tn={root:({instance:n})=>({display:!n.visible&&"none"})},Dn={root:({instance:n})=>["p-chip p-component",{"p-disabled":n.disabled}],image:"p-chip-image",icon:"p-chip-icon",label:"p-chip-label",removeIcon:"p-chip-remove-icon"},$e=(()=>{class n extends ee{name="chip";style=je;classes=Dn;inlineStyles=Tn;static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275prov=q({token:n,factory:n.\u0275fac})}return n})();var ze=new E("CHIP_INSTANCE"),kt=(()=>{class n extends F{componentName="Chip";$pcChip=d(ze,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=d(p,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}label;icon;image;alt;styleClass;disabled=!1;removable=!1;removeIcon;onRemove=new O;onImageError=new O;visible=!0;get removeAriaLabel(){return this.config.getTranslation(Ne.ARIA).removeLabel}get chipProps(){return this._chipProps}set chipProps(e){this._chipProps=e,e&&typeof e=="object"&&Object.entries(e).forEach(([i,t])=>this[`_${i}`]!==t&&(this[`_${i}`]=t))}_chipProps;_componentStyle=d($e);removeIconTemplate;templates;_removeIconTemplate;onAfterContentInit(){this.templates.forEach(e=>{e.getType()==="removeicon"?this._removeIconTemplate=e.template:this._removeIconTemplate=e.template})}onChanges(e){if(e.chipProps&&e.chipProps.currentValue){let{currentValue:i}=e.chipProps;i.label!==void 0&&(this.label=i.label),i.icon!==void 0&&(this.icon=i.icon),i.image!==void 0&&(this.image=i.image),i.alt!==void 0&&(this.alt=i.alt),i.styleClass!==void 0&&(this.styleClass=i.styleClass),i.removable!==void 0&&(this.removable=i.removable),i.removeIcon!==void 0&&(this.removeIcon=i.removeIcon)}}close(e){this.visible=!1,this.onRemove.emit(e)}onKeydown(e){(e.key==="Enter"||e.key==="Backspace")&&this.close(e)}imageError(e){this.onImageError.emit(e)}get dataP(){return this.cn({removable:this.removable})}static \u0275fac=(()=>{let e;return function(t){return(e||(e=h(n)))(t||n)}})();static \u0275cmp=v({type:n,selectors:[["p-chip"]],contentQueries:function(i,t,o){if(i&1&&Z(o,hn,4)(o,De,4),i&2){let m;Q(m=U())&&(t.removeIconTemplate=m.first),Q(m=U())&&(t.templates=m)}},hostVars:6,hostBindings:function(i,t){i&2&&(u("aria-label",t.label)("data-p",t.dataP),xe(t.sx("root")),l(t.cn(t.cx("root"),t.styleClass)))},inputs:{label:"label",icon:"icon",image:"image",alt:"alt",styleClass:"styleClass",disabled:[2,"disabled","disabled",le],removable:[2,"removable","removable",le],removeIcon:"removeIcon",chipProps:"chipProps"},outputs:{onRemove:"onRemove",onImageError:"onImageError"},features:[P([$e,{provide:ze,useExisting:n},{provide:B,useExisting:n}]),T([p]),_],ngContentSelectors:fn,decls:6,vars:4,consts:[["iconTemplate",""],[3,"pBind","class","src","alt","error",4,"ngIf","ngIfElse"],[3,"pBind","class",4,"ngIf"],[4,"ngIf"],[3,"error","pBind","src","alt"],[3,"pBind","class","ngClass",4,"ngIf"],[3,"pBind","ngClass"],[3,"pBind"],["role","button",3,"pBind","class","click","keydown",4,"ngIf"],["role","button",3,"pBind","class","ngClass","click","keydown",4,"ngIf"],["data-p-icon","times-circle","role","button",3,"pBind","class","click","keydown",4,"ngIf"],["role","button",3,"click","keydown","pBind","ngClass"],["data-p-icon","times-circle","role","button",3,"click","keydown","pBind"],["role","button",3,"click","keydown","pBind"],[4,"ngTemplateOutlet"]],template:function(i,t){if(i&1&&(N(),M(0),f(1,gn,1,5,"img",1)(2,_n,1,1,"ng-template",null,0,Ee)(4,bn,2,4,"div",2)(5,En,3,2,"ng-container",3)),i&2){let o=Ce(3);s(),r("ngIf",t.image)("ngIfElse",o),s(3),r("ngIf",t.label),s(),r("ngIf",t.removable)}},dependencies:[k,Te,J,X,Se,R,p],encapsulation:2,changeDetection:0})}return n})();export{Sn as a,Se as b,Qe as c,Pn as d,kn as e,Ue as f,Bn as g,kt as h,me as i,un as j,mn as k,oe as l,lt as m};

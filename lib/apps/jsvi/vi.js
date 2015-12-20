/**@license
 *  JSVI - VI in JavaScript.
 *  Copyright (C) 2006-2008 Internet Connection, Inc.
 *  Copyright (C) 2013 Jakub Jankiewicz
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

/* TODO

sortof bugs:
   the toolbar is kind of ugly- possibly replace with an image-version-
   or more likely- replace with styled buttons

ideas:
   uneditable sections?

   a ruler at the 72 character mark? possibly word-wrapping?

   want to switch between vi/emacs modes?

*/
var vi = (function() {

    // Browser detection from jQuery 1.8.3
    var browser = (function() {
        var matched, browser;

        var uaMatch = function( ua ) {
            ua = ua.toLowerCase();

            var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
                /(msie) ([\w.]+)/.exec( ua ) ||
                ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
                [];

            return {
                browser: match[ 1 ] || "",
                version: match[ 2 ] || "0"
            };
        };

        matched = uaMatch( navigator.userAgent );
        browser = {};

        if ( matched.browser ) {
            browser[ matched.browser ] = true;
            browser.version = matched.version;
        }

        // Chrome is Webkit, but Webkit is also Safari.
        if ( browser.chrome ) {
            browser.webkit = true;
        } else if ( browser.webkit ) {
            browser.safari = true;
        }
        return browser;
    })();


    var emacsen = false;
    var term_cols;
    var term_rows;
    var term_win_width;
    var term_win_height;
    var term_cur_width;

    var suggest;
    var backing;

    var fakemode;

    var tagstyle = 0;
    var line_height = 0;
    var cclick = undefined;

    var mode = 0;
    var accum = 0;
    var lastaccum = 0;
    var marks = new Object();
    var registers = new Object();
    var lastreg = '';

    var lastcommand;
    var lastmotion;
    var cursoriv;
    var drawiv;

    var term;
    var base = 0;
    var left = 0;

    var spell_script;

    var vselm = 0;
    var vselx = undefined;
    var vsely = undefined;
    var vseld = false;

    var lastkey = undefined;

    var statustext = '';
    var command = '';
    var oldcommand = '';
    var commandleft = 0;
    var savex, savey;
    var once = true;

    var cursorx, cursory;
    var file = new Array();
    var tags = new Array();
    var palette;
    var cursor;

    var yank_buffer = undefined;

    var term_save_h = new Array();

    var term_save_ss;
    var term_save_mc;
    var term_save_kd;
    var term_save_kp;
    var term_save_rs;
    var term_save_op;

    var lastsearch;
    var lastsubst;
    var lastflags;

    var undoset = undefined;
    var undoline = undefined;
    var undoy = -1;

    var term_ex_motion;
    var vi_ft_reg;
    var viflags = '';
    var lastinsert = '';

    var spelling = false;
    var spellcheck = new Object();
    var safewords = new Object();
    var brokenwords = new Object();
    var suggestions = new Object();

    var onSave, onExit;

    safewords['jsvi']=true;
    safewords['javascript']=true;
    safewords['URL']=true;
    safewords['hyperlinks']=true;
    safewords['HTML']=true;
    safewords['UNIX']=true;
    safewords['Firefox']=true;
    safewords['MSIE']=true;
    safewords['Ctrl']=true;
    safewords['vi']=true;
    safewords['vi-keys']=true;
    safewords[':hardcopy']=true;
    safewords['unicode-aware']=true;
    safewords['developer-centric']=true;

    var doing_backing_paste = false;

    function _true() { return true; }
    function _false() { return false; }

    function _cbrestore() {
        var i;
        for (i = 0; i < term_save_h.length; i++) {
            var z = term_save_h[i];
            z();
        }
        term_save_h = new Array();
    }
    function _cbw(nx,ny) {
        var nz = window['on'+nx];
        (function(x,y,z) {
            term_save_h[term_save_h.length] = function() {
                window['on'+x] = z;
            };
        })(nx,ny,nz);
        window['on'+nx]=ny;
    }
    function _cbd(nx,ny) {
        var nz = document['on'+nx];
        (function(x,y,z) {
            term_save_h[term_save_h.length] = function() {
                document['on'+x] = z;
            };
        })(nx, ny, nz);
        document['on'+nx]=ny;
    }
    function _rer(re,t,aa) {
        if (RegExp.rightContext != undefined) return RegExp.rightContext;
        // emulate rightContext
        var s = re.toString();
        if ((s.substr(0,2) == '/^' && s.substr(s.length-1,1) == '/') || s.substr(0,1) == '^') {
            // bound at beginning
            return t.substr(aa[0].length, t.length - aa[0].length);
        }
        if ((s.substr(0,1) == '/' && s.substr(s.length-2,2) == '$/') || s.substr(s.length-1,1) == '$') {
            // bound at end
            return "";
        }
        var j = t.lastIndexOf(aa[0]);
        if (j != -1) return t.substr(j.t.length-j);
        return t;

    }
    function _rel(re,t,aa) {
        if (RegExp.leftContext != undefined) return RegExp.leftContext;
        // emulate leftContext
        var s = re.toString();
        if ((s.substr(0,2) == '/^' && s.substr(s.length-1,1) == '/') || s.substr(0,1) == '^') {
            // bound at beginning
            return "";
        }
        if ((s.substr(0,1) == '/' && s.substr(s.length-2,2) == '$/') || s.substr(s.length-1,1) == '$') {
            // bound at end
            return t.substr(0, t.length - aa[0].length);
        }
        var j = t.indexOf(aa[0]);
        if (j != -1) return t.substr(0,j);
        return "";
    }
    function _hra(x) {
        var i;
        var cx = 0;
        var t = '';
        var g = '';
        for (i = 0; i < x.length; i++) {
            var x3 = x.substr(i,3);
            var gx = String.fromCharCode(cx);
            if (x3 == '<b>') {
                cx = cx | 1;
                i += 2;
            } else if (x3 == '</b') {
                cx = (cx | 1) ^ 1;
                i += 3;
            } else if (x3 == '<u>') {
                cx = cx | 2;
                i += 2;
            } else if (x3 == '</u') {
                cx = (cx | 2) ^ 2;
                i += 3;
            } else if (x3 == '<i>') {
                cx = cx | 16;
                i += 2;
            } else if (x3 == '</i') {
                cx = (cx | 16) ^ 16;
                i += 3;
            } else if (x3 == '<sp') { // <span class="rv">
                cx = cx | 4;
                i += 16;
            } else if (x3 == '</s') { // </span>
                cx = (cx | 4) ^ 4;
                i += 6;
            } else if (x3 == '&am') { // &amp;
                t += '&';
                g += gx;
                i += 4;
            } else if (x3 == '&lt') { // &lt;
                t += '<';
                g += gx;
                i += 3;
            } else {
                t += x.substr(i,1);
                g += gx;
            }
        }
        var aa = new Array();
        aa[0] = t;
        aa[1] = g;
        return aa;
    }
    function _rtf(t,g) {
        var cx = 0;
        var i;
        var o = '';
        if (t == undefined) {
            t = '';
            g = '';
        }
        for (i = 0; i < t.length; i++) {
            var gx = g.substr(i, 1).charCodeAt(0);
            var tx = t.substr(i, 1);
            if (tx == "<") tx = "&lt;";
            else if (tx == '&') tx = '&amp;';
            if (gx != cx) {
                if ((gx & 1) && !(cx & 1)) {
                    o += "<b>";
                } else if (!(gx & 1) && (cx & 1)) {
                    o += "</b>";
                }

                if ((gx & 2) && !(cx & 2)) {
                    o += "<u>";
                } else if (!(gx & 2) && (cx & 2)) {
                    o += "</u>";
                }

                if ((gx & 4) && !(cx & 4)) {
                    o += "<span class=\"rv\">";
                } else if (!(gx & 4) && (cx & 4)) {
                    o += "</span>";
                }
                if ((gx & 16) && !(cx & 16)) {
                    o += "<i>";
                } else if (!(gx & 16) && (cx & 16)) {
                    o += "</i>";
                }
                cx = gx;
            }
            o += tx;
        }
        return o;
    }
    function _rtfl(y) {
        return _rtf(file[y],tags[y]);
    }
    function _dfx(q) {
    /*@cc_on @*/
    /*@if (1) return
    @end @*/
        q.style.position = 'fixed';
    }
    function term_freeze() {
        var i;
        var o = '';
        for (i = 0; i < file.length; i++) {
            o += _rtfl(i)+"\n";
        }
        return o;
    }
    function term_thaw(s) {
        var a = s.split("\n");
        var i;
        var aa;
        file = new Array();
        tags = new Array();
        var o = '';
        for (i = 0; i < a.length; i++) {
            aa = _hra(a[i]);
            file[i] = aa[0];
            tags[i] = aa[1];
        }
    }

    function _mxo(z,y) {
        var i;
        var o = '';
        for (i = 0; i < z.length; i++) {
            o += String.fromCharCode(z.substr(i, 1).charCodeAt(0) | y);
        }
        return o;
    }
    function _mxs(n,y) {
        var z = String.fromCharCode(y);
        var i;
        var o = '';
        for (i = 0; i < n; i++) {
            o += z;
        }
        return o;
    }
    function _zeros(n) {
        return _mxs(n,0);
    }
    function _fauc() {
        var d = document.getElementsByTagName('A');
        var i;
        for (i = 0; i < d.length; i++) {
            var j = d[i];
            if (j._len && j._term) {
                if (j._row == (base+cursory) && (left+cursorx) >= j._col && (left+cursorx) <= (j._col+j._len)) {
                    return j;
                }
            }
        }
        return undefined;
    }
    function _pass_click(e) {
        var z = _fauc();
        if (z && z.onclick) return z.onclick();
        return false;
    }
    function _pass_dblclick(e) {
        var z = _fauc();
        if (z && z.ondblclick) return z.ondblclick();
        return false;
    }

    function _cancel_ev(e) {
        if (!e) e = window.event;
        if (!e) return false;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return false;
    }
    function _willclick(e) {
        if (window.event) {
            if (!e) e = window.event;
        }
        if (!e) return true;
        if (cclick != undefined) window.clearTimeout(cclick);
        var x = e.clientX;
        var y = e.clientY;
        cclick = window.setTimeout(function() {
                cclick=undefined;
                _cursortoxy(x,y);
            }, 200);
        return false;
    }
    function _subclick(e) {
        return _willclick(e);
    }
    function _srep(e) {
        if (!e) e = window.event;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        e.cancelBubble=true;
        var y = this._row;
        var x = this._col;
        var len = this._len;
        var rep = this._word;
        var t = (file[y]);
        var g = (tags[y]);
        var w = (t.substr(x, len));
        var st = (g.substr(x, len));
        while (st.length < rep.length) {
            st = st + st;
        }
        if (st.length > rep.length) {
            st = st.substr(0, rep.length);
        }

        term_save_undo(); // save undo!
        file[y] = t.substr(0, x) + rep + t.substr(x+len, t.length-(x+len));
        tags[y] = g.substr(0, x) + st + g.substr(x+len, t.length-(x+len));
        suggest.style.display = 'none';
        suggest._visible = false;
        while (suggest.firstChild) suggest.removeChild(suggest.firstChild);
        if (w == rep) {
            statustext = '';
        } else {
            statustext = 'Replaced "' + w + '" with "' + rep + '"';
        }
        term_redraw();
        return false;
    }
    function _rl(w,h) {
        var x = document.createElement('DIV');
        x.style.overflow = 'hidden';
        x.style.height = h + 'px';
        x.style.marginLeft = w + 'px';
        x.style.marginRight = w + 'px';
        x.style.backgroundColor = palette[0];
        x.style.display = 'block';
        x.style.innerHTML = '&nbsp;';
        x.style.fontFamily = 'monospace';
        return x;
    }
    function _ruo(t) {
        this.style.color = palette[0];
        this.style.backgroundColor = palette[1];
    }
    function _rux(t) {
        this.style.color = palette[1];
        this.style.backgroundColor = palette[0];
    }
    function _openurl(e) {
        var u = this._term;
        window.open(u,'_new');
        return true;
    }
    function _suggest(e) {
        var z = this;
        if (window.event) {
            if (!e) e = window.event;
        }
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            e.cancelBubble=true;
        }
        (function(q) {
            window.setTimeout(function(){
                _dosuggest(q);
            }, 10);
        })(z);
        return false;
    }
    function _dosuggest(z) {
        var x = 0;
        var y = 0;
        var xt = z._term;
        var wrow = z._row;
        var wcol = z._col;
        var wlen = z._len;
        while (z && z != document.body) {
            x += z.offsetLeft;
            y += z.offsetTop;
            z = z.offsetParent;
        }

        suggest._visible = true;
        suggest.style.top = y + 'px';
        suggest.style.left = x + 'px';
        suggest.style.display = 'block';
        suggest.style.zIndex = '3';
        suggest.style.padding = '2px';

        while (suggest.firstChild) suggest.removeChild(suggest.firstChild);

        var sg = document.createElement('DIV');
        sg.style.backgroundColor = palette[0];
        sg.style.color = palette[1];
        sg.style.fontSize = '100%';
        sg.style.padding = '2px';
        sg.style.textAlign = 'center';
        sg.style.cursor = 'default';

        var sa = suggestions[xt];
        var i;
        var fs = 200;
        var fd = parseInt((100 / sa.length) * 1.5);
        var bf;
        for (i = 0; i < sa.length; i++) {
            var da = document.createElement('A');
            da.href = 'javascript:void(0)';
            da.onclick = _srep;
            da._word = sa[i];
            da._row = wrow;
            da._col = wcol;
            da._len = wlen;
            da.onmouseover = _ruo;
            da.onmouseout = _rux;
            da.style.margin = '4px';
            da.style.textDecoration = 'none';
            da.style.display = 'block';
            da.style.color = palette[1];
            da.style.backgroundColor = palette[0];
            da.style.fontSize = fs + '%';
            fs -= fd;
            if (fs <= 100) fs = 100;
            da.appendChild(document.createTextNode(sa[i]));
            // err...
            da.appendChild(document.createElement('BR'));
            if ((wrow-base) > term_rows-(sa.length+1)) {
                sg.insertBefore(da, sg.firstChild);
                bf = true;
            } else if (((i % 2) == 0) || (wrow < (sa.length+1))) {
                sg.appendChild(da);
            } else {
                sg.insertBefore(da, sg.firstChild);
            }
            da = undefined; // break
        }
        if (sa.length == 0) {
            sg.appendChild(document.createTextNode('No matches'));
        }
        var da = document.createElement('A');
        da.href = 'javascript:void(0)';
        da.onclick = _srep;
        da._word = xt;
        da._row = wrow;
        da._col = wcol;
        da._len = wlen;
        da.style.margin= '4px';
        da.style.textDecoration = 'none';
        da.style.color = palette[1];
        da.style.backgroundColor = palette[0];
        da.style.borderBottom = '1px dashed red';
        da.style.fontSize = '100%';
        da.onmouseover = _ruo;
        da.onmouseout = _rux;
        da.appendChild(document.createTextNode(xt));
        if (wrow > term_rows-(sa.length+1)) {
            sg.insertBefore(da, sg.firstChild);
        } else {
            sg.appendChild(da);
        }

        // rounded top and bottom
        suggest.appendChild(_rl(3,1));
        suggest.appendChild(_rl(2,1));
        suggest.appendChild(_rl(1,2));
        suggest.appendChild(sg);
        suggest.appendChild(_rl(1,2));
        suggest.appendChild(_rl(2,1));
        suggest.appendChild(_rl(3,1));

        // msie needs to recalculate these things manually... grr...
        // this doesn't work because msie doesn't calculate offsetwidth (thtphtpht)
        var zq;
        var mw = 11;
        if (mw < xt.length) mw = xt.length;
        for (i = 0; i < sa.length; i++) {
            if (mw < sa[i].length) mw = sa[i].length;
        }

        if (mw) {
            mw *= (term_cur_width*2);
            mw += 16;
            suggest.style.width = mw + 'px';
        }

        var sx = parseInt(sg.offsetWidth / 4);
        if (x < sx) {
            x = 0;
        } else {
            x -= sx;
            suggest.style.left = x + 'px';
        }
        var sy = parseInt(sg.offsetHeight / 4);
        if (bf) {
            suggest.style.top = '';
            suggest.style.bottom = '0px';
        } else if (y < sy) {
            y = 0;
            suggest.style.top = '0px';
            suggest.style.bottom = '';
        } else {
            y -= sy;
            suggest.style.top = y + 'px';
            suggest.style.bottom = '';
        }

        statustext = 'Suggestions for: ' + xt;
        term_redraw();

        da = undefined; // break
        sg = undefined; // break
    }

    function _backing_paste_real() {
        doing_backing_paste = false;
        term_redraw();
        if (!backing.value) return;
        if (backing._lastvalue == backing.value) {
            return;
        }
        backing._lastvalue = backing.value;
        term_paste(false, backing.value);
        term_redraw();
    }
    function _msie_paste() {
        var chunk = "new content associated with this object";
        event.returnValue = false;
        term_paste(false, window.clipboardData.getData("Text", chunk));
    }
    function _backing_paste() {
        _update_backing();
        if (!doing_backing_paste) {
            doing_backing_paste = true;
            window.setTimeout(_backing_paste_real, 10);
        }
    }
    function _update_backing() {
        if (!backing) return;
    /*@cc_on @*/
    /*@if (1) return
    @end @*/
        backing.focus();
        backing.select();
    }
    function _yaty(y) {
        if (line_height) return parseInt(y/line_height);
        var zx;
        var qx = term.firstChild;
        var nh = 0;
        while (qx && qx != document.body) {
            nh += qx.offsetTop;
            qx = qx.offsetParent;
        }

        var ny = 0;
        var cy = 0;
        for (zx = term.firstChild; zx; zx = zx.nextSibling) {
            nh += (zx.offsetHeight + 4);
            if (y <= nh) {
                cy = ny;
                break;
            }
            ny++;
        }
        return cy;
    }
    function _cursortoxy(x,y) {
        // this is a little gross...
        var sx = cursorx;
        cursorx = parseInt(x / term_cur_width);
        term_redraw();

        var sy = cursory;
        cursory = _yaty(y);

        if (cursory >= (term_rows-1)) {
            cursory = sy;
            cursorx = sx;
            sy = 0;
        }

        term_scrollto();
        term_calcx();
        if (cursory != sy) {
            term_redraw();
        } else {
            term_calcy();
        }
        _update_backing();
        return true;
    }
    function _mousescroll(e) {
        if (!e) e = window.event;
        var d = 0;
        if (e.wheelDelta) {
            d = e.wheelDelta;
            if (d < 0) d = 1; else d = -1;
        } else if (e.detail) {
            d = e.detail;
        } else {
            return true;
        }
        if (d < 0) {
            if (base > 0) base--;
        } else if (d > 0) {
            if (base < (file.length - (term_rows-1))) base++;
        }
        term_redraw();
        return false;
    }

    function _mousedown(e) {
        if (suggest._visible) return true;
        if (!e) e = window.event;
        var y = _yaty(e.clientY);
        if (y >= (term_rows-1)) return true;
        _willclick(e);
        vseld = true;
        vselm = 0;
        vselx = undefined;
        vsely = undefined;
        return false;
    }
    function _mousemove(e) {
        if (!e) e = window.event;
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            e.cancelBubble=true;
        }
        if (window.getSelection) {
            var s = window.getSelection();
            if (s.removeAllRanges) s.removeAllRanges();
        }
        if (document.selection && document.selection.empty) {
            eval('try{document.selection.empty();}catch(e){}');
        }
        // fixup selection
        _update_backing();

        if (suggest._visible || !vseld) return true;
        if (vseld) {
            if (vselx == undefined && vsely == undefined) {
                // turn on v here
                vselm = 1;
                vselx = cursorx+left;
                vsely = cursory+base;
            }
            _willclick(e);
            return true;
        }
        return true;
    }
    function _mouseup(e) {
        if (suggest._visible || !vseld) return true;
        vseld = false;
        if (vselm && vselx != undefined && vsely != undefined) {
            // okay, we HAVE selection
            var rr = lastreg;
            lastreg = '*';
            term_vi_set('y');
            term_vi_unset('d');
            term_select();
            term_operate();
            lastreg = rr;
        } else {
            vselm = 0;
        }
        _willclick(e);
        return false;
    }
    function _mouseclick(e) {
        if (!e) e = window.event;
        var y = _yaty(e.clientY);
        if (y >= (term_rows-1)) return true;
        vselm = 0;
        _cursorto(e);
        return true;
    }
    function _cursorto(e) {
        if (!e) e = window.event;
        var x = e.clientX;
        var y = e.clientY;
        if (suggest._visible) {
            suggest.style.display = 'none';
            suggest._visible = false;
            statustext = '';
        }
        return _cursortoxy(x,y);
    }

    function _word(s) {
        var t = s.replace(/[.?!,:]*$/,"");
        if (t) s = t;
        t = s.replace(/[ \r\n\t]/,"");
        if (t) s = t;
        return s;
    }
    function _safe(s) {
        if (s.match(/^[ \r\n\t]*<.*>[ \r\n\t]*$/)) return true;
        return false;
    }
    function _xhttp() {
            var xmlhttp=false;
    /*@cc_on @*/
    /*@if (@_jscript_version >= 5)
     try {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
     } catch (e) {
      try {
       xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (E) {
       xmlhttp = false;
      }
     }
    @end @*/
            if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
                    xmlhttp = new XMLHttpRequest();
            }
        if (!xmlhttp) return new Object(); // fake out caller
            return xmlhttp;
    }

    function term_setmode(n) {
        mode = n;
        lastinsert = '';
    }

    function term_roll_yank() {
        registers["9"] = registers["8"];
        registers["8"] = registers["7"];
        registers["7"] = registers["6"];
        registers["6"] = registers["5"];
        registers["5"] = registers["4"];
        registers["4"] = registers["3"];
        registers["3"] = registers["2"];
        registers["2"] = registers["1"];
        registers["1"] = registers["0"];

        if (lastreg == '0') {
            registers[""] = yank_buffer;
        }
        if (lastreg == "" || lastreg == "*") {
            backing._lastvalue = yank_buffer;
            backing.value = yank_buffer;
        }
        registers["0"] = yank_buffer;
    }

    function term_justify() {
        var y = cursory+base;
        var i;
        if (!accum) accum = 1;
        var t = (file[y]);
        file[p] = t.replace(/[ ][ ]*$/,"");
        tags[p] = tags[p].substr(0, file[p].length);
        for (i = 0; i < accum; i++) {
            var t = file[i+y+1];
            var g = tags[i+y+1];
            term_delete(i+y+1); // ignore return

            t = t.replace(/^[ ][ ]*/,"");
            g = g.substr(g.length - t.length, t.length);
            if (t != '') {
                file[y] = file[y] + " " + t;
                tags[y] = tags[y] + "\0" + g;
            }
        }
        file[y] = file[y].replace(/^[ ][ ]*/,"");
        tags[y] = tags[y].substr(tags[y].length - file[y].length, file[y].length);
        accum = 0;
    }

    function term_vi_bb() {
        return term_skipbackward(/[ ][^ ][^ ]*[ ]*$/);
    }
    function term_vi_b() {
        return term_skipbackward(/[^a-zA-Z0-9_][a-zA-Z0-9_][a-zA-Z0-9_]*[^a-zA-Z0-9_]*$/);
    }
    function term_vi_tt() {
        var t = (file[cursory+base]);
        var i;
        var w = term_cols;
        for (i = (cursorx+left)-1; i >= 0; i--) {
            var c = (t.substr(i, 1));
            if (c == vi_ft_reg) {
                cursorx = (i - left)+1;
                if (cursorx >= w) {
                    left = 0;
                    cursorx = i+1;
                }
                return true;
            }
        }
        return false;
    }
    function term_vi_t() {
        var t = (file[cursory+base]);
        var i;
        for (i = (cursorx+left)+1; i < t.length; i++) {
            var c = (t.substr(i, 1));
            if (c == vi_ft_reg) {
                cursorx = (i - left)-1;
                if (term_vi_flag('d') || term_vi_flag('c') || term_vi_flag('y')) cursorx++;
                if (cursorx < 0) {
                    left = 0;
                    cursorx = i-1;
                }
                return true;
            }
        }
        return false;
    }
    function term_vi_ff() {
        var t = (file[cursory+base]);
        var i;
        for (i = (cursorx+left)-1; i >= 0; i--) {
            var c = (t.substr(i, 1));
            if (c == vi_ft_reg) {
                cursorx = i - left;
                if (cursorx < 0) {
                    left = 0;
                    cursorx = i;
                }
                return true;
            }
        }
        return false;
    }
    function term_vi_f() {
        var t = (file[cursory+base]);
        var i;
        var w = term_cols;
        for (i = (cursorx+left)+1; i < t.length; i++) {
            var c = (t.substr(i, 1));
            if (c == vi_ft_reg) {
                cursorx = i - left;
                if (term_vi_flag('d') || term_vi_flag('c') || term_vi_flag('y')) cursorx++;
                if (cursorx >= w) {
                    left = 0;
                    cursorx = i;
                }
                return true;
            }
        }
        return false;
    }
    function term_vi_eof() {
        cursorx = 0;
        left = 0;
        base = 0;
        if (accum) {
            cursory = accum-1;
            return false;
        } else {
            base = file.length - (term_rows-1);
            cursory = term_rows-1;
            if (base < 0) {
                base = 0;
                cursory = file.length-1;
            }
        }
        term_redraw();
        return true;
    }
    function term_vi_top() {
        cursorx = 0;
        base = 0;
        left = 0;
        if (accum) {
            cursory = accum-1;
            return false;
        } else {
            cursory = 0;
        }
        return true;
    }
    function term_vi_h() { cursorx--; term_scrollto(); return true; }
    function term_vi_j() { cursory++; term_scrollto(); return true; }
    function term_vi_k() { cursory--; term_scrollto(); return true; }
    function term_vi_l() {
        cursorx++;
        // hack
        var a = mode;
        mode = 1;
        term_scrollto();
        mode = a;
        return true;
    }
    function term_vi_ll() {
        cursory = term_rows-2;
        return true;
    }
    function term_vi_mm() {
        cursory = parseInt((term_rows-2) / 2);
        cursorx = 0; left = 0;
        return true;
    }
    function term_vi_hh() {
        cursory = 0;
        return true;
    }
    function term_vi_ob() {
        cursory--;
        return term_skipreverse2(/^[ ]*$/, 0);
    }
    function term_vi_cb() {
        cursory++;
        return term_skipforward(/^[ ]*$/, 0);
    }
    function term_vi_ww() {
        return term_skipforward(/[ ][^ ]/, 0);
    }
    function term_vi_w() {
        return term_skipforward(/[^a-zA-Z0-9_(){}<>][a-zA-Z0-9_(){}<>]/, 0);
    }

    function term_vi_flag(f) {
        return (viflags.indexOf(f) == -1) ? false : true;
    }
    function term_vi_unset(f) {
        var j = viflags.indexOf(f);
        if (j == -1) return;
        viflags = viflags.substr(0, j) + viflags.substr(j+1, (viflags.length-j)-1);
    }
    function term_vi_set(f) {
        if (viflags.indexOf(f) == -1) viflags += ''+f;
    }
    function term_vi_bounce() {
        var y = cursory+base;
        var t = (file[y]);
        var x = cursorx+left;
        var z1 = '[{()}]';
        var z2 = ']})({[';
        while (x < t.length) {
            var z = z1.indexOf(t.substr(x,1));
            if (z == -1) {
                x++;
                continue;
            }
            var d = (z > 2) ? -1 : 1;
            var c=z2.substr(z,1);
            while (y >= 0 && y < file.length) {
                while (x > 0 && x < t.length) {
                    if (t.substr(x,1) == c) {
                        cursorx = x-left;
                        cursory = y;
                        base = 0;
                        term_scrollto();
                        return true;
                    }
                    x += d;
                }
                if (d == -1) {
                    y--;
                    t = file[y];
                    x = (t.length-1)
                } else {
                    y++;
                    t = file[y];
                    x = 0;
                }
            }
        }
        return false;
    }
    function term_vi_eol() {
        var t = (file[cursory+base]);
        cursorx = (t.length)-left;
        if (cursorx < 0) {
            left = 0;
            cursorx = (t.length);
        }
        return true;
    }
    function term_vi_line() {
        var t = (file[cursory+base]);
        left = 0;
        cursorx = t.length+1;
        return true;
    }
    function term_vi_ee() {
        return term_skipforward(/[^ ][ ]/, 1);
    }
    function term_vi_e() {
        if (term_skipforward(/[a-zA-Z0-9_(){}<>][^a-zA-Z0-9_(){}<>]/, 1)) {
            if (term_vi_flag('d') || term_vi_flag('c') || term_vi_flag('y')) cursorx++;
            return true;
        }
        return false;
    }

    function term_vi_v() {
        cursorx = vselx - left;
        if (cursorx < 0) {
            left = 0;
            cursorx = vselx;
        }
        cursory = vsely - base;
        if (cursory < 0) {
            base = 0;
            cursory = vsely;
        }
    }
    function term_vi_vv() {
        term_vi_v();
        term_vi_line();
    }

    function term_select() {
        if (vselm == 1) {
            term_ex_motion = term_vi_v;
        } else if (vselm == 2) {
            term_ex_motion = term_vi_vv;
            cursorx = 0;
            left = 0;
        }
    }
    function term_indent(y,amount) {
        if (file[y] == undefined)  {
            file[y] = '';
            tags[y] = '';
        }
        file[y] = _mxs(amount*4,32)+file[y];
        tags[y] = _mxs(amount*4,tagstyle)+tags[y];
    }
    function term_unindent(y,amount) {
        amount*=4;
        while (amount > 0 && file[y].substr(0, 1) == ' ') {
            file[y] = file[y].substr(1, file[y].length-1);
            amount--;
        }
    }

    function term_operate() {
        term_save_undo();

        var fa = accum;
        if (!fa) fa = 1;
        var sx = cursorx+left;
        var sy = cursory+base;
        while (fa > 0) {
            var t = file[base+cursory];
            if (t == undefined) break;
            if (fa > 1 && ((cursorx+left) >= t.length)) {
                cursory++;
                cursorx = 0;
                left = 0;
            }

            term_ex_motion();
            fa--;
        }
        fa = accum;
        if (!fa) fa = 1;
        accum = 0;
        var ex = cursorx+left;
        var ey = cursory+base;
        var i;
        if (ey < sy) {
            i = ey;
            ey = sy;
            sy = i;
        }
        if (ex < sx) {
            i = ex;
            ex = sx;
            sx = i;
        }
        var t = file[ey];
        var g = tags[ey];
        var restore = false;
        if (term_vi_flag('c')) term_vi_set('d');
        if (vselm != 2 && ey == sy && ex <= t.length) {
            if (vselm) ex++;
            if (ex != sx) {
                if (term_vi_flag('F')) {
                    // styling
                    tags[ey] = (g.substr(0, sx)) + _mxs(ex-sx, tagstyle) + (g.substr(ex, g.length-ex));
                } else if (term_vi_flag('d') || term_vi_flag('y')) {
                    yank_buffer = _rtf(t.substr(sx, ex-sx),
                            g.substr(sx,ex-sx));
                }
                if (term_vi_flag('d')) {
                    file[ey] = (t.substr(0, sx)) + (t.substr(ex, t.length-ex));
                    tags[ey] = (g.substr(0, sx)) + (g.substr(ex, g.length-ex));
                    if (lastreg != '_') {
                        registers[lastreg] = yank_buffer;
                        term_roll_yank();
                    }
                } else if (term_vi_flag('y')) {
                    registers[lastreg] = yank_buffer;
                    term_roll_yank();
                }
                if (term_vi_flag('>')) {
                    term_indent(ey,fa);
                } else if (term_vi_flag('<')) {
                    term_unindent(ey,fa);
                }
            }
        } else if (vselm == 1) {
            if (term_vi_flag('d') || term_vi_flag('y') || term_vi_flag('F')) {
                yank_buffer = '';
                var al, bl;
                for (i = sy; i <= ey; i++) {
                    t = file[i];
                    g = tags[i];
                    if (i == sy) {
                        if ((sy == vsely && sx == vselx) || (sy != vsely && sx != vselx)) {
                            al = sx;
                        } else {
                            al = ex;
                        }
                        bl = t.length;
                    } else if (i == ey) {
                        al = 0;
                        if ((sy == vsely && sx == vselx) || (sy != vsely && sx != vselx)) {
                            al = ex;
                        } else {
                            al = sx;
                        }
                    } else {
                        al = 0;
                        bl = t.length;
                    }
                    yank_buffer += _rtf(t.substr(al, bl-al),
                            g.substr(al,bl-al));
                    if (sy != ey || vselm == 2) yank_buffer += "\n";
                    if (term_vi_flag('d')) {
                        file[i] = t.substr(0, al) + t.substr(bl, t.length-bl);
                        tags[i] = g.substr(0, al) + g.substr(bl, g.length-bl);
                    } else if (term_vi_flag('F')) {
                        tags[i] = g.substr(0, al) + _mxs(bl-al, tagstyle)
                             + g.substr(bl, g.length-bl);
                    }
                    if (term_vi_flag('>')) {
                        term_indent(i,fa);
                    } else if (term_vi_flag('<')) {
                        term_unindent(i,fa);
                    }
                }
                if (lastreg != '_' && !term_vi_flag('F')) {
                    registers[lastreg] = yank_buffer;
                    term_roll_yank();
                }
            }
        } else {
            if (term_vi_flag('F')) {
                for (i = sy; i <= ey; i++) {
                    tags[i] = _mxs(file[i].length, tagstyle);
                }
            } else if (term_vi_flag('d')) {
                yank_buffer = '';
                for (i = sy; i <= ey; i++) {
                    yank_buffer += term_delete(sy);
                }
                if (lastreg != '_') {
                    registers[lastreg] = yank_buffer;
                    term_roll_yank();
                }
            } else if (term_vi_flag('y')) {
                yank_buffer = '';
                for (i = sy; i <= ey; i++) {
                    yank_buffer += _rtfl(sy) + "\n";
                }
                registers[lastreg] = yank_buffer;
                term_roll_yank();
            } else if (term_vi_flag('>')) {
                for (i = sy; i <= ey; i++) {
                    term_indent(i,fa);
                }
            } else if (term_vi_flag('<')) {
                for (i = sy; i <= ey; i++) {
                    term_unindent(i,fa);
                }
            }
        }

        if (term_vi_flag('d')) {
            term_vi_unset('d');
            lastcommand = 'd';
            lastmotion = term_ex_motion;
            restore = true;
        }
        if (term_vi_flag('y')) {
            term_vi_unset('y');
            restore = true;
        }
        if (term_vi_flag('F')) {
            term_vi_unset('F');
            restore = true;
        }
        lastaccum = accum;
        if (restore) {
            cursorx = sx - left;
            if (cursorx < 0) {
                cursorx = sx;
                left = 0;
            }
            cursory = sy - base;
            if (cursory < 0) {
                cursory = sy;
                base = 0;
            }
            term_scrollto();
        }
        if (term_vi_flag('c')) {
            term_vi_unset('c');
            term_setmode(1);
        }
        accum = 0;
    }

    function term_save_undo_line() {
        if ((base+cursory) != undoy) {
            undoy = base+cursory;
            undoline = _rtfl(undoy);
        }
    }
    function term_save_undo() {
        undoset = term_freeze();
    }

    function term_delete(i) {
        if (i > file.length) return '';
        var j;
        var z = file[i];
        var g = tags[i];
        for (j = i+1; j < file.length; j++) {
            file[j-1] = file[j];
            tags[j-1] = tags[j];
        }
        file=_pop(file);
        return _rtf(z,g) + "\n";
    }

    function term_skipreverse2(re, fuzz) {
        var y = cursory+base;
        var x = (cursorx+left)+(1+fuzz);
        for (;;) {
            var t = file[y];
            if (t == undefined) {
                // beep
                cursory = y - base;
                return false;
            }
            if (fuzz) t += " "; else t = " " + t;
            t = (t.substr(x, t.length-x));
            var aa = re.exec(t);
            if (!aa) {
                y--;
                x = 0;
            } else {
                x += _rel(re,t,aa).length;
                cursorx = x - left;
                cursory = y - base;
                return true;
            }
        }
        return false;
    }
    function term_skipforward(re, fuzz) {
        var y = cursory+base;
        var x = (cursorx+left)+(1+fuzz);
        for (;;) {
            var t = file[y];
            if (t == undefined) {
                // beep
                cursory = y - base;
                return false;
            }
            if (fuzz) t += " "; else t = " " + t;
            t = (t.substr(x, t.length-x));
            var aa = re.exec(t);
            if (!aa) {
                y++;
                x = 0;
            } else {
                x += _rel(re,t,aa).length;
                cursorx = x - left;
                cursory = y - base;
                return true;
            }
        }
        return false;
    }
    function term_skipbackward(re) {
        var y = cursory+base;
        var x = (cursorx+left)+1;
        for (;;) {
            var t = file[y];
            if (t == undefined) {
                // beep
                cursory = 0;
                cursorx = 0;
                return false;
            }
            t = " " + t.substr(0, x-1);
            if (t == '') {
                y--;
                t = file[y];
                if (t == undefined) continue;
                x = (t.length);
                continue;
            }
            var aa = re.exec(t);
            if (!aa) {
                left = 0;
                cursorx = 0;
                cursory = y - base;
                return true;
            } else {
                x = _rel(re,t,aa).length;
                cursorx = x - left;
                cursory = y - base;
                return true;
            }
        }
        return false;
    }

    function term_search(s, top, start, bottom) {
        var re = new RegExp(s.substr(1));
        var i;
        if (s.substr(0, 1) == '/') {
            statustext='';
            re.lastIndex = cursorx+left+1;
            for (i = start; i < bottom; i++) {
                var t = (file[i]);
                if (i == start) {
                    t = t.substr(cursorx+left+1, t.length-(cursorx+left+1));
                }
                aa = re.exec(t);
                if (!aa) continue;
                var tx = _rel(re,t,aa).length;
                if (i == start) {
                    tx += cursorx+left+1;
                }
                left = 0;
                base = 0;
                cursorx = tx;
                cursory = i;
                term_scrollto();
                return true;
            }
            statustext = 'search hit BOTTOM, continuing at TOP';
            for (i = top; i <= start; i++) {
                var aa = re.exec(file[i]);
                if (!aa) continue;
                left = 0;
                base = 0;
                cursorx = _rel(re,file[i],aa).length;
                cursory = i;
                term_scrollto();
                return true;
            }
            statustext = 'Pattern not found: ' + s.substr(1);
        } else {
            statustext='';
            for (i = start; i >= top; i--) {
                var t = file[i];
                if (t == undefined) continue;
                var tail = 0;
                if (i == start) {
                    tail = (cursorx+left);
                } else {
                    tail = t.length;
                }
                var right = tail;
                while (tail > 0) {
                    tail--;
                    var xj = t.substr(tail, right-tail);
                    var aa = re.exec(xj);
                    if (!aa) continue;

                    var tx = tail+_rel(re,xj,aa).length;
                    left = 0;
                    base = 0;
                    cursorx = tx;
                    cursory = i;
                    term_scrollto();
                    return true;
                }
            }
            statustext = 'search hit TOP, continuing at BOTTOM';
            for (i = bottom; i >= start; i--) {
                var t = file[i];
                if (t == undefined) continue;
                var tail = t.length;
                while (tail > 0) {
                    tail--;
                    var xj = t.substr(tail, t.length-tail);
                    var aa = re.exec(xj);
                    if (!aa) continue;

                    cursorx = tail+_rel(re,xj,aa).length;
                    cursory = i;
                    left = 0;
                    base = 0;
                    term_scrollto();
                    return true;
                }
            }
            statustext = 'Pattern not found: ' + s.substr(1);
        }
        return false;
    }
    function term_rsearch(s, top, start, bottom) {
        var cx = s.substr(0, 1);
        cx = (cx == '/') ? '?' : "/";
        return term_search(cx+s.substr(1,s.length-1), top, start, bottom);
    }

    function _pop(q) {
        var a = new Array();
        var i;
        for (i = 0; i < q.length-1; i++) {
            a[i] = q[i];
        }
        return a;
    }
    function _addr(q) {
        if (q == '.') {
            return cursory+base;
        }
        if (q == '$') {
            return file.length-1;
        }
        if (q.substr(0, 1) == "'") {
            return marks[ q.substr(1, 1) ];
        }
        if (q == "\\/" || q == "\\&") {
            var a=cursory;
            var b=base;
            term_search(lastsearch, 0, cursory+base, file.length);
            var c=cursory+base;
            cursory=a;
            base=b;
            return c;
        }
        if (q == "\\?") {
            var a=cursory;
            var b=base;
            term_rsearch(lastsearch, 0, cursory+base, file.length);
            var c=cursory+base;
            cursory=a;
            base=b;
            return c;
        }
        if (q.substr(0, 1) == "/" || q.substr(0,1) == "?") {
            var a=cursory;
            var b=base;
            term_search(q, 0, cursory+base, file.length);
            var c=cursory+base;
            cursory=a;
            base=b;
            return c;
        }
        q=parseInt(q)-1;
        if (q >= file.length-1) q=file.length-1;
        if (q < 0) q=0;
        return q;
    }
    function term_command(s) {
        var top, start,bottom;
        if (s && s.length > 0 && s.substr(0,1) == ':') {
            s = s.substr(1, s.length-1);
            top = cursory+base;
            start = top;
            bottom = top;
        } else {
            top = 0;
            start = cursory+base;
            bottom = file.length;
        }

        // okay, this is kind of tricky
        var i;
        var tok = '';
        var tc = 0;
        var ng = new Array();
        var lastre = undefined;
        var nf = false;
        /// xxx todo implement ! with nf
        for (i = 0; i < s.length; i++) {
            var c = s.substr(i, 1);
            if ((tc==0 || tc==1) && "0123456789".indexOf(c) > -1) {
                tc = 1;
                tok = ''+tok+''+c;
                continue;

            } else if (tc == 1) {
                tc = 0;
                ng[ng.length] = parseInt(tok)-1;
                tok = '';
            }

            if (c == '%') {
                top = 0;
                bottom = file.length;
                start = cursory+base;
            } else if (c == '!') {
                nf = !nf;
            } else if (c == ',') {
                // do nothing
                while (ng.length > 2) {
                    ng=_pop(ng);
                }
            } else if (c == ';') {
                start = ng[ng.length-1];
                ng = _pop(ng);
                cursory=start;
                base=0;
                ng = _pop(ng);
            } else if (c == '$') {
                ng[ng.length] = file.length;
            } else if (c == '.') {
                ng[ng.length] = cursory+base;
            } else if (c == "'") {
                // mark
                ng[ng.length] = marks[s.substr(i+1,1)];
                i++;

            } else if (c == "\\") {
                i++;
                c = s.substr(i, 1);
                var qq;
                if (c == '?') {
                    qq=term_rsearch;
                } else {
                    qq=term_search;
                }
                if (ng.length == 1) {
                    top = ng[0];
                    ng = _pop(ng);
                } else if (ng.length >= 2) {
                    top = ng[ng.length-2];
                    bottom = ng[ng.length-1];
                    ng = _pop(_pop(ng));
                }
                if (!qq(lastsearch,top,start,bottom)) {
                    return;
                }
                ng[ng.length] = cursory+base;
            } else if (c == "/" || c == "?") {
                var j = i;
                for (i++; i < s.length; i++) {
                    var tc = s.substr(i, 1);
                    if (tc == "\\") i++;
                    else if (tc == c) break;
                }
                lastre = s.substr(j, i-j);
                if (ng.length == 1) {
                    top = ng[0];
                    ng = _pop(ng);
                } else if (ng.length >= 2) {
                    top = ng[ng.length-2];
                    bottom = ng[ng.length-1];
                    ng = _pop(_pop(ng));
                }
                if (!term_search(lastre,top,start,bottom)) {
                    return;
                }
                ng[ng.length] = cursory+base;
            } else if (c == " " || c == "\t") {
                continue;
            } else {
                break;
            }
        }
        if (tc == 1) {
            ng[ng.length] = parseInt(tok)-1;
            tok = '';
            i++;
        }
        if (ng.length == 1) {
            top = ng[0];
            bottom = ng[0];
        } else if (ng.length >= 2) {
            top = ng[ng.length-2];
            bottom = ng[ng.length-1];
        }
        if (lastre != undefined) {
            lastsearch = lastre;
            registers["/"] = lastsearch.substr(1, lastsearch.length-1);
        }

        var cmd2 = s.substr(i,2);
        var cmd = s.substr(i, 1);

        if (cmd2 == 'wq' || cmd == 'x') {
            editor_disable(true);
        } else if (cmd == '=') {
            statustext = '' + bottom;
            return;
        } else if (cmd2 == 'ha') {
            window.print();
            return;
        } else if (cmd == 'w') {
            var zx = term_freeze();
            if (term._formelement) term._formelement.value=zx;
            statustext = '"/tmp/mess4XbCXM" ' + file.length + 'L, '
                    + zx.length + 'C written';
            if (onSave) {
                onSave();
            }

        } else if (!emacsen && s.substr(i,(s.length-i)) == 'emacs') {
            statustext = 'EMACS mode enabled. Press M-x vi to use vi mode';
            emacsen = true;
            mode = 1;

        } else if (emacsen && cmd2 == 'vi') {
            statustext = 'VI mode enabled. Press ESC :emacs to use EMACS mode';
            mode = 0;
            emacsen = false;

        } else if (cmd == 'e' && term._formelement) {
            var zx = term_freeze();
            if (cmd2 != 'e!') {
                if (cmd2 == 'e?') {
                    if (!confirm("Your changes will be lost\nAre you sure?")) {
                        return;
                    }
                } else if (term._formelement.value != zx) {
                    statustext = 'No write since last change (use ! to override)';
                    return;
                }
            }
            term_thaw(term._formelement.value);
        } else if (cmd == 'f') {
            var zx = term_freeze();
            statustext = '"/tmp/mess4XbCXM"';
            if (term._formelement.value != zx) {
                statustext += ' [Modified]';
            }
            statustext += ' line ' + (cursory+base+1) + ' of '
                + file.length + ' col ' + (cursorx+left+1);

        } else if (cmd == 'h' || s.substr(i,5) == 'about') {
            statustext = "jsvi \xa9 2006 Internet Connection, Inc; 2013 Jakub Jankiewicz";

        } else if (s.substr(i,4) == 'kwak') {
            term.style.backgroundImage = 'url(ducky.jpg)';
            statustext = 'kwak kwak kwak...';
        } else if (s.substr(i,3) == 'moo') {
            statustext = 'This editor does not have Super Cow Powers';

        } else if (cmd == 'b') {
            // only one buffer

        } else if (cmd == 'n' || cmd == 'N') {
            statustext = 'There is only one file to edit';

        } else if (cmd == 'q') {
            var zx = term_freeze();
            if (cmd2 != 'q!') {
                if (term._formelement.value != zx) {
                    if (cmd2 == 'q?') {
                        if (confirm("Your changes will be lost\nAre you sure?")) {
                            editor_disable(false);
                            return;
                        } else {
                            return;
                        }
                    }
                    statustext = 'No write since last change (use ! to override)';
                    return;
                }
            }
            editor_disable(false);
            if (onExit) {
                onExit();
            }
        } else if (cmd == 'd') {
            // delete lines
            yank_buffer = term_delete(top);
            while (top < bottom) {
                yank_buffer += term_delete(top);
                bottom--;
            }
            if (lastreg != '_') {
                registers[lastreg] = yank_buffer;
                term_roll_yank();
            }
            term_scrollto();
        } else if (cmd == 'u') {
            var z = term_freeze();
            term_thaw(undoset);
            undoset = z;

        } else if (cmd == 'y') {
            yank_buffer = '';
            for (i = top; i < bottom; i++) {
                yank_buffer += (file[i])+"\n";
            }
            registers[lastreg] = yank_buffer;
            term_roll_yank();

        } else if (cmd == 'F') {
            // styling!
            var y;
            var tadd = 0;
            var tsub = 0;
            var tset = undefined;
            var otc = tagstyle;
            var tg = '=';
            for (y = i+1; y < s.length; y++) {
                var cy = s.substr(y, 1);
                if (cy == '=' || cy == '+' || cy == '-' || cy == '!') {
                    tg = cy;
                } else {
                    var fl = 0;
                    if (cy == 'b') {
                        fl = 1;
                    } else if (cy == 'i') {
                        fl = 16;
                    } else if (cy == 'u') {
                        fl = 2;
                    } else if (cy == 'o') {
                        fl = 4;
                    } else {
                        statustext = 'Unrecognized formatting specifier: ' + cy;
                        return;
                    }
                    if (tg == '!') {
                        if (tset != undefined) tagstyle = tset;
                        tagstyle = tagstyle ^ fl;
                    } else if (tg == '=') {
                        if (tset == undefined) tset = 0;
                        tset = tset + fl;
                    } else if (tg == '+') {
                        tadd |= fl;
                    } else if (tg == '-') {
                        tsub |= fl;
                    }
                }
            }
            if (tset == undefined) {
                tagstyle = ((tagstyle | tadd) | tsub) ^ tsub;
            } else {
                tagstyle = tset;
            }
            // okay, we've set tagstyle
            if (i != 0) {
                // if this happened, then we were given a range(!)
                for (y = top; y <= bottom; y++) {
                    if (file[y] == undefined) continue;
                    tags[y] = _mxs(file[y].length, tagstyle);
                }
                tagstyle = otc;

            } else if (vselm) {
                term_select();
                term_vi_unset('d');
                term_vi_unset('y');
                term_vi_unset('c');
                term_vi_set('F');
                term_operate();
                tagstyle = otc;
            }


        } else if (cmd == 'g' || cmd == 'v') {
            // okay then
            var y;
            var ng = s.substr(i+1,(s.length-i)-1);
            if (cmd == 'v') ng = '!' + ng;
            for (y = 0; y < file.length; y++) {
                base = 0;
                cursory = y;
                term_command(ng);
            }

        } else if (cmd == 't' || cmd2 == 'co') {
            // copy- need address
            var t = s.substr(i, s.length-i).replace(/^[a-z]*[ ]*/);
            var x;
            yank_buffer = "";
            for (x = top; x <= bottom; x++) {
                if (file[x] != undefined) {
                    yank_buffer += (file[x]) + "\n";
                }
            }
            var a = cursory;
            var b = base;
            base = 0;
            cursorx = 0;
            left = 0;
            cursory = _addr(t);
            if (cursory < 0) cursory = 0;
            term_paste(false, yank_buffer);
            cursory = a;
            base = b;

        } else if (cmd == 'm') {
            // move- need address
            i++;
            if (s.substr(i, 3) == 'ove') {
                i += 3;
            }
            var t = s.substr(i, s.length-i);
            yank_buffer = term_delete(top);
            while (top < bottom) {
                yank_buffer += term_delete(top);
                bottom--;
            }
            var a = cursory;
            var b = base;
            base = 0;
            cursorx = 0;
            left = 0;
            cursory = _addr(t);
            if (cursory < 0) cursory = 0;
            term_paste(false, yank_buffer);
            cursory = a;
            base = b;

        } else if (cmd == 's') {
            // substitute
            i++;
            // extract regex
            var q = s.substr(i,1);
            while (q == ' ') {
                i++;
                q = s.substr(i,1);
            }
            var sep = s.substr(i,1);
            i++;

            var lr, ls, lf;
            if (sep == '') {
                if (!lastsearch || !lastsubst) {
                    statustext = 'No previous substitute regular expression';
                    return;
                }
                lr = lastsearch.substr(1, lastsearch.length-1);
                ls = lastsubst;
                lf = lastflags;
            } else {
                var jj = i;
                var zj;
                for (; i < s.length; i++) {
                    zj = s.substr(i,1);
                    if (zj == "\\") {
                        i++;
                    } else if (zj == sep) {
                        break;
                    }
                }
                lastsearch = "/" + s.substr(jj, i-jj);
                registers["/"] = lastsearch.substr(1, lastsearch.length-1);
                i++; // sep
                jj=i;
                for (; i < s.length; i++) {
                    zj = s.substr(i,1);
                    if (zj == "\\") {
                        i++;
                    } else if (zj == sep) {
                        break;
                    }
                }
                lastsubst = s.substr(jj, i-jj);
                lastflags = '';
                i++;
                var count = -1;
                for (; i < s.length; i++) {
                    zj = s.substr(i,1);
                    if (zj == 'i' || zj == 'g') {
                        lastflags += zj;
                    } else {
                        count = parseInt(s.substr(i,s.length-i));
                        if (count > 0) {
                            break;
                        } else {
                            statustext = "Trailing characters";
                            return;
                        }
                    }
                }
                var re = new RegExp;
                re.compile(lastsearch.substr(1, lastsearch.length-1),
                        (lastflags.indexOf('i') > -1) ? 'i' : '');
                var hit = false;
                for (i = top; i < bottom; i++) {
                    var t = file[i];
                    var g = tags[i];
                    var aa;
                    var st = t;
                    aa = re.exec(t);
                    if (!aa || aa.length == 0) continue;
                    file[i] = '';
                    tags[i] = '';
                    // okay got a hit, do this vi style
                    for (;;) {
                        t = _rer(re,st,aa);
                        var lt = _rel(re,st,aa);
                        var lg = _resubst(lastsubst,aa);
                        file[i] += lt + lg;
                        tags[i] += g.substr(0, lt.length) + _zeros(lg.length);

                        if (lastflags.indexOf('g') > -1) {
                            st = t;
                            aa = re.exec(t);
                            if (aa && aa.length > 0) continue;
                        }
                        file[i] += t;
                        tags[i] += g.substr(g.length - t.length, t.length);
                        break;
                    }
                    hit = true;
                    if (count > -1) {
                        count--;
                        if (count == 0) break;
                    }
                }
                if (!hit) {
                    statustext = 'Pattern not found: ' + lastsearch.substr(1, lastsearch.length-1);
                }
            }

        } else if (cmd == '' && ng.length > 0) {
            base = 0;
            cursory = top;
        } else {
            statustext = "Not an editor command: " + s.substr(i,s.length-i);
        }

    }
    function _resubst(s, aa) {
        var i;
        var out = '';
        for (i = 0; i < s.length; i++) {
            var zq = s.substr(i, 1);
            if (zq == "\\") {
                zq = s.substr(i, 2);
                if (zq == "\\1") {
                    zq = aa[1];
                } else if (zq == "\\2") {
                    zq = aa[2];
                } else if (zq == "\\3") {
                    zq = aa[3];
                } else if (zq == "\\4") {
                    zq = aa[4];
                } else if (zq == "\\5") {
                    zq = aa[5];
                } else if (zq == "\\6") {
                    zq = aa[6];
                } else if (zq == "\\7") {
                    zq = aa[7];
                } else if (zq == "\\8") {
                    zq = aa[8];
                } else if (zq == "\\9") {
                    zq = aa[9];
                } else {
                    zq = s.substr(i+1, 1);
                }
                i++;
            } else if (zq == "&") {
                zq = aa[0];
            }
            out += zq;
        }
        return out;
    }
    function _calcy(zx, x, g) {
        if (zx && cursor._lasty != cursory) {
            cursor._lasty = cursory;
            var nh = 0;
            while (zx && zx != document.body) {
                nh += zx.offsetTop;
                zx = zx.offsetParent;
            }
            cursor.style.top = nh + 'px';
        }

        var z = x.substr(cursorx, 1);
        var q = g.substr(cursorx, 1).charCodeAt(0);
        if (cursorx >= x.length || z == undefined || z == "\240" || z == '')
            z = ' ';

        if (cursor._lastch != z || cursor._lastgh != q) {
            if (z == ' ') {
                z = "\240";
                q = 0;
            }
            while (cursor.firstChild)
                cursor.removeChild(cursor.firstChild);
            cursor.appendChild(document.createTextNode(z));

            cursor._lastch = z;
            cursor._lastgh = q;

            if (q & 1) {
                cursor.style.fontWeight = 'bold';
            } else {
                cursor.style.fontWeight = 'normal';
            }
            if (q & 2) {
                cursor.style.textDecoration = 'underline';
            } else {
                cursor.style.textDecoration = 'none';
            }
            if (q & 16) {
                cursor.style.fontStyle = 'italic';
            } else {
                cursor.style.fontStyle = 'normal';
            }
        }
    }
    function term_calcy() {
        // fixup character inside... burrr
        var xx = file[cursory+base];
        var xg = tags[cursory+base];
        var zleft = left;
        if (cursory == (term_rows-1)) {
            xx = command + " ";
            zleft = commandleft;
            xg = _mxs(xx.length+1,0);
        }
        var gg = term.childNodes;
        if (gg.length > cursory) {
            gg = term.childNodes[cursory];
        } else {
            gg = undefined;
        }
        _calcy(gg, xx.substr(zleft, xx.length-zleft), xg.substr(zleft, xg.length-zleft));
    }
    function term_calcx() {
        if (cursorx != cursor._lastx) {
            cursor.style.left = (cursorx * (term_cur_width)) + 'px';
            cursor._lastx = cursorx;
            term_calcy();
        }
    }
    function term_scrollto() {

        var h = term_rows;
        var w = term_cols;
        var x = cursorx+left;
        var y = cursory+base;
        var t = file[y];

        if (command == '') h--;

        var ex = parseInt((w/8));
        if (ex < 4) ex = 4;
        var ey = parseInt((h/8));
        if (ey < 4) ey = 4;

        while (t == undefined && y > 0) {
            y--;
            t = file[y];
        }
        if (t == undefined) t = '';
        if (x >= t.length) {
            if (mode) x = t.length;
            else x = t.length-1;
        }
        if (x < 0) x = 0;
        if (y < 0) y = 0;

        if (x < left) {
            left = (x - ex);
            cursorx = ex;
            if (left < 0) {
                left = 0;
                cursorx = 0;
            }
        } else if (x >= left+w) {
            left = (x - w) + ex;
            cursorx = w - ex;
        } else {
            cursorx = x - left;
        }
        if (y < base) {
            base = (y - ey);
            cursory = ey;
            if (base < 0) {
                base = 0;
                cursory = 0;
            }
        } else if (y >= base+h) {
            base = ((y - h) + ey);
            cursory = (h - ey);
        } else {
            cursory = y - base;
        }
        term_calcx();
        term_calcy();
    }

    function term_insert(y, str) {
        var z = file.length;
        file[z] = '';
        tags[z] = '';
        var i;
        for (i = z; i > y; i--) {
            file[i] = (file[i-1]);
            tags[i] = (tags[i-1]);
        }
        file[y] = '';
        tags[y] = '';
    }
    function term_paste(after, ign) {
        if (ign != undefined) {
            yank_buffer = ign;
        } else {
            registers['.'] = lastinsert;
            registers[':'] = oldcommand;
            registers['%'] = "/tmp/mess4XbCXM";
            registers['#'] = "";
            yank_buffer = registers[lastreg];
        }
        if (yank_buffer == undefined) return false;
        if (yank_buffer.indexOf("\n") > -1) {
            // insert after this line
            if (after) cursory++;
            var nq = yank_buffer.split("\n");
            var nj;
            for (nj = 0; nj < nq.length; nj++) {
                if (nj == (nq.length-1)) {
                    if (nq[nj] == undefined) break;
                    if (nq[nj] == '') break;
                    // handled specially
                    var aa = _hra(nq[nj]);
                    file[cursory+base+nj] = aa[0] + (file[cursory+base+nj]);
                    tags[cursory+base+nj] = aa[1] + (tags[cursory+base+nj]);
                    break;
                }
                term_insert(cursory+base+nj);
                var aa = _hra(nq[nj]);
                file[cursory+base+nj] = aa[0];
                tags[cursory+base+nj] = aa[1];
            }
        } else {
            var t = (file[cursory+base]);
            var g = (tags[cursory+base]);
            var aa = _hra(yank_buffer);
            if (after) cursorx++;
            file[cursory+base] = t.substr(0, cursorx+left)
                + aa[0] + t.substr(cursorx+left, t.length-(cursorx+left));
            tags[cursory+base] = g.substr(0, cursorx+left)
                + aa[1] + g.substr(cursorx+left, g.length-(cursorx+left));
        }
        return true;
    }
    function term_keyfix(e) {
        if (!e) e = window.event;

        var ch = e.keyCode;
        if (!ch) ch = e.which;

        if (e.DOM_VK_UP) {
            if (e.DOM_VK_UP == ch) ch = 57373;
            else if (e.DOM_VK_DOWN == ch) ch = 57374;
            else if (e.DOM_VK_LEFT == ch) ch = 57375;
            else if (e.DOM_VK_RIGHT == ch) ch = 57376;
        }

        if (ch == 8 || ch == 9 || ch == 37 || ch == 39
        || ch == 38 || ch == 40 || ch == 127
        || ch == 33 || ch == 34 || ch == 36
        || ch == 35 || ch == 45 || ch == 46
        || ch == 57373
        || ch == 57374
        || ch == 57375
        || ch == 57376) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            term_keypress_inner(e, true);
            e.cancelBubble=true;
            return false;
        } else {
            e.cancelBubble=false;
            return true;
        }

    }
    function term_keypress(e) {
        if (!e) e = window.event;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        if (suggest._visible) {
            suggest.style.display = 'none';
            suggest._visible = false;
        }
        e.cancelBubble=true;
        term_keypress_inner(e, false);
        return false;
    }

    function term_keyup(e) {
        if (fakemode || mode === 0) {
            vselm = 0;
            statustext = '';
            mode = 0;
        } else {
            if (e.keyCode == 27) { // escape
                vselm = 0;
                statustext = '';
                if (command != '') {
                    cursorx = savex;
                    cursory = savey;
                } else {
                    if (accum > 1) {
                        var i, j;
                        j = lastreg;
                        lastreg = '.';
                        for (i = 1; i < accum; i++) {
                            term_paste(false);
                        }
                        lastreg = j;
                        accum = 0;
                    }
                    cursorx--;
                    term_scrollto();
                }
                mode = emacsen ? 1 : 0;
                command = '';
                commandleft = 0;
            }
        }
        term_redraw();
        _update_backing();
    }

    function term_keypress_inner(e, synth) {
        var k = e.which;
        var kc;
        if (e.charCode) {
            if (e.charCode == 27 || e.charCode == 13 || e.charCode == 10
                    || e.charCode == 8
                    || e.charCode == 9) {
                k = e.charCode;
                kc = String.fromCharCode(e.charCode);
            } else if (e.charCode == 63232) {
                k = 57373;
            } else if (e.charCode == 63233) {
                k = 57374;
            } else if (e.charCode == 63234) {
                k = 57375;
            } else if (e.charCode == 63235) {
                k = 57376;
            } else {
                if (e.charCode == 191) return; // wtf?
                kc = String.fromCharCode(e.charCode);
                k = 0;
            }
        } else if (e.keyCode) {
            k = e.keyCode;
            if (e.DOM_VK_UP) {
                if (e.DOM_VK_UP == k) k = 57373;
                else if (e.DOM_VK_DOWN == k) k = 57374;
                else if (e.DOM_VK_LEFT == k) k = 57375;
                else if (e.DOM_VK_RIGHT == k) k = 57376;
            } else {
                kc = String.fromCharCode(e.keyCode);
            }
            if (k == 191) return; // unicode i think
        } else {
            if (!k || k == 191) return;
            kc = String.fromCharCode(k);
            var i;
        }
        var mod;
        if (e.modifiers) mod = e.modifiers; else mod = 0;
        var ctrl = e.ctrlKey | (mod & 2);
        var shift = e.shiftKey | (mod & 4);
        var meta = e.altKey | e.metaKey | (mod & 1);
        var lk = lastkey;
        lastkey = kc;

        if (kc == undefined) kc = '';
        if (!emacsen && mode == 0) {
            if (kc == 'U') {
                if ((base+cursory) == undoy) {
                    var aa = _hra(undoline);
                    file[undoy] = aa[0];
                    tags[undoy] = aa[1];
                }
            } else if (kc == 'u' && undoset) {
                var z = term_freeze();
                term_thaw(undoset);
                undoset = z;
            }

            if (kc == 'u' || kc == 'U') {
                term_scrollto();
                term_redraw();
                lastkey = undefined;
                return;
            }
        }

        fakemode = false;

        // emacsen
        if (emacsen && meta && (kc == 'x' || kc == 'X')) {
            kc = ':'
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 't' || kc == 'T')) {
            kc = '?'
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 's' || kc == 'S')) {
            kc = '/'
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 'k' || kc == 'K')) {
            term_command(':d');
            lastkey = undefined;
            return;
        } else if (emacsen && meta && (kc == 'd' || kc == 'D')) {
            kc = 'D';
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 'a' || kc == 'A')) {
            kc = '0';
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 'd' || kc == 'D')) {
            if (emacsen) {
                kc = 'x';
            } else {
                // err...
                if (!accum) accum=term_rows+1;
                cursory += parseInt(accum/2)+2;
                accum=0;
                term_scrollto();
                term_redraw();
                lk = undefined;
                lastkey = undefined;
                return;
            }
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 'g' || kc == 'G')) {
            term_command(':f');
            lastkey = undefined;
            return;
        } else if (ctrl && (kc == 'e' || kc == 'E')) {
            if (emacsen) {
                kc = '$';
            } else {
                if (!accum) accum = 1;
                cursory += accum;
                accum = 0;
                term_scrollto();
                term_redraw();
                lk = undefined;
                lastkey = undefined;
                return;
            }
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (emacsen && meta && (kc == 'b' || kc == 'B')) {
            kc = 'b';
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (emacsen && meta && (kc == 'l' || kc == 'L')) {
            kc = 'e';
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (emacsen && meta && (kc == 'f' || kc == 'F')) {
            kc = 'w';
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 'f' || kc == 'F')) {
            if (emacsen) {
                kc = 'l';
            } else {
                // vi pagedown
                if (!accum) accum = 0;
                cursory += (term_rows*accum);
                accum = 0;
                term_scrollto();
                term_redraw();
                lk = undefined;
                lastkey = undefined;
                return;
            }
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 'y' || kc == 'Y')) {
            if (emacsen) {
                term_command(':y');
                lastkey = undefined;
                return;
            } else {
                if (!accum) accum = 1;
                cursory -= accum;
                accum = 0;
                term_scrollto();
                term_redraw();
                lk = undefined;
                lastkey = undefined;
                return;
            }
        } else if (ctrl && (kc == 'l' || kc == 'L')) {
            term_redraw();
            lk = undefined;
            lastkey = undefined;
            return;
        } else if (ctrl && (kc == 'u' || kc == 'U')) {
            if (emacsen) {
                // emacs undo
                kc = 'u';
            } else {
                // vi pageup
                if (!accum) accum=term_rows+1;
                cursory -= parseInt(accum/2)+2;
                accum=0;
                term_scrollto();
                term_redraw();
                lk = undefined;
                lastkey = undefined;
                return;
            }
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        } else if (ctrl && (kc == 'w' || kc == 'W')) {
            // vim uses this for window control; this is actually useful
            fakemode = true;
            term_vi_set('d');
            kc = 'b';
            lk = undefined;
            lastkey = undefined;

        } else if (ctrl && (kc == 'b' || kc == 'B')) {
            if (emacsen) {
                kc = 'h';
            } else {
                // vi pageup
                if (!accum) accum=1;
                cursory -= (term_rows*accum);
                accum=0;
                term_scrollto();
                term_redraw();
                lk = undefined;
                lastkey = undefined;
                return;
            }
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
        }
        if (k >= 57373 && k <= 57376 && !synth) {
            // bail
            return;
        } else if (!synth && (k < 57373 || k > 57376)) {
            // no touching...
        } else if (k == 31 || k == 40 || k == 57374) { // down
            if (!synth) return;
            fakemode = true;
            kc = 'j';
            lk = undefined;
            lastkey = undefined;
        } else if (k == 30 || k == 38 || k == 57373) { // up
            if (!synth) return;
            fakemode = true;
            kc = 'k';
            lk = undefined;
            lastkey = undefined;
        } else if (k == 28 || k == 37 || k == 57375) { // left
            if (!synth) return;
            fakemode = true;
            kc = ctrl ? 'B' : 'h';
            lk = undefined;
            lastkey = undefined;
        } else if (k == 29 || k == 39 || k == 57376) { // right
            if (!synth) return;
            fakemode = true;
            kc = ctrl ? 'W' : 'l';
            lk = undefined;
            lastkey = undefined;
        } else if (k == 33) { // pageup
            cursory -= term_rows;
            term_scrollto();
            term_redraw();
            lk = undefined;
            lastkey = undefined;
            return;
        } else if (k == 34) { // pagedown
            cursory += term_rows;
            term_scrollto();
            term_redraw();
            lk = undefined;
            lastkey = undefined;
            return;
        } else if (k == 36) { // home
            if (ctrl) {
                lk = 'g';
                kc = 'g';
            } else {
                kc = '0';
            }
            fakemode = true;
            lk = undefined;
            lastkey = undefined;
            accum = 0;
        } else if (k == 35) { // end
            fakemode = true;
            accum = 0;
            if (ctrl) {
                kc = 'G';
            } else {
                kc = '$';
            }
            lk = undefined;
            lastkey = undefined;
        } else if (k == 45) { // insert
            fakemode = true;
            if (mode == 1) {
                mode = 2;
            } else if (mode == 2) {
                mode = 1;
            } else {
                term_setmode(1);
            }
            lk = undefined;
            lastkey = undefined;
            term_redraw();
            return;
        } else if (k == 46) { // delete
            fakemode = true;
            kc = 'x';
            lk = undefined;
            lastkey = undefined;
        } else if (synth && k != 8) {
            return;
        }

        term_save_undo_line();

        if (fakemode || mode == 0) {
            if (!fakemode && ctrl) return;
            if (lk == 'F' || lk == 'T' || lk == 'f' || lk == 't') {
                vi_ft_reg = kc;
                if (lk == 'F') {
                    term_ex_motion = term_vi_ff;
                } else if (lk == 'T') {
                    term_ex_motion = term_vi_tt;
                } else if (lk == 'f') {
                    term_ex_motion = term_vi_f;
                } else if (lk == 't') {
                    term_ex_motion = term_vi_t;
                }
                term_operate();
                lastkey = undefined;
                term_scrollto();
                term_redraw();
                _update_backing();
                return;
            } else if (lk == 'm') {
                // set mark
                marks[kc] = cursory+base;
                lastkey = undefined;
                accum = 0;
                return;

            } else if (lk == "'") {
                term_ex_motion = function() {
                    cursory = marks[kc];
                    base = 0;
                    term_scrollto();
                    term_redraw();
                    return true;
                };
                if (!accum) accum = 1;
                term_operate();
                return;

            } else if (lk == '"') {
                // set last register
                lastreg = kc;
                lastkey = undefined;
                accum = 0;
                return;

            } else if (lk == 'r') {
                var p = cursorx + left;
                var t = (file[cursory+base]);
                if (!accum) accum = 1;
                var ng = '';
                var i;
                for (i = 0; i < accum; i++) ng += kc;
                term_save_undo();
                file[cursory+base] = (t.substr(0, p))
                    + (ng) + (t.substr(p+accum, t.length-(p+accum)));
                // tags remains unchanged (same length)
                accum = 0;
                lastkey = undefined;
                term_scrollto();
                term_redraw();
                _update_backing();
                return;
            }
            if (kc == ':' || kc == '/' || kc == '?') {
                command = kc;
                commandleft = 0;
                savex = cursorx;
                savey = cursory;
                cursorx = 1;
                cursory = term_rows-1;
                mode=1;
                term_redraw();
                term_calcx();
                return;
            } else if (kc == "'") {
                // jump to mark (ick)
            } else if (kc == '"') {
                // do nothing for now

            } else if (kc == '.') {
                term_vi_set(lastcommand);
                term_ex_motion = lastmotion;
                term_operate();

            } else if (kc == '$') {
                term_ex_motion = term_vi_eol;
                term_operate();

            } else if (kc == '%') {
                if (accum <= 0) {
                    term_ex_motion = term_vi_bounce;
                    term_operate();
                } else if (file.length > 0) {
                    base = 0;
                    cursorx = 0;
                    left = 0;
                    cursory = parseInt(accum * (term_rows / (file.length+1.0)));
                    accum = 0;
                }

            } else if (kc == '0') {
                if (accum) {
                    accum *= 10;
                } else {
                    cursorx = 0;
                    left = 0;
                }
            } else if (kc == '1') {
                accum *= 10; accum++;
            } else if (kc == '2') {
                accum *= 10; accum += 2;
            } else if (kc == '3') {
                accum *= 10; accum += 3;
            } else if (kc == '4') {
                accum *= 10; accum += 4;
            } else if (kc == '5') {
                accum *= 10; accum += 5;
            } else if (kc == '6') {
                accum *= 10; accum += 6;
            } else if (kc == '7') {
                accum *= 10; accum += 7;
            } else if (kc == '8') {
                accum *= 10; accum += 8;
            } else if (kc == '9') {
                accum *= 10; accum += 9;
            } else if (kc == 'A') {
                var t = (file[cursory+base]);
                cursorx = t.length; // will be fixed up...
                term_setmode(1);
                term_save_undo();
            } else if (kc == 'a') {
                term_setmode(1);
                cursorx++;
                term_save_undo();
            } else if (kc == 'B') {
                term_ex_motion = term_vi_bb;
                term_operate();
            } else if (kc == 'b') {
                term_ex_motion = term_vi_b;
                term_operate();
            } else if (kc == 'c') {
                if (term_vi_flag('c')) {
                    term_vi_set('d');
                    term_vi_unset('c');
                    savex = cursorx+left;
                    savey = cursory+base;
                    cursorx = 0; left = 0;
                    term_ex_motion = term_vi_line;
                    term_operate();
                    cursorx = savex-left;
                    cursory = savey-base;
                    term_setmode(1);
                } else {
                    term_vi_set('c');
                }
            } else if (kc == 'C') {
                term_ex_motion = term_vi_eol;
                term_vi_set('d');
                term_operate();
                term_setmode(1);
            } else if (kc == 'D') {
                term_ex_motion = term_vi_eol;
                term_vi_set('d');
                term_operate();
            } else if (kc == 'd') {
                if (vselm) {
                    term_vi_set('d');
                    term_vi_unset('y');
                    term_select();
                    term_operate();
                    vselm = 0;
                } else if (term_vi_flag('d')) {
                    accum++;
                    savex = cursorx+left;
                    savey = cursory+base;
                    cursorx = 0; left = 0;
                    term_ex_motion = term_vi_line;
                    term_operate();
                    cursorx = savex-left;
                    cursory = savey-base;
                } else {
                    term_vi_set('d');
                    term_vi_unset('y');
                }
            } else if (kc == '>' || kc == '<') {
                if (vselm) {
                    term_vi_unset('<');
                    term_vi_unset('>');
                    term_vi_set(kc);
                    term_vi_unset('d');
                    term_vi_unset('y');
                    term_operate();
                    vselm = 0;
                } else if (term_vi_flag(kc)) {
                    accum++;
                    savex = cursorx+left;
                    savey = cursory+base;
                    cursorx = 0; left = 0;
                    term_ex_motion = term_vi_line;
                    term_operate();
                    cursorx = savex-left;
                    cursory = savey-base;
                    term_vi_unset('<');
                    term_vi_unset('>');
                } else {
                    term_vi_unset('<');
                    term_vi_unset('>');
                    term_vi_set(kc);
                    term_vi_unset('d');
                    term_vi_unset('y');
                }

            } else if (kc == 'E') {
                term_ex_motion = term_vi_ee;
                term_operate();
            } else if (kc == 'e') {
                term_ex_motion = term_vi_e;
                term_operate();

            } else if (kc == 'F' || kc == 'f') {
                // does nothing here
            } else if (kc == 'G') {
                term_ex_motion = term_vi_eof;
                term_operate();

            } else if (kc == 'g' && lk == 'g') {
                term_ex_motion = term_vi_top;
                term_operate();

            } else if (kc == 'H') {
                term_ex_motion = term_vi_hh;
                term_operate();

            } else if (kc == 'h') {
                term_ex_motion = term_vi_h;
                term_operate();

            } else if (kc == 'I') {
                term_save_undo();
                if (vselm) {
                    term_vi_set('d');
                    term_vi_unset('y');
                    term_select();
                    term_operate();
                    vselm = 0;
                }
                term_setmode(1);
                cursorx = 0;
                left = 0;
            } else if (kc == 'i') {
                term_save_undo();
                if (vselm) {
                    term_vi_set('d');
                    term_vi_unset('y');
                    term_select();
                    term_operate();
                    vselm = 0;
                }
                term_setmode(1);
            } else if (kc == 'J') {
                term_save_undo();
                term_justify();
            } else if (kc == 'j') {
                term_ex_motion = term_vi_j;
                term_operate();
            } else if (kc == 'K') {
                // err..
            } else if (kc == 'k') {
                term_ex_motion = term_vi_k;
                term_operate();
            } else if (kc == 'L') {
                term_ex_motion = term_vi_ll;
                term_operate();
            } else if (kc == 'l') {
                term_ex_motion = term_vi_l;
                term_operate();
            } else if (kc == 'M') {
                term_ex_motion = term_vi_mm;
                term_operate();
            } else if (kc == 'm') {
                // set mark
            } else if (kc == 'N') {
                if (lastsearch == '') {
                    statustext = 'No previous regular expression';
                } else {
                    if (!accum) accum = 1;
                    var sl = lastsearch;
                    var cx = lastsearch.substr(0, 1);
                    cx = (cx == '?') ? '/' : '?';
                    var i;
                    for (i = 0; i < accum; i++) {
                        term_command(cx+(sl.substr(1, sl.length-1)));
                    }
                    lastsearch = sl;
                    accum = 0;
                }
            } else if (kc == 'n') {
                if (lastsearch == '') {
                    statustext = 'No previous regular expression';
                } else {
                    if (!accum) accum = 1;
                    var i;
                    for (i = 0; i < accum; i++)
                        term_command(lastsearch);
                    accum = 0;
                }
            } else if (kc == 'O') {
                cursorx = 0;
                left = 0;
                term_insert(cursory+base);
                term_setmode(1);
            } else if (kc == 'o') {
                cursory++;
                cursorx = 0;
                left = 0;
                term_insert(cursory+base);
                term_setmode(1);
                term_save_undo();
            } else if (kc == 'P' || kc == 'p') {
                term_save_undo();
                term_paste(kc == 'P' ? false : true);
                accum = 0;

            } else if (kc == 'R') {
                term_save_undo();
                if (vselm) {
                    term_vi_set('d');
                    term_vi_unset('y');
                    term_select();
                    term_operate();
                    vselm = 0;
                }
                term_setmode(2);

            } else if (kc == 'S') {
                term_vi_set('d');
                term_vi_unset('c');
                savex = cursorx+left;
                savey = cursory+base;
                cursorx = 0; left = 0;
                term_ex_motion = term_vi_line;
                term_operate();
                cursorx = savex-left;
                cursory = savey-base;
                term_setmode(1);

            } else if (kc == 's') {
                term_vi_set('d');
                term_vi_unset('c');
                savex = cursorx+left;
                savey = cursory+base;
                term_ex_motion = term_vi_l;
                term_operate();
                cursorx = savex-left;
                cursory = savey-base;
                term_setmode(1);

            } else if (kc == 'T' || kc == 't') {
                // nothing here
            } else if (kc == 'V' || kc == 'v') {
                if (vselm) {
                    vselm = 0;
                    vselx = undefined;
                    vsely = undefined;
                } else {
                    vselm = (kc == 'v') ? 1 : 2;
                    vselx = cursorx+left;
                    vsely = cursory+base;
                }

            } else if (kc == 'W') {
                term_ex_motion = term_vi_ww;
                term_operate();
            } else if (kc == '{') {
                term_ex_motion = term_vi_ob;
                term_operate();
            } else if (kc == '}') {
                term_ex_motion = term_vi_cb;
                term_operate();
            } else if (kc == 'w') {
                term_ex_motion = term_vi_w;
                term_operate();
            } else if (kc == 'x' || kc == 'X') {
                if (term_vi_set('d')) {
                    term_vi_unset('d');
                } else {
                    term_vi_set('d');
                    if (kc == 'x') {
                        term_ex_motion = term_vi_l;
                    } else {
                        term_ex_motion = term_vi_h;
                    }
                    term_operate();
                }
            } else if (kc == 'y') {
                if (vselm) {
                    term_vi_set('y');
                    term_vi_unset('d');
                    term_select();
                    term_operate();
                    vselm = 0;
                } else if (term_vi_flag('y')) {
                    accum++;
                    savex = cursorx+left;
                    savey = cursory+base;
                    cursorx = 0; left = 0;
                    term_ex_motion = term_vi_line;
                    term_operate();
                    cursorx = savex-left;
                    cursory = savey-base;
                } else {
                    term_vi_set('y');
                    term_vi_unset('d');
                }
            } else if (kc ==  'Z' && lk == 'Z') {
                editor_disable(true);
                accum = 0;
            } else if (k == 27 || (k == 91 && ctrl)) { // escape or ^[
                vselm = 0;
                statustext = '';
                mode = 0;
            } else {
                accum = 0;
            }
            term_scrollto();
        } else if ((k == 27 || (k == 91 && ctrl))) { // escape or ^[

            vselm = 0;
            statustext = '';
            if (command != '') {
                cursorx = savex;
                cursory = savey;
            } else {
                if (accum > 1) {
                    var i, j;
                    j = lastreg;
                    lastreg = '.';
                    for (i = 1; i < accum; i++) {
                        term_paste(false);
                    }
                    lastreg = j;
                    accum = 0;
                }
                cursorx--;
                term_scrollto();
            }
            mode = emacsen ? 1 : 0;
            command = '';
            commandleft = 0;
        } else if (command != '') {
            if (k == 10 || k == 13) {
                // cr and execute command
                cursorx = savex;
                cursory = savey;
                if (emacsen) {
                    mode = 1;
                } else {
                    mode = 0;
                }
                var cy = command;

                command = '';
                commandleft = 0;

                term_command(cy);
                var cx = command.substr(0,1);
                if (cx == '/' || cx == '?') lastsearch = cy;
                else oldcommand = cy;
                // incase its needed
                term_scrollto();
            } else if (k == 8) {
                if (!synth) return;
                command = command.substr(command, command.length-1);
                cursorx--;
                if (cursorx <= 0) {
                    var w = term_cols;
                    commandleft -= (w-16);
                    cursorx = w - 8;
                    if (commandleft < 0) {
                        cursorx = savex;
                        cursory = savey;
                        if (emacsen) {
                            mode = 1;
                        } else {
                            mode = 0;
                        }
                    }
                }
            } else {
                command = command + kc;
                cursorx++;
                var w = term_cols;
                if (cursorx >= (w-8)) {
                    cursorx = 8;
                    commandleft += w-16;
                }
            }
            term_redraw();
            term_calcx();
            _update_backing();
            return;
        } else {
            var t = (file[cursory+base]);
            var lx = (t.substr(0, cursorx+left));
            var ly = (t.substr(cursorx+left+(mode-1)));
            var lz = (t.substr(cursorx+left));
            var g = (tags[cursory+base]);
            var gx = (g.substr(0, cursorx+left));
            var gy = (g.substr(cursorx+left+(mode-1)));
            var gz = (g.substr(cursorx+left));
            if (!lx) lx = '';
            if (k == 9) kc = '        ';
            if (k == 10 || k == 13) {
                // CR
                if (!lz) lz = '';
                file[cursory+base] = lx;
                tags[cursory+base] = gx;
                cursory++;
                cursorx=0;
                left=0;
                term_insert(cursory+base);
                file[cursory+base] = lz;
                tags[cursory+base] = gz;
                lastinsert += "\n";
            } else if (k == 8) {
                if (!synth) return;
                // backspace
                file[cursory+base] = lx.substr(0,lx.length-1)+lz;
                tags[cursory+base] = gx.substr(0,lx.length-1)+gz;
                lastinsert = lastinsert.substr(0,lastinsert.length-1);
                cursorx--;
            } else {
                if (kc == '') return;
                file[cursory+base] = lx+kc+ly;
                tags[cursory+base] = gx+String.fromCharCode(tagstyle)+gy;
                lastinsert += kc;
                cursorx+=kc.length;
            }
            term_scrollto();
        }

        term_redraw();
        _update_backing();
        return;
    }

    function _redraw_cursor() {
        term_draw_cursor(true);
        _update_backing();
    }

    function term_draw_cursor(tf) {
        // maybe use vertical bar if mode==1 hrm?
        if (!tf || !cursor._opaque) {
            cursor._opaque = true;
            cursor.style.color = palette[1];
            cursor.style.backgroundColor = palette[0];
        } else {
            cursor._opaque = false;
            cursor.style.color = palette[0];
            cursor.style.backgroundColor = palette[1];
        }
    }

    function _redraw_term_force() {
        while (term.firstChild) term.removeChild(term.firstChild);
    }
    function _redraw_term() {

        var h = term_rows;
        var w = term_cols;

        var ka, kb;
        var tospell = 0;
        var osp = '';
        var y;
        var tago = new Array();
        var isurl = new Array();
        var ca, cb;
        var sa, sb;
        var qp;
        if (vselm) {
            sa = vsely-base;
            sb = cursory;
            if (sa > sb) {
                zx = sa;
                sa = sb;
                sb = zx;
            }
            ca = vselx-left;
            cb = cursorx;
            if (ca > cb) {
                zx = ca;
                ca = cb;
                cb = zx;
            }
        }
        for (y = 0; y < h; y++) {
            ka = ''; kb = '';
            var x = file[y+base];
            var g;

            var zleft = 0;
            var cx;
            var j, vj;
            if (y == (h-1)) {
                if (cursory == y) {
                    zleft = commandleft;
                    x = command;
                    cx = 0;
                    statustext = '';
                } else if (emacsen) {
                    x = '[' + (mode == 1 ? 'Ins' : 'Ovr') + '] ' + statustext;
                    while (x.length < w) {
                        x += ' ';
                    }
                    cx = 4;
                } else if (vselm == 1) {
                    cx = 1; x = '-- VISUAL --';
                    statustext = '';
                } else if (vselm == 2) {
                    cx = 1; x = '-- VISUAL LINE --';
                    statustext = '';
                } else if (mode == 0) {
                    x = statustext;
                    cx = 16;
                } else if (mode == 1) {
                    cx = 1; x = '-- INSERT --';
                    statustext = '';
                } else if (mode == 2) {
                    cx = 1; x = '-- REPLACE --';
                    statustext = '';
                }
                g = _mxs(x.length, cx);
            } else if (x == undefined) {
                x = '~';
                g = "\010";
            } else {
                zleft = left;
                g = tags[y+base];
                // do spellchecking
                var p = 0;
                vj = x.split(/[ ,;]+/);
                for (j = 0; j < vj.length; j++) {
                    var vx = vj[j];
                    var vm = _word(vx);
                    if (j != 0) p++;

                    if (vx.match(/^(https?|ftp):\/\//)) {
                        g = g.substr(0, p)
                            + _mxo(g.substr(p, vx.length), ((1+tago.length)*256))
                            + g.substr(p+vx.length);
                        isurl[tago.length] = true;
                        tago[tago.length] = vx;

                    } else if (brokenwords[vm] && !safewords[vm]) {
                        g = g.substr(0, p)
                            + _mxo(g.substr(p, vx.length), ((1+tago.length)*256))
                            + g.substr(p+vx.length);
                        isurl[tago.length] = false;
                        tago[tago.length] = vx;
                    } else {
                        if (vm.length > 3 && !_safe(vm) && !safewords[vm] && !spelling) {
                            tospell++;
                            osp += escape("c"+tospell) + "="
                                + escape(vm) + "&";
                            spellcheck[tospell] = vm;
                        }
                    }
                    p += vx.length;
                }
            }
            if (x == undefined) {
                x = '';
                g = '';
            }

            var zx;
            vx = 0;

            // truncate as necessary
            x = x.substr(zleft, x.length-zleft);
            g = g.substr(zleft, g.length-zleft);
            if (x.length >= w) {
                x = x.substr(0, w);
                g = g.substr(0, w);
            }

            if (vselm) {
                if (vselm == 1 && sa == sb && sa == y) {
                    // middle of line between ca->cb is selected
                    g = g.substr(0,ca) + _mxo(g.substr(ca,(cb-ca)+1), 4) + g.substr(cb,(g.length-cb)-1);
                } else if ((sa < y && sb > y) || (vselm == 2 && (sa <= y && sb >= y))) {
                    // entire line selected
                    g = _mxo(g, 4);
                } else if (sa < y && sb == y) {
                    // beginning of line selected (up to q)
                    // if (sb is cursory) then q = cursorx otherwise vselx
                    qp = (sb == cursory) ? cursorx : (vselx-left);
                    g = _mxo(g.substr(0, qp+1), 4) + g.substr(qp, (g.length-qp)-1);
                } else if (sa == y && sb > y) {
                    // end of line selected (beginning at q)
                    // if (sa is cursory) then q = cursorx otherwise vselx
                    qp = (sa == cursory) ? cursorx : (vselx-left);
                    g = g.substr(0, qp) + _mxo(g.substr(qp, g.length-qp), 4);
                }
            }

            vj = 0;
            g += "\377"; // terminate
            x += " ";
            x = x.replace(/ /g, "\240");

            if (term.childNodes.length > y) {
                zx = term.childNodes[y];
                if (zx._cachex == x && zx._cacheg == g) {
                    if (y == cursory) _calcy(zx, x, g);
                    continue;
                }

                // as a last ditch effort- to accelerate deletions...
                // and inserts...
                if (term.childNodes.length > (y+1)) {
                    var zy = term.childNodes[y+1];
                    if (zy._cachex == x && zy._cacheg == g) {
                        // okay then, so the NEXT line is the winner
                        // copy its nodes
                        term.removeChild(zy);
                        term.replaceChild(zy, zx);
                        if (zy.nextSibling) {
                            term.insertBefore(zx, zy.nextSibling);
                        } else {
                            term.appendChild(zx);
                        }
                        if (y == cursory) _calcy(zy, x, g);
                        continue;
                    }
                }

                // update
                while (zx.firstChild) zx.removeChild(zx.firstChild);
            } else {
                zx = document.createElement('PRE');
                zx.style.display='block';
                zx.style.fontFamily = 'monospace';
                zx.style.fontSize = '100%';
                _zmp(zx);
                zx.style.marginBottom = '1px';
            }

            cx = 255;
            var ax = zx;

            for (j = 0; j < x.length; j++) {
                var gx = g.charCodeAt(j);

                if (gx != cx) {
                    if (j != vj && ax) {
                        var t = x.substr(vj, (j-vj));
                        if (!t) t  = '';
                        ax.appendChild(document.createTextNode(t));
                        if (zx != ax) zx.appendChild(ax);
                        vj = j;
                    }

                    if (gx > 255) {
                        var wx = parseInt(gx / 256)-1;

                        ax = document.createElement('A');
                        if (isurl[wx]) {
                            ax.style.borderBottom = '1px double blue';
                            ax.href = tago[wx];
                            ax.target = '_new';
                            ax.ondblclick = _openurl;
                        } else {
                            ax.style.borderBottom = '1px dashed red';
                            ax.href = 'javascript:void(0)';
                            ax.ondblclick = _suggest;
                        }
                        ax._term = _word(tago[wx]);
                        ax._len = tago[wx].length;
                        ax._row = y+base;
                        ax._col = j+zleft;
                        ax.onclick = _subclick;
                    } else {
                        ax = document.createElement('SPAN');
                    }
                    if (gx == 255) gx = 0;
                    if (gx & 1) {
                        ax.style.fontWeight = 'bold';
                    } else {
                        ax.style.fontWeight = 'normal';
                    }
                    if (gx & 2) {
                        ax.style.textDecoration = 'underline';
                    } else {
                        ax.style.textDecoration = 'none';
                    }
                    if (gx & 4) { // reverse video
                        ax.style.color = palette[1];
                        ax.style.backgroundColor = palette[0];
                    } else {
                        ax.style.color = palette[0];
                        ax.style.backgroundColor = palette[1];
                    }
                    if (gx & 8) { // unselectable
                        ax.unselectable = true;
                        if (ax.setAttribute) ax.setAttribute('unselectable', 'on');
                        ax.style.color = palette[0];
                        ax.style.backgroundColor = palette[1];
                        ax.style.userSelect = 'none';
                        ax.style['-moz-user-select'] = 'none';
                    }
                    if (gx & 16) {
                        ax.style.fontStyle = 'italic';
                    } else {
                        ax.style.fontStyle = 'normal';
                    }
                    cx = gx;
                }
            }
            if (j != vj) {
                var t = x.substr(vj, (j-vj)-1);
                ax.appendChild(document.createTextNode(t));
                if (zx != ax) zx.appendChild(ax);
                vj = j;
            }
            ax.appendChild(document.createTextNode("\240"));
            zx._cachex = x;
            zx._cacheg = g;
            if (term.childNodes.length <= y) {
                term.appendChild(zx);
            }

            if (y == 1) {
                var qx = zx;
                var nh = 0;
                while (qx && qx != document.body) {
                    nh  += qx.offsetTop;
                    qx = qx.offsetParent;
                }
                if (nh != line_height) {
                    line_height = nh;
                    term_resize();
                }
            }

            if (y == cursory) {
                _calcy(zx, x, g);
            }

            ax = undefined; // break;
        }
        while (term.childNodes.length > h) {
            term.removeChild(term.lastChild);
        }
        zx = undefined; // break

        if (!spelling && tospell > 0 && spell_script) {
            spelling = true;
            var xh = _xhttp();
            osp=osp.substr(0,osp.length-1);
            xh.open("GET", spell_script+"?"+osp, true);
            xh.onreadystatechange = function() {
                if (xh.readyState == 4) {
                    var j;
                    var a = xh.responseText.split("\n");
                    for (j = 0; j < a.length; j++) {
                        var kp = a[j].split("=", 2);
                        var k, v;
                        if (kp.length == 2) {
                            k = kp[0];
                            v = kp[1];
                        } else if (kp.length == 1) {
                            k = kp[0];
                            v = '';
                        } else {
                            k = a[j];
                            v = '';
                        }
                        if (k.substr(0,1) != 'c') continue;
                        k = k.substr(1, k.length-1);
                        var term = spellcheck[k];
                        if (v == undefined || v == '') {
                            brokenwords[term] = true;
                            suggestions[term] = new Array();
                        } else if (v == term) {
                            safewords[term] = true;
                        } else {
                            safewords[v] = true;
                            if (!suggestions[term]) {
                                suggestions[term] = new Array();
                            }
                            suggestions[term][ suggestions[term].length ] = v;
                            brokenwords[term] = true;
                        }
                    }
                    spelling=false;
                    window.setTimeout(term_redraw,10);
                    xh = undefined; // break (deferred)
                }
            };
            xh.send(undefined);
        }
        _update_backing();
    }

    function _redraw_term_back() {
        drawiv = undefined;
        _redraw_term();
        term_draw_cursor();
    }
    function term_redraw() {
        if (drawiv) window.clearTimeout(drawiv);
        drawiv = window.setTimeout(_redraw_term_back, 10);
    }

    function term_resize() {
        var h = term.offsetHeight;
        var r = line_height;
        if (!line_height) r = cursor.offsetHeight-1; // 1 px overlap
        var nh = (h/r);
        term_rows = parseInt(nh);
        term_win_height = h;

        h = term.offsetWidth;
        r = (term_cur_width+1); // 1 px padding
        nh = (h/r);
        term_cols = parseInt(nh);
        term_win_width = h;

        term_redraw();
    }
    function editor_disable(sav) {
        if (cursoriv) {
            window.clearInterval(cursoriv);
            cursoriv = undefined;
        }

        _cbrestore();

        if (term._formelement) {
            if (sav) term._formelement.value = term_freeze();

            // disconnect
            term._formelement = undefined;
        }

        if (backing.removeEventListener) {
            backing.removeEventListener('DOMAttrModified',_backing_paste,false);
            backing.removeEventListener('Input',_backing_paste,false);
            backing.removeEventListener('input',_backing_paste,false);
        }
        backing.oninput = undefined;
        backing.onInput = undefined;

        document.body.removeChild(suggest);
        document.body.removeChild(term);
        document.body.removeChild(cursor);

        var z;
        for (z = document.body.firstChild; z; z = z.nextSibling) {
            if (z.tagName && z._flipe) z.style.display = z._orige;
        }

        // bug in firefox: can't remove this
        //document.body.removeChild(backing);
        if (backing.blur) backing.blur();
        backing.style.display = 'none';
        if (document.body.focus) document.body.focus();
        if (document.focus) document.focus();

        document.body.style.overflow = '';
    }
    function _cursor_fix() {
        term_cur_width = cursor.offsetWidth;
    }
    function _zmp(o) {
        o.style.marginTop='0px';
        o.style.marginLeft='0px';
        o.style.marginRight='0px';
        o.style.marginBottom='0px';
        o.style.paddingTop='0px';
        o.style.paddingLeft='0px';
        o.style.paddingRight='0px';
        o.style.paddingBottom='0px';
    }
    return function(textarea, options) {
        if (term && term._formelement && term._formelement != textarea) {
            editor_disable(false);
        }
        if (options) {
            if (typeof options.onSave == 'function') {
                onSave = options.onSave;
            }
            if (typeof options.onExit == 'function') {
                onExit = options.onExit;
            }
        }

        if (options && options.spell_script) {
            spell_script = options.spell_script;
        }

        // okay, find EVERYTHING inside body and display none it
        /*
        var z;
        for (z = document.body.firstChild; z; z = z.nextSibling) {
            if (z.tagName) {
                z._orige = z.style.display;
                z._flipe = true;
                z.style.display = 'none';
            }
        }
        */

        if (!term) {
            term = document.createElement('DIV');
            suggest = document.createElement('DIV');
            backing = document.createElement('TEXTAREA');
            cursor = document.createElement('DIV');
            wrapper = document.createElement('DIV');
        }

    //    if (document.documentElement) {
    //        _zmp(document.documentElement);
    //        document.documentElement.height = '100%';
    //        _zmp(document.body);
    //        document.body.height = '100%';
    //    }

        cursor.className = 'editorcursor';
        term.className = 'editor';

        suggest.style.position = 'absolute';
        suggest.style.display = 'none';

        backing.tabIndex = -1;
        backing.style.position = 'absolute';
        backing.style.bottom = '0px';
        backing.style.right = '0px';
        backing.style.width = '1px';
        backing.style.height = '1px';
        backing.style.visibility = 'hidden';
        backing.oninput = _backing_paste;
        backing.onInput = _backing_paste;
        if (backing.addEventListener) {
            backing.addEventListener('DOMAttrModified',_backing_paste,false);
            backing.addEventListener('Input',_backing_paste,false);
            backing.addEventListener('input',_backing_paste,false);
        }
        if (window.addEventListener) {
            window.addEventListener('DOMMouseScroll',_mousescroll,false);
        }
        /*
        tools.className = 'editortools';
        tools.style.position = 'absolute';
        tools.style.right = '0px';
        tools.style.bottom = '0px';
        tools.innerHTML = ''
            + '<input tabindex="-1" type="button" value="B" style="font-weight:bold;" onClick="term_command(\':F!b\');" />'
            + '<input tabindex="-1" type="button" value="I" style="font-style:italic;" onClick="term_command(\':F!i\');" />'
            + '<input tabindex="-1" type="button" value="U" style="text-decoration:underline;" onClick="term_command(\':F!u\');" />'
            + '&nbsp;'
            + '<input tabindex="-1" type="button" value="Print" onClick="term_command(\':ha\');" />'
            + '&nbsp;'
            + '<input tabindex="-1" type="button" value="Abort" onClick="term_command(\':q?\');" />'
            + '<input tabindex="-1" type="button" value="Save and Close" onClick="term_command(\':wq\');" />'
        //*/
        cursor.onclick = _pass_click;
        cursor.ondblclick = _pass_dblclick;

        document.body.appendChild(suggest);
        document.body.appendChild(term);
        // firefox bug
        if (once) document.body.appendChild(backing);
        document.body.appendChild(cursor);

        cursoriv = window.setInterval(_redraw_cursor, 300);

        term.style.position = 'absolute';
        term.style.top = '0px';
        term.style.left = '0px';
        term.style.display = 'block';
        term.style.overflow = 'hidden';
        term.style.width = '100%';
        term.style.height = '100%';
        term.style.cursor = 'default';
        term.style.fontFamily = 'monospace';
        term.style.fontSize = '100%';
        _zmp(term);
        term._formelement = textarea;
        document.body.style.overflow = 'hidden';

        _cbd('select', _cancel_ev);
        _cbd('selectstart', _cancel_ev);
        _cbd('keydown', term_keyfix);
        _cbd('keypress', term_keypress);
        if (browser.webkit) {
            _cbd('keyup', term_keyup);
        }
        _cbd('paste', _msie_paste);
        _cbd('click', _mouseclick);
        _cbd('mousedown', _mousedown);
        _cbd('mousemove', _mousemove);
        _cbd('mouseup', _mouseup);
        _cbd('mousewheel', _mousescroll);

        vselm = 0;
        vseld = false;
        vselx = undefined;
        vsely = undefined;

        textarea.blur();
        cursorx = 0;
        cursory = 0;
        cursor.style.position = 'absolute';
        cursor.style.top = 0;
        cursor.style.left = 0;
        cursor.style.fontFamily = 'monospace';
        cursor.style.fontSize = '100%';
        cursor.style.width = 'auto';
        cursor.style.cursor = 'default';
        _zmp(cursor);
        cursor.style.overflow = 'hidden';
        cursor.innerHTML = 'X';
        cursor._opaque = false;
        cursor._lasty = -1;
        cursor._lastx = -1;
        cursor._lastch = '-xyz-';
        cursor._lastgh = 0;
        palette = undefined;
        if (options && options.color && options.backgroundColor) {
            palette = new Array();
            palette[0] = options.color;
            palette[1] = options.backgroundColor;
        } else if (document.defaultView && document.defaultView.getComputedStyle) {
            palette = new Array();
            var cs = document.defaultView.getComputedStyle(term, null);
            palette[0] = cs.color;
            palette[1] = cs.backgroundColor;
        } else if (window.getComputedStyle) {
            palette = new Array();
            var cs = window.getComputedStyle(term, null);
            palette[0] = cs.color;
            palette[1] = cs.backgroundColor;
        } else if (term.currentStyle) {
            palette = new Array();
            palette[0] = term.currentStyle.color;
            palette[1] = term.currentStyle.backgroundColor;
        }

        if (emacsen) {
            mode = 1;
        } else {
            mode = 0;
        }

        once = false;

        backing._lastvalue = '';
        backing.value = '';
        backing.defaultValue = '';
        suggest._visible = false;
        suggest.display = 'none';

        // degrading...
        file = new Array();
        tags = new Array();
        var lines = textarea.value.split("\n");
        var j;
        for (j = 0; j < lines.length; j++) {
            if (lines[j].substr(lines[j].length-1, 1) == "\r") {
                lines[j] = lines[j].substr(0, lines[j].length-1);
            }
            var aa = _hra(lines[j]);
            file[j] = aa[0];
            tags[j] = aa[1];
        }
        // fix
        textarea.value = term_freeze();

        cursor.style.display = 'inline';
        _cursor_fix();
        window.setTimeout(term_redraw,1);
        term_resize();

        _cbw('resize', term_resize);
        _update_backing();

        // public API
        return {
            freeze: term_freeze,
            thaw: term_thaw,
            setmode: term_setmode,
            roll_yank: term_roll_yank,
            justify: term_justify,
            vi_bb: term_vi_bb,
            vi_b: term_vi_b,
            vi_tt: term_vi_tt,
            vi_t: term_vi_t,
            vi_ff: term_vi_ff,
            vi_f: term_vi_f,
            vi_eof: term_vi_eof,
            vi_top: term_vi_top,
            vi_h: term_vi_h,
            vi_j: term_vi_j,
            vi_k: term_vi_k,
            vi_l: term_vi_l,
            vi_ll: term_vi_ll,
            vi_mm: term_vi_mm,
            vi_hh: term_vi_hh,
            vi_ob: term_vi_ob,
            vi_cb: term_vi_cb,
            vi_ww: term_vi_ww,
            vi_w: term_vi_w,
            vi_flag: term_vi_flag,
            vi_unset: term_vi_unset,
            vi_set: term_vi_set,
            vi_bounce: term_vi_bounce,
            vi_eol: term_vi_eol,
            vi_line: term_vi_line,
            vi_ee: term_vi_ee,
            vi_e: term_vi_e,
            vi_v: term_vi_v,
            vi_vv: term_vi_vv,
            select: term_select,
            indent: term_indent,
            unindent: term_unindent,
            operate: term_operate,
            save_undo_line: term_save_undo_line,
            save_undo: term_save_undo,
            'delete': term_delete,
            skipreverse2: term_skipreverse2,
            skipforward: term_skipforward,
            skipbackward: term_skipbackward,
            search: term_search,
            rsearch: term_rsearch,
            command: term_command,
            calcy: term_calcy,
            calcx: term_calcx,
            scrollto: term_scrollto,
            insert: term_insert,
            paste: term_paste,
            keyfix: term_keyfix,
            keypress: term_keypress,
            keypress_inner: term_keypress_inner,
            draw_cursor: term_draw_cursor,
            redraw: term_redraw,
            resize: term_resize,
            disable: editor_disable
        };
    };

})();

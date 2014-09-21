(function ($) {

    $.extend({
        stringify: function stringify(obj) {
            if ("JSON" in window) {
                return JSON.stringify(obj);
            }

            var t = typeof (obj);
            if (t != "object" || obj === null) {
                // simple data type
                if (t == "string") obj = '"' + obj + '"';

                return String(obj);
            } else {
                // recurse array or object
                var n, v, json = [], arr = (obj && obj.constructor == Array);

                for (n in obj) {
                    v = obj[n];
                    t = typeof (v);
                    if (obj.hasOwnProperty(n)) {
                        if (t == "string") {
                            v = '"' + v + '"';
                        } else if (t == "object" && v !== null) {
                            v = jQuery.stringify(v);
                        }

                        json.push((arr ? "" : '"' + n + '":') + String(v));
                    }
                }

                return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
            }
        }
    });

    //this is a fake event object, will stay with us all along, don't break it
    var event = {
        //no need for real data, what data would you expect from a programatic trigger
        pageX: 0,
        pageY: 0,
        which: 0,
        button: 0,
        metaKey: false,
        ctrlKey: false,
        charCode: ' ',
        keyCode: 0,
        //no need for real functions
        preventDefault: function () { },
        stopPropagation: function () { }
    };

    $.fn.fastTrigger = function (type, args) {
        var e = event,
			ns, any = true; //any is the same as "not-exclusive"

        if (!args || !args.length)//what if args is a string ? args CAN'T be a string (docs.jquery.com).
            args = null; //args must be an array, or nothing
        else if (args[0].preventDefault)
            e = args[0];
        else
            args.unshift(e);

        if (type.indexOf('!') != -1) {
            any = false; //exclusive
            type = type.slice(0, -1);
        }

        ns = type.split('.');
        e.type = type = ns[0]; //ensure the right type
        any &= !(ns = ns[1]); //cache this value, no need to check all each time

        return this.each(function () {
            var 
				handlers = ($.data(this, 'events') || {})[type], //don't do 2 $.data like jQuery, they are slow
				handler;

            if (handlers) {
                e.target = e.relatedTarget = this;
                for (var i in handlers) {
                    handler = handlers[i];
                    if (any || handler.type == ns) {
                        e.data = handler.data;
                        if (args)//call is slightly faster, thus preferred
                            handler.apply(this, args);
                        else
                            handler.call(this, e);
                    }
                }
            }
        });
    };

    $.fastTrigger = function (type, args) {
        //the native method is not THAT faster, but still better
        $(document.getElementsByTagName('*')).add([window, document]).fastTrigger(type, args);
    };


    var xEffects = {

        hover: function (classname) {
            return this.hover(function () {
                $(this).addClass(classname);
            }, function () {
                $(this).removeClass(classname);
            });
        },
        fader: {

            durationTime: 800,
            transitionInterval: 85,

            fade: function (element, startRGB, endRGB) {
                this.nextTransition(element, this.rgbToPercents(startRGB),
                        this.rgbToPercents(endRGB), 0);
            },

            nextTransition: function (element, startColor, endColor, timeSoFar) {
                var proportionSoFar = timeSoFar / this.durationTime;
                var currentColor = "rgb(";
                for (component = 0; component < 3; component++) {
                    var currentComponent = Math.round(startColor[component] + proportionSoFar * (endColor[component] - startColor[component]));
                    currentColor += currentComponent + "%" + (component < 2 ? "," : ")");
                }
                element.style.backgroundColor = currentColor;
                timeSoFar += this.transitionInterval;
                if (timeSoFar >= this.durationTime) {
                    this.durationTime + "\n";
                    element.style.backgroundColor = "rgb(" + endColor[0] + "%," + endColor[1] + "%," + endColor[2] + "%)";
                    return;
                }
                var nextCall = function () {
                    fader.nextTransition(element, startColor, endColor, timeSoFar);
                }
                setTimeout(nextCall, this.transitionInterval);
            },

            rgbToPercents: function (rgb) {
                if (rgb.substring(0, 1) == "#") {
                    rgb = rgb.substring(1, rgb.length);
                }
                var percentArray = new Array(3);
                count = 0;
                for (component = 0; component < 3; component++) {
                    rgbComponent = rgb.substring(component * 2, (component * 2) + 2);
                    percentArray[component] = Math.round(100 * (parseInt("0x" + rgbComponent) / 255));
                }
                return percentArray;
            }

        },

        glittarize: function ($dv, $source, $destination, $duration) {

            try {
                var average = parseInt(parseInt($duration) / 2);

                $dv.animate({ backgroundColor: $source }, 0);

                //  $dv.animate({ opacity: 0.8 }, average);

                $dv.animate({ backgroundColor: $destination }, average);
                //$dv.animate({ opacity: 1 }, average);
            } catch (ex) {


            }
        }



    };




    /**
    * Check whether the browser supports RGBA color mode.
    *
    * Author Mehdi Kabab <http://pioupioum.fr>
    * @return {boolean} True if the browser support RGBA. False otherwise.
    */
    function isRGBACapable() {
        var $script = $('script:first'),
				color = $script.css('color'),
				result = false;
        if (/^rgba/.test(color)) {
            result = true;
        } else {
            try {
                result = (color != $script.css('color', 'rgba(0, 0, 0, 0.5)').css('color'));
                $script.css('color', color);
            } catch (e) {
            }
        }

        return result;
    }

    $.extend(true, $, {
        support: {
            'rgba': isRGBACapable()
        }
    });

    var properties = ['color', 'backgroundColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'outlineColor'];
    $.each(properties, function (i, property) {
        $.fx.step[property] = function (fx) {
            if (!fx.init) {
                fx.begin = parseColor($(fx.elem).css(property));
                fx.end = parseColor(fx.end);
                fx.init = true;
            }

            fx.elem.style[property] = calculateColor(fx.begin, fx.end, fx.pos);
        }
    });

    // borderColor doesn't fit in standard fx.step above.
    $.fx.step.borderColor = function (fx) {
        if (!fx.init) {
            fx.end = parseColor(fx.end);
        }
        var borders = properties.slice(2, 6); // All four border properties
        $.each(borders, function (i, property) {
            if (!fx.init) {
                fx[property] = { begin: parseColor($(fx.elem).css(property)) };
            }

            fx.elem.style[property] = calculateColor(fx[property].begin, fx.end, fx.pos);
        });
        fx.init = true;
    }

    // Calculate an in-between color. Returns "#aabbcc"-like string.
    function calculateColor(begin, end, pos) {
        var color = 'rgb' + ($.support['rgba'] ? 'a' : '') + '('
				+ parseInt((begin[0] + pos * (end[0] - begin[0])), 10) + ','
				+ parseInt((begin[1] + pos * (end[1] - begin[1])), 10) + ','
				+ parseInt((begin[2] + pos * (end[2] - begin[2])), 10);
        if ($.support['rgba']) {
            color += ',' + (begin && end ? parseFloat(begin[3] + pos * (end[3] - begin[3])) : 1);
        }
        color += ')';
        return color;
    }

    // Parse an CSS-syntax color. Outputs an array [r, g, b]
    function parseColor(color) {
        var match, triplet;

        // Match #aabbcc
        if (match = /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/.exec(color)) {
            triplet = [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16), 1];

            // Match #abc
        } else if (match = /#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/.exec(color)) {
            triplet = [parseInt(match[1], 16) * 17, parseInt(match[2], 16) * 17, parseInt(match[3], 16) * 17, 1];

            // Match rgb(n, n, n)
        } else if (match = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)) {
            triplet = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), 1];

        } else if (match = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9\.]*)\s*\)/.exec(color)) {
            triplet = [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), parseFloat(match[4])];

            // No browser returns rgb(n%, n%, n%), so little reason to support this format.
        }
        return triplet;
    }

    //    $.fn.example = function (options, onCallBack) {

    //        var settings = $.extend({
    //            'start': 'please wait...',
    //            'value': 'done',
    //            'hideDuration': '1000',
    //            'showDuration': '0'
    //        }, options);


    //        return this.each(function () {

    //            var $this = $(this);

    //        });

    //    }


    $.fn.xNotify = function (options, onCallBack) {

        var settings = $.extend({
            'start': 'please wait...',
            'value': 'done',
            'hideDuration': '1000',
            'showDuration': '0'
        }, options);


        return this.each(function () {

            var $this = $(this);


            var s = $(this).find('span').html();


            if (!s && s != 'undefined') {

                s = $("<span class='spanStatus'></span>").appendTo($this);
            }
            else {
                try {

                    s = $(this).find('span');
                    s.html('');
                } catch (ex) { alert(ex); }
            }



            s.html(settings.start).css('display', 'inline').fadeOut(parseInt(settings.hideDuration), function () {
                s.html(settings.value).fadeIn(parseInt(settings.showDuration), function () {
                    if (typeof onCallBack == 'function')
                        onCallBack();
                });
            });


        });


    }



    $.fn.tooltipText = function (options, onCallBack) {
        var settings = $.extend({
            'value': 'http://www.domain.com'
        }, options);

        return this.each(function () {

            $(this).data('val', '');

            $(this).val(settings.value).focus(function () {
                if ($(this).val() == settings.value)
                    $(this).val('');
            }).blur(function () {
                if ($(this).val() == '')
                    $(this).val(settings.value);
            });


            $(this).keyup(function (e) {
                if (e.which && e.which != 'undefined') {
                    $(this).data('val',$(this).val());
                }
                return true;

            }).keyup();
        });
    }



    ////////////////////////////////////////////////////////////////////////////
    //   <ul id="faq">
    //        <li>
    //            <h3 style="text-align: center">
    //                More Options?</h3>
    //        </li>
    //   </ul>

    $.fn.makeCollapsible = function (options, onCollapse) {
        var settings = $.extend({
            'collapse': '1',
            'idToCollapse': ''
        }, options);

        return this.each(function () {
            var $this = $(this);

            $this.find("li > h3").each(function () {
                $(this).css("cursor", "pointer");
                $(this).siblings().wrapAll('<div>');
            });

            if (settings.collapse == '0')
                $("#faq li > *:not(h3)").hide();

            $this.find("li > h3").click(function () {

                var $h3 = $(this);
                //minus icon
                var minus = {
                    'background-image': 'url(/Images/minus.gif)'
                };
                //plus icon
                var plus = {
                    'background-image': 'url(/Images/plus.gif)'
                };

                //all siblings beside <li><h3></h3>(.....)</li>
                var risposta = $h3.siblings();

                var callf = 0;

                if (risposta.is(':hidden')) {
                    $h3.css(minus);
                    callf = 1;
                    risposta.slideDown("slow");
                }
                else {
                    $h3.css(plus);
                    risposta.slideUp("slow");
                }

                //risposta.slideToggle("slow");

                if (callf == 1 && settings.onCollapse != '') {
                    //setTimeout(alert('s'), 2000);
                    if (typeof onCollapse == "function") onCollapse();
                }

            });
        });

    }


    $.fn.makeCollapsible2 = function (options, onCollapse) {

        var settings = $.extend({
            'collapse': 'true',
            'background': 'red',
            'hoveredBackground': 'yellow'
        }, options);

        return this.each(function () {
            var $this = $(this);

            var $h3 = $this.find("h3:first-child");

            $h3.css("cursor", "pointer");
            $h3.css({ backgroundColor: settings.background });

            var state = settings.collapse, answer = $h3.next('div');
            if (state == false) { answer.hide(); }

            $h3.click(function () {
                state = !state;
                if (answer != null) answer.slideToggle(state);
                // tis.toggleClass('active', state);
            });


        });


    }


    //    $.fn.centerIt = function (options) {

    //        var settings = $.extend({
    //            width: '600px',
    //            height: '600px',
    //            position: 'absolute'
    //        }, options);

    //        return this.each(function () {

    //            var $this = $(this);

    //            // $this.html('width: ' + settings.width + ' height: ' + settings.height + ' position: ' + settings.position);


    //        });


    //    }


    $.fn.scale = function (options, duration, callback) {


        var settings = $.extend({
            'widthScale': '0',
            'widthScaleType': 'px',
            'heightScale': '0',
            'heightScaleType': 'px',
            'widthApply': '1',
            'heightApply': '1'
        }, options);

        return this.each(function () {

            var $this = $(this);
            var getWidth, getHeight, wsc = parseInt(settings.widthScale), hsc = parseInt(settings.heightScale);


            getHeight = $this.outerHeight();
            getWidth = $this.outerWidth();

            if (settings.widthScale == '0') {
                settings.widthScale = getWidth / 4;
                settings.widthScaleType = 'px';
                getWidth = getWidth + parseInt(settings.widthScale);

            }
            else {
                settings.widthScale = (wsc - getWidth) / 2;
                getWidth = wsc;
            }


            if (settings.heightScale == '0') {
                settings.heightScale = getHeight / 4;

                settings.heightScaleType = 'px';
                getHeight = getHeight + parseInt(settings.heightScale);
            }
            else
            //if (hsc > getHeight)
            {
                settings.heightScale = (hsc - getHeight) / 2;
                getHeight = hsc;

            }
            //else
            //  settings



            // alert(settings.widthScale + settings.widthScaleType);
            //alert(settings.heightScale + settings.heightScaleType);




            $this.animate({
                height: (settings.heightApply == '1' ? getHeight : $this.height()) + settings.heightScaleType,
                width: (settings.widthApply == '1' ? getWidth : $this.width()) + settings.widthScaleType,
                marginLeft: (settings.widthApply == '1' ? -parseInt(settings.widthScale) : $this.css('marginLeft')) + settings.widthScaleType,
                marginTop: (settings.heightApply == '1' ? -parseInt(settings.heightScale) : $this.css('marginTop')) + settings.heightScaleType

            }, duration, typeof callback == 'function' ? callback : '');




        });

    }

    $.fn.centeralize = function (options) {

        var settings = $.extend(
        {
            source: 'window',
            position: 'absolute'
        }, options);

        var source = settings.source == 'window' ? $(window) : $(settings.source);

        return this.each(
        function () {

            var $this = $(this);




            offset = source.offset();



            isOffsetNull = xCore.isNull(offset);
            sourceTopLeftX = isOffsetNull ? 0 : offset.left;
            sourceTopLeftY = isOffsetNull ? 0 : offset.top;
            sourceTopRightX = isOffsetNull ? source.width() : offset.left + source.width();
            sourceBottomLeftY = isOffsetNull ? source.height() : offset.top + source.height();

            midX = sourceTopLeftX + ((sourceTopRightX - sourceTopLeftX) / 2);
            midY = sourceTopLeftY + ((sourceBottomLeftY - sourceTopLeftY) / 2);

            //TO DO: how to get the size [width/height] according to image
            x = midX - (35 / 2) + "px";
            y = midY - (35 / 2) + "px";

            $this.css({ position: settings.position });
            $this.css({ left: x, top: y });


            if (isOffsetNull)
                $this.appendTo(document.body);
            else
                source.append($this);

            if ($this.css('display') == 'none')
                $this.css('display', 'inline');



        }
        );

    }



    function autoHeight(text) {

        if (txtObj == null || txtObj == 'undefined')
            return;


        text.keydown(function (e) {

            var $text = $(this);

            //8: backspace
            //46: del
            //save
            if (e.which == 13) {

                if ($text.attr('rows') && parseInt($text.attr('rows')) > 1)
                    if (e.ctrlKey) {
                        $text.val($text.val() + "\n");
                        $text.attr('rows', parseInt($text.attr('rows')) + 1);


                    }

            }



            return true;

        }).keydown();


    }




    $.fn.makeEditable2 = function (options, callback) {



        try {

            var settings = $.extend({
                'left': '0px',
                'autoHeight': '0',
                'width': '',
                'background': '#FFFFFF',
                'hoveredBackground': '#FFEBE8',
                'linkable': '0',
                'cursor': 'pointer',
                'rows': '1',
                'saveLabel': 'Save',
                'cancelLabel': 'Cancel',
                'direction': 'ltr',
                'glitter': '1'
            }, options);






            return this.each(function () {

                var $this = $(this);



                if (settings.width == '')
                    settings.width = $this.width();

                var divWidth = parseInt(settings.width) + 100;

                var d = $("<div class='editableMainDiv'>").css({
                    'cursor': settings.cursor,
                    'background-color': settings.background,
                    'display': 'block',
                    'width': divWidth + 'px',
                    'direction': settings.direction

                });

                var editActions = {
                    finalizeEdit: function ($operation, $label, $input, $save, $cancel, $wrapper) {

                        var callBackOptions = { text: $operation == 'cancel' ? $label.html() : $input.val(), updated: $operation == 'cancel' ? false : $label.html() != $input.val() };
                        if ($operation == 'save') {
                            editActions.glittarize($wrapper);

                            $label.text($input.val());
                        }

                        $label.css('display', 'inline');
                        bindAction.bnd($wrapper);
                        $cancel.remove();
                        $input.remove();
                        $save.remove();



                        try {
                            if (typeof callback == 'function') callback(callBackOptions);
                        } catch (ex) {
                            return false;
                        }


                    },
                    glittarize: function ($wrapper) {

                        if (settings.glitter == '1') {

                            xEffects.glittarize($wrapper, settings.hoveredBackground, settings.background, 3000);
                        }

                    },
                    edit: function ($wrapper) {



                        if ($this.css('display') == 'none')
                            return;



                        //  $wrapperDiv.unbind('.editableActions');
                        bindAction.unbnd($wrapper);

                        ///////////////////////
                        $this.css('display', 'none');
                        var save = $('<a href="#" class="editableSave" style="margin-right: 5px;margin-left: 5px">' + settings.saveLabel + '</a>');
                        var cancel = $('<a href="#" class="editableCancel">' + settings.cancelLabel + '</a>');


                        var text = $('<textarea class="editableInput" ' + 'style="width: ' + settings.width + ' "' + '  >').val($this.text()).click(function (e) { e.stopPropagation(); return false; });

                        text.keydown(function (e) {

                            var $text = $(this);

                            //8: backspace
                            //46: del
                            //save
                            if (e.which == 13) {

                                if ($text.attr('rows') && parseInt($text.attr('rows')) > 1)
                                    if (e.ctrlKey) {
                                        $text.val($text.val() + "\n");
                                        $text.attr('rows', parseInt($text.attr('rows')) + 1);

                                        return true;
                                    }

                                editActions.finalizeEdit('save', $this, $text, save, cancel, $wrapper);


                            }

                            //cancel
                            if (e.which == 27) {

                                editActions.finalizeEdit('cancel', $this, $(this), save, cancel, $wrapper);


                            }

                            return true;

                        }).keydown();


                        save.click(function (e) {
                            e.stopPropagation();


                            editActions.finalizeEdit('save', $this, text, $(this), cancel, $wrapper);

                            return false;
                        });

                        cancel.click(function (e) {
                            e.stopPropagation();



                            editActions.finalizeEdit('cancel', $this, text, save, $(this), $wrapper);

                            return false;
                        });

                        text.appendTo($wrapper);

                        save.appendTo($wrapper);
                        cancel.appendTo($wrapper);
                        //                        }
                        text.attr('rows', settings.rows).attr('cols', 100);
                        text.focus();

                    }
                };

                var bindAction = {

                    bnd: function (t) {

                        t.bind({ 'mouseenter.editActions': function () {
                            t.css('background-color', settings.hoveredBackground);
                        }
                        });

                        t.bind({ 'mouseleave.editActions': function () {

                            t.css('background-color', settings.background);
                        }
                        });
                    },

                    unbnd: function (t) {
                        t.unbind('.editActions');
                        t.css('background-color', settings.background);

                    }
                };



                d.click(function (e) {
                    e.stopPropagation();
                    var $wrapperDiv = $(this);

                    editActions.edit($wrapperDiv);


                });

                $this.wrap(d);

                bindAction.bnd($this.parent());



                //////linkable
                if (settings.linkable == '1') {

                    var anchor = $("<a>", {
                        href: "#",
                        click: function (e) {
                            e.stopPropagation();

                            editActions.edit($(this).parent());
                            return false;
                        }
                    });




                    $this.wrap(anchor);

                }



            });
        } catch (ex) {

            xCore.errorHandler.showException(ex);
        }

    }


})(jQuery);


(function ($) {
    //for demo: http://www.unwrongest.com/projects/limit/
    $.fn.extend({
        limit: function (limit, element) {

            var interval, f;
            var self = $(this);

            $(this).focus(function () {
                interval = window.setInterval(substring, 100);
            });

            $(this).blur(function () {
                clearInterval(interval);
                substring();
            });

            substringFunction = "function substring(){ var val = $(self).val();var length = val.length;if(length > limit){$(self).val($(self).val().substring(0,limit));}";
            if (typeof element != 'undefined')
                substringFunction += "if($(element).html() != limit-length){$(element).html((limit-length<=0)?'0':limit-length);}"

            substringFunction += "}";

            eval(substringFunction);



            substring();

        }
    });
})(jQuery);



//anchor.css({ display: 'block', width: "'" + settings.width + "'", cursor: "'" + settings.cursor + "'" });

// $("<style type='text/css'> .redbold{ color:#f00; font-weight:bold;} </style>").appendTo("head");
//  $("<div/>").addClass("redbold").text("SOME NEW TEXT").appendTo("body");

//            var t = 0;

//            $("head > style").each(function () {
//                var $style = $(this);
//                alert($style.find('*:contains(".editableMain")').text());
//                if ($style.find('*:contains(".editableMain")'))
//                    t = 1;
//            });

//            alert(t);

//if (t == 0)
//$("<style type='text/css'> .editableMain{ color: green; font-weight:bold;} .editableMain:hover{ color: black; font-weight:bold;} </style>").appendTo("head");




 
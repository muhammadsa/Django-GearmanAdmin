//Author: Muhammad Suliman
var isDebugMode = true;

//<script type="text/javascript">
//xCore.loadScript("http://your.cdn.com/second.js", function(){
//    //initialization code
//});
//</script>

//formatting string according to whatever you are typing inside string "".format("{0}...{1}", var1,var2);
String.prototype.format = String.prototype.f = function () {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

var xCore = {
    //load javascript without blocking (at runtime..and also whenever needed only.)
    loadScript: function (url, callback) {

        var script = document.createElement("script")
        script.type = "text/javascript";

        if (script.readyState) {  //IE
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" ||
                    script.readyState == "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {  //Others
            script.onload = function () {
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    },
    invoke: function (runnable) {
        if (isDebugMode) {
            console.log('invoke: start');
        }
        //condition, the variable of type of function and also has a run method
        if (runnable && runnable.run)
            $(document).ready(runnable.run);
    },
    setDebugMode: function () {
        isDebugMode = true;
    },
    stringManipulation: {
        trim: function (str) {
            if (isDebugMode) {
                console.log('trim: start');
            }
            var start = -1, end = str.length;
            while (str.charCodeAt(--end) < 33);
            while (str.charCodeAt(++start) < 33);
            return str.slice(start, end + 1);
        }
    },
    errorHandler: {
        listmethods: function getMethods(obj) {
            if (obj == null || obj == 'undefined')
                console.log('object is null');

            var res = [];
            for (var m in obj) {
                if (typeof obj[m] == "function") {
                    res.push(m)
                }
            }
            return res;
        },
        showError: function (requestObject) {
            if (isDebugMode) {
                console.log('showError: start');
            }
            try {
                if (isDebugMode) {
                    this.errorHandler.listmethods(requestObject);
                    console.log("Error Details:" + requestObject + requestObject.responseText);
                }
            } catch (ex) {
                if (isDebugMode)
                    console.log(ex);
            }
        },

        showException: function (ex) {
            if (isDebugMode) {
                console.log('show Exception: start');
            }
            try {

                if (isDebugMode) {
                    console.log("Error Details:" + ex);
                }
            } catch (ex) {
                console.log(ex);
            }
        }
    },
    getCookie: function (name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },
    isNull: function (obj) {
        if (obj == null || obj == 'undefined')
            return true;
        else
            return false;


    },
    http: {
        redirect: function (url) {
            try {
                document.location.href = url;
            }
            catch (ex) {
                try {
                    window.location.href = url;
                } catch (exx) {
                }
            }

            return false;
        }
    }
};

var xPosition = {
    centeralize: function (source, destination) {
        if (isDebugMode) {
            console.log('centralize: start');
        }

        if (destination == null || destination == 'undefined')
            destination = $("<div class='loading'></div>");

        if (source == null || source == 'undefined')
            source = $(window);

        var offset = source.offset();
        //  alert(offset.left + "/" + offset.top + "-" + (offset.left + source.width()));
        var isOffsetNull = xCore.isNull(offset);
        var sourceTopLeftX = isOffsetNull ? 0 : offset.left;
        var sourceTopLeftY = isOffsetNull ? 0 : offset.top;
        //var sourceTopRightX = isOffsetNull ? source.width() : offset.left + source.width();
        //var sourceBottomLeftY = isOffsetNull ? source.height() : offset.top + source.height();

        //var midX = sourceTopLeftX + ((sourceTopRightX - sourceTopLeftX) / 2);
        //var midY = sourceTopLeftY + ((sourceBottomLeftY - sourceTopLeftY) / 2);
        var midX = sourceTopLeftX + (source.width() / 2);
        var midY = sourceTopLeftY + (source.height() / 2);

        //TO DO: how to get the size [width/height] according to image
        var x = midX - (35 / 2) + "px", y = midY - (35 / 2) + "px";
        destination.css({ left: x, top: y });

        //if (isOffsetNull)
        destination.appendTo(document.body);
        //else
        //    source.append(destination);

        if (destination.css('display') == 'none')
            destination.css('display', 'inline');
    },
    remove: function (source, destination) {
        if (isDebugMode) {
            console.log('remove: start');
        }

        if (xCore.isNull(source) == true || xCore.isNull(destination))
            return;

        //TO DO: validate and make sure that source has this destination...
        destination.remove();
    }
};

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

var csrftoken = xCore.getCookie('csrftoken');

$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

var xAjax = {

    preajax: function (loadingImage, centralizeLoaderImage, loadTarget, onSuccess, onError, onComplete) {
        if (isDebugMode) {
            console.log('post2: start');
        }
        try {
            var isLoadingImageNull = false;

            if (!loadingImage || loadingImage == null || loadingImage == 'undefined') {
                var loadingClass = "<div class='loading" +
                    (loadTarget ? " for_" + loadTarget.attr('class') + "'" : "'") +
                    "></div>";
                loadingImage = $(loadingClass);
                isLoadingImageNull = true;
            }

            //wrap the control with div then calculate the mid of the new div then add the loading image there
            if (centralizeLoaderImage == true)
                try {
                    xPosition.centeralize(loadTarget, loadingImage);
                }
                catch (ex) {
                }
            else
                loadingImage.css('display', 'inline');

            var completeFunction = function () {
                if (onComplete) {
                    if (isDebugMode) {
                        console.log('calling your complete function')
                    }
                    onComplete();
                }
                if (isLoadingImageNull) {
                    if (isDebugMode) {
                        console.log('removing using xposition.remove')
                    }
                    //TODO: to get rid of "remove" as it make an error named "has no method 'replace'"
                    try {
                        if (loadTarget && loadTarget != 'undefined') {
                            console.log('removing class:' + "div.loading.for_" + loadTarget.attr("class").replace(' ', '.'));
                            xPosition.remove(loadTarget, $("div.loading.for_" + loadTarget.attr("class").replace(' ', '.')));
                        }
                        else
                            xPosition.remove($(document), $(".loading"));
                    } catch (ex) {
                    }
                }
                else {
                    if (isDebugMode) {
                        console.log('inline removing using display attribute in css')
                    }
                    loadingImage.css('display', 'none');
                }


            };

            if (isDebugMode) {
                console.log('preajax finished .. ajax: start');
            }

            return completeFunction;
        }
        catch (ex) {
            if (isDebugMode) {
                console.log('exception inside preajax: ' + ex + 'complete function will be execluded');
            }
            return null;
        }
    },
    getWithLoadTarget: function (requestUrl, data, loadTarget, onSuccess, onComplete) {
        if (isDebugMode) {
            console.log('getWithLoadTarget : start');
        }
        if (loadTarget) {
            //wrap the control with div then calculate the mid of the new div then add the loading image there
            //$('#elementId').centerIt({width:'400px', height:'200px'});

            xPosition.centeralize(loadTarget, $("<div class='loading'></div>"));
        }

        var completeFunction = function () {
            if (isDebugMode) {
                console.log('completeFunction : start');
            }
            if (onComplete) {
                onComplete();
            }
            if (loadTarget) {
                xPosition.remove(loadTarget, loadTarget.find(".loading"));
            }
        };
        if (isDebugMode) {
            console.log('calling ajax: start');
        }
        $.ajax({
            type: "GET",
            url: requestUrl,
            data: data,
            context: this,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                try {
                    onSuccess(response);
                } catch (ex) {
                    xCore.errorHandler.showError('exception while executing success method : ' + ex)
                }
                try {
                    completeFunction();
                } catch (ex) {
                    xCore.errorHandler.showError('exception while executing complete method : ' + ex)
                }
            },
            error: function (response) {
                console.log("Ajax Request Failed");
                xCore.errorHandler.showError('response is: ' + response);
                try {
                    completeFunction();
                } catch (ex) {
                    xCore.errorHandler.showError('exception while executing complete method : ' + ex)
                }
            }
        });

    },
    getWithLoadTarget2: function (requestUrl, data, loadTarget, onSuccess, onComplete) {
        if (isDebugMode) {
            console.log('getWithLoadTarget: start');
        }
        xAjax.get2(requestUrl, data, null, true, loadTarget, onSuccess, null, onComplete);
    },
    get2: function (requestUrl, data, loadingImage, centralizeLoaderImage, loadTarget, onSuccess, onError, onComplete) {
        try {
            var completeFunction = xAjax.preajax(loadingImage, centralizeLoaderImage, loadTarget, onSuccess, onError, onComplete);

            $.ajax({
                type: "GET",
                url: requestUrl,
                data: data,
                context: this,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data, status) {
                    onSuccess(data, status);
                    console.log('calling custom complete function');
                    try {
                        completeFunction();
                    } catch (ex) {
                        console.log(ex);
                    }
                },
                error: function (response, ajaxOptions, thrownError) {
                    try {
                        if (onError)
                            onError(response);
                        else {
                            if (isDebugMode) {
                                console.log("Ajax Request Failed" + thrownError);
                                xCore.errorHandler.showError('response is: ' + response);
                            }
                        }
                        console.log('calling custom complete function');
                        xCore.invoke(completeFunction);
                    }
                    catch (ex) {
                        if (isDebugMode) console.log(ex);
                    }
                }
            });
        }
        catch (ex) {
            if (isDebugMode)
                console.log(ex);
        }
    },
    get: function (requestUrl, data, loaderImageId, onSuccess, onComplete) {
        if (isDebugMode) {
            console.log('get: start');
        }
        if (loaderImageId) {
            $("#" + loaderImageId).css('display', 'inline');

        }

        var completeFunction = function () {
            if (isDebugMode) {
                console.log('completeFunction: start');
            }
            if (onComplete && typeof onComplete == 'function') {
                onComplete();
            }
            if (loaderImageId) {
                $("#" + loaderImageId).css('display', 'none');
            }
        };

        if (isDebugMode) {
            console.log('calling ajax: start');
        }

        $.ajax({
            type: "GET",
            url: requestUrl,
            data: data,
            context: this,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {

                onSuccess(response);
                completeFunction();
            },
            error: function (response) {
                try {
                    if (isDebugMode) {
                        console.log("Ajax Request Failed, response: " + response.responseText);
                        xCore.errorHandler.showError('response is: ' + response);
                    }

                    completeFunction();
                }
                catch (ex) {
                    if (isDebugMode)
                        console.log(ex);
                }
            }
        });
    },
    postWithLoadTarget: function (requestUrl, data, loadTarget, onSuccess, onComplete) {
        if (isDebugMode) {
            console.log('postWithLoadTarget: start');
        }
        xAjax.post2(requestUrl, data, null, true, loadTarget, onSuccess, null, onComplete);


    },
    post2: function (requestUrl, data, loadingImage, centralizeLoaderImage, loadTarget, onSuccess, onError, onComplete) {
        if (isDebugMode) {
            console.log('post2: start');
        }
        try {
            var completeFunction = xAjax.preajax(loadingImage, centralizeLoaderImage, loadTarget, onSuccess, onError, onComplete);

            $.ajax({
                type: "POST",
                url: requestUrl,
                data: data,
                context: this,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (data, status) {

                    onSuccess(data, status);
                    completeFunction();
                },
                error: function (response, ajaxOptions, thrownError) {

                    try {

                        if (onError)
                            onError(response);
                        else {
                            if (isDebugMode) {
                                console.log("Ajax Request Failed" + thrownError);
                                //xCore.errorHandler.showError('response is: ' + response);
                            }
                        }
                        completeFunction();
                    }
                    catch (ex) {
                        if (isDebugMode) console.log(ex);
                    }
                }
            });
        }
        catch (ex) {

            if (isDebugMode)
                console.log(ex);
        }

    },
    post: function (requestUrl, data, loaderImageId, onSuccess, onComplete) {
        if (isDebugMode) {
            console.log('post: start');
        }
        if (loaderImageId) {
            $("#" + loaderImageId).css('display', 'inline');
        }

        var completeFunction = function () {
            if (isDebugMode) {
                console.log('completeFunction : start');
            }
            if (onComplete) {
                onComplete();
            }
            if (loaderImageId) {
                $("#" + loaderImageId).css('display', 'none');
            }
        };
        if (isDebugMode) {
            console.log('calling ajax: start');
        }
        $.ajax({
            type: "POST",
            url: requestUrl,
            context: this,
            data: data,
            success: function (response) {
                onSuccess(response);
                completeFunction();
            },
            error: function (response) {
                try {
                    if (isDebugMode) {
                        console.log("Ajax Request Failed");
                        xCore.errorHandler.showError('response is: ' + response);
                    }
                    completeFunction();
                }
                catch (ex) {
                    if (isDebugMode) console.log(ex);
                }
            }
        });
    }
};

(function ($) {
    var last_counter_time = 0;

    $.fn.counter = function (options) {

        var defaults = {
            start: 0,
            end: 10,
            time: 10,
            step: 1000,
            callback: function () {
            }
        };

        var options = $.extend(defaults, options);

        console.log('counter?' + options.end);
        var counterFunc = function (el, increment, end, step) {
            var value = parseInt(el.html(), 10) + increment;
            if (value >= end) {
                el.html(Math.round(end));
                options.callback();
            } else {
                el.html(Math.round(value));
                setTimeout(counterFunc, step, el, increment, end, step);
            }
        }
        if (parseInt(last_counter_time) > 0) {
            options.step = 0;
        }

        $(this).html(Math.round(options.start));

        var increment = (options.end - options.start) / ((1000 / options.step) * options.time);

        (function (e, i, o, s) {
            if (isDebugMode) console.log("last_counter_time " + last_counter_time);
            if (parseInt(last_counter_time) > 0) {
                if (isDebugMode) console.log("clearing last counter time");
                clearTimeout(last_counter_time);
            }
            last_counter_time = setTimeout(counterFunc, s, e, i, o, s);

        })($(this), increment, options.end, options.step);
    }
})(jQuery);
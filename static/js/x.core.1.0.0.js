isDebugMode = true;

var xCore = {

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

    isNull: function (obj) {
        if (obj == null || obj == 'undefined')
            return true;
        else
            return false;


    },

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

        offset = source.offset();
        //  alert(offset.left + "/" + offset.top + "-" + (offset.left + source.width()));

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


        destination.css({ left: x, top: y });


        if (isOffsetNull)
            destination.appendTo(document.body);
        else
            source.append(destination);

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

var xAjax = {



    finalizeErrorProcess: function (response, onError, onComplete) {
        if (isDebugMode) {
            console.log('finalizeErrorProcess: start');
        }
    },

    getWithLoadTargetId: function (requestUrl, data, loadTargetId, onSuccess, onComplete) {
        if (isDebugMode) {
            console.log('getWithLoadTargetId: start');
        }

        xAjax.getWithLoadTarget(requestUrl, data, $("#", loadTargetId), onSuccess, onComplete);

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
                onSuccess(response);
                completeFunction();
            },
            error: function (response) {
                try {
                    console.log("Ajax Request Failed");
                    xCore.errorHandler.showError('response is: ' + response);
                    completeFunction();
                }
                catch (ex) {
                    if (isDebugMode) console.log(ex);
                }
            }
        });

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
    get33: function (requestUrl, data, contentType, loaderImageId, onSuccess, onComplete) {

        if (loaderImageId) {
            $("#" + loaderImageId).css('display', 'inline');

        }

        var completeFunction = function () {
            if (onComplete && typeof onComplete == 'function') {
                onComplete();
            }
            if (loaderImageId) {
                $("#" + loaderImageId).css('display', 'none');
            }
        };


        $.ajax({
            type: "GET",
            url: requestUrl,
            contentType: contentType,
            data: data,
            context: this,


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
    postWithLoadTargetId: function (requestUrl, data, loadTargetId, onSuccess, onComplete) {

        if (isDebugMode) {
            console.log('postWithLoadTargetId : start');
        }
        s = $("#", loadTargetId);

        if (s == null || s == 'undefined')
            if (isDebugMode)
                console.log('could not find the load target...');

        xAjax.postWithLoadTarget(requestUrl, data, s, onSuccess, onComplete);
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
            isLoadingImageNull = false;

            if (!loadingImage || loadingImage == null || loadingImage == 'undefined') {
                loadingImage = $("<div class='loading'></div>");
                isLoadingImageNull = true;
            }


            //wrap the control with div then calculate the mid of the new div then add the loading image there
            if (centralizeLoaderImage == true)
                try {
                    xPosition.centeralize(loadTarget, loadingImage);
                } catch (ex) {
                }
            else
                loadingImage.css('display', 'inline');

            var completeFunction = function () {

                if (onComplete) {
                    onComplete();
                }

                if (loadTarget) {


                    if (isLoadingImageNull)
                    //to get rid of "remove" as it make an error named "has no method 'replace'"
                        try {
                            xPosition.remove(loadTarget, loadTarget.find(".loading"));
                        } catch (ex) {
                        }
                    else
                        loadingImage.css('display', 'none');
                }
            };

            if (isDebugMode) {
                console.log('calling ajax: start');
            }

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
                                 //response.status
                                //response.responseText
                                console.log("Ajax Request Failed" + thrownError );
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
    },
    post33: function (requestUrl, data, contentType, loaderImageId, onSuccess, onComplete) {
        if (isDebugMode) {
            console.log('post33 : start');
        }
        if (loaderImageId) {
            $("#" + loaderImageId).css('display', 'inline');
        }

        var completeFunction = function () {
            if (onComplete) {
                onComplete();
            }
            if (loaderImageId) {
                $("#" + loaderImageId).css('display', 'none');
            }
        };
        if (isDebugMode) {
            console.log('calling ajax now: start');
        }
        $.ajax({
            type: "POST",
            contentType: contentType,
            url: requestUrl,
            context: this,
            data: data,
            success: function (response) {
                if (isDebugMode) {
                    console.log('success ajax');
                }
                onSuccess(response);
                completeFunction();
            },
            error: function (response) {
                try {
                    if (isDebugMode) {
                        console.log("Ajax Request Failed");
                    }

                    xCore.errorHandler.showError('response is: ' + response);
                    completeFunction();
                }
                catch (ex) {
                    if (isDebugMode) console.log(ex);
                }
            }
        });
    }
};


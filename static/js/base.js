/**
 * Created by Muhammads on 9/28/2014.
 */
var last_time = 0;

function timedRefresh(timeoutPeriod) {
    if (last_time != 0) {
        clearTimeout(last_time);
    }

    last_time = setTimeout("location.reload(false);", timeoutPeriod);
}

var test = function ($end) {
    if ($end == null || $end == -1){

        if(last_time>0)
            clearTimeout(last_time);

        $('#beforefoo').css('display', 'none');
        $(document).onload = null;
        $('#foo').counter({start:0,end:0,time:0, step:0});
    }
    else {
        $('#beforefoo').css('display', 'inline');
        $(document).onload = timedRefresh($end * 1000);
        $('#foo').counter({
            start: 1,
            end: $end,
            time: $end - 1,
            step: 1000,
            callback: function () {
                //alert("I'm done!");
            }
        });
    }
};

function show(dialog) {
    return true;
}

function open(dialog) {
    // add padding to the buttons in firefox/mozilla
    if ($.browser) {

        if ($.browser.mozilla) {
            $('div#simplemodal-container .button').css({
                'padding-bottom': '2px'
            });
        }
        // input field font size
        if ($.browser.safari) {
            $('div#simplemodal-container .input').css({
                'font-size': '.9em'
            });
        }
    }
    // dynamically determine height
    var h = 280;

    var $title = $('div#simplemodal-container .title');
    var tempTitle = $title.html();

    $title.html('Loading...');
    dialog.overlay.fadeIn(200, function () {
        dialog.container.fadeIn(200, function () {
            dialog.data.fadeIn(200, function () {
                $('div#simplemodal-container .content').animate({
                    height: h
                }, function () {
                    $title.html(tempTitle);
                    $('div#simplemodal-container form').fadeIn(200, function () {
                        $('div#simplemodal-container div#simplemodal-name').focus();
                    });
                });
            });
        });
    });
}

function close(dialog) {
    try {
        $('div#simplemodal-container .message').fadeOut();
        $('div#simplemodal-container form').fadeOut(200);
        $('div#simplemodal-container').animate({
            height: 40
        }, function () {
            dialog.data.fadeOut(200, function () {
                dialog.container.fadeOut(200, function () {
                    dialog.overlay.fadeOut(200, function () {

                        $.modal.close();
                    });
                });
            });
        });
    } catch (ex) {
        alert(ex);
    }
}

$("#add_server").click(function (e) {
    e.preventDefault();

    $.get("/add", function (data) {
        // create a modal dialog with the data
        $.modal(data, {
            closeHTML: "<a href='#' title='Close' class='modal-close'>x</a>",
            escClose: true,
            onOpen: open,
            onShow: show,
            overlayId: 'simplemodal-overlay',
            containerId: 'simplemodal-container',
            onClose: close
        });
    });
});

function auto_refresh(val) {
    xAjax.postWithLoadTarget("/refresh_script/" + val, null,
       null, function (data) {
            if (data.err) {
                console.log("error while refresh" + data.err + data.err_desc);
            }
            else {
                test(val);
            }
        });
}

$("a#diable_auto_refresh").click(function (e) {
    e.preventDefault();
    console.log('test');
    auto_refresh(-1);
});


$("a.refresh").each(function (i, v) {
    var $id = $.attr(v, 'id');
    var $rate = $.attr(v, 'rate');

    $("a#" + $id).click(function (e) {
        $("a.refresh").disabled = true;
        e.preventDefault();
        auto_refresh($rate);

    })
});
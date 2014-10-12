/**
 * Created by Muhammads on 9/27/2014.
 */

(function ($) {
    var old = $.parseJSON;
    $.parseJSON = function (data) {
        if (data === null || data === undefined) {
            return data;
        }
        return old.call($, data);
    }
})(jQuery)


function drawServerChart(serverId, myData, down_times, chartContainerId, title, type) {
    var myChart = new JSChart(chartContainerId, 'line');
   // console.log(myData.length);
    myChart.setDataArray(myData);
    myChart.setAxisNameX('');
    myChart.setAxisNameY('');
    myChart.setAxisValuesAngle(45);
    myChart.setAxisPaddingBottom(50);
    if (type == null || type == 'undefined' || type == 'summary') {
        //console.log("width: 450");
        myChart.setSize(450, 400);

    }
    else {
        var width = $("#server" + serverId).width();
        if (width == null || width == 'undefined')
            width = 490;
       // console.log("width" + width);
        myChart.setSize(width - 40, 400);

    }
    if(title == null || title == 'undefined' || title == '')
         myChart.setTitle(filter_texts["R"].f(serverId));
    else
        myChart.setTitle(title);

    if (down_times != null && down_times != '' && down_times != 'undefined' && down_times.length > 0) {
        //var $down_times = new Array(down_times);
        //console.log(down_times);
        for (var i = 0; i < down_times.length; i++) {
            var r = down_times[i].toString();
           // console.log('setting tooltip for ' + r.substring(1, r.length - 1));
            myChart.setTooltip(down_times[i]);
        }
    }

    myChart.draw();
}

String.format = function () {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
};


var filter_texts = {"R": "Response times of {0} for today",
    "H": "Average response time of {0} by hours",
    "D": "Average response time of {0} by days",
    "W": "Average response time of {0} by weeks",
    "M": "Average response time of {0} by months"
};

function ajaxchart($server, data_length, type, filter_type) {
    var url = '/schart/' +
        (filter_type != null && filter_type != 'undefined' ? filter_type + "/" : "" ) +
        $server +
        "/" +
        data_length;
    xAjax.getWithLoadTarget2(url, null, $("div.server" + $server), function (result) {
        try {
            var down_times = eval("[" + result.data.down_times + "]");
            var hist = eval("[" + result.data.history + "]");


            drawServerChart($server, hist, down_times, "chartcontainer" + $server, filter_texts[filter_type].f($server) , type);
        }
        catch (ex) {
            console.log(ex);
        }
    });
}

$('input:radio').click(function (e) {
    //e.preventDefault();
    var $this = $(this);
    //$this.attr('checked', true);
    var filter_type = $this.val().split('_')[1];
    var data_length = parseInt($this.attr('data_length'));
    var type = $this.attr('type');
    $this.parent().parent().find(".active").removeClass("active")
    $this.parent().addClass("active");
    //call ajax to refresh the chart and to update database...
    var $server = $this.val().split('_')[0];
    //console.log($server);
    //HTTP call: /schart/?id=1
    //xAjax.getWithLoadTarget('/schart', {id: $server}, null, function (data) {
    console.log('start ajax get');
    ajaxchart($server, data_length, type, filter_type);
});

$('a.fast_refresh').click(function (e) {
    e.preventDefault();
    var $this = $(this);
    var type = $this.attr('type');
    var $server = $this.attr('for');
    var data_length = parseInt($this.attr('data_length'));
    var filter_type = $this.closest("div.row").find('input[type="radio"]:checked').val().split('_')[1];
    //call ajax to refresh the chart and to update database...
    //console.log($server);
    //HTTP call: /schart/?id=1
    //xAjax.getWithLoadTarget('/schart', {id: $server}, null, function (data) {
    console.log('start ajax get');

    ajaxchart($server, data_length, type, filter_type);
});


$("a.shutdown").click(function (e) {
    e.preventDefault();
    var action_url = $(this).attr('action');
//    console.log('start ajax call from func');
    xAjax.postWithLoadTarget(action_url, {}, $('.divtest'), function () {
        $.notify("Shutdown completed successfully");
//        console.log('done ajax call from func');

    });
});

function recursive_modal($this) {
    var form_url = $this.attr("form_url");
    var y_pos = $(window).height() * 15 / 100;

    $.modal("<div>Loading... </div>", {
        autoPosition: true,
        containerCss: {
            'maxHeight': $(window).height() - y_pos,
            'overflow': 'auto'
        },
        position: [y_pos + 'px', '30%'],
        onShow: function (dlg) {
            $.get(form_url, function (data) {
                //console.log('show');
                $('#simplemodal-container1 .simplemodal-data').html(data);
                if (data)
                    $('#simplemodal-container1 .simplemodal-data').find("a.workers").click(function (e) {

                        e.preventDefault();
                        $.modal.close();
                        recursive_modal($(this));
                    })
            });
            $(dlg.container).css('height', 'auto');
        },
        overlayId: "simplemodal-overlay1",
        containerId: 'simplemodal-container1',
        closeHTML: "<div style='position: absolute; right: 0px; top: 1px; float: right; text-align: right'><div style='position:fixed'><a href='#' title='Close' class='modal-close'>x</a></div></div>"
    });
}

$("a.details,a.workers").click(function (e) {
    e.preventDefault();
    recursive_modal($(this));
});


$("a.delete_server").click(function (e) {
    e.preventDefault();
    var action_url = $(this).attr("action_url");
    var target_id = $(this).attr("target_id");
    confirm("Are you sure you want to delete this server and its contents?", function () {
        //POST asking for deletion
        xAjax.postWithLoadTarget(action_url, null,
            $(".divtest"), function (data) {
                $(target_id).remove();
            });
    });
});


//     $.ajax({
//        type: "GET",
//        url: "/schart",
//        //contentType: "application/json; charset=utf-8",
//        //dataType: "json",
//        data: { id: $server }
//    })
//        .done(function (msg) {
//            //alert( "Data Saved: " + msg );
//            var obj = JSON.parse(msg);
//            //alert(obj.history);
//            try {
//
//                var down_times = new Array(obj.down_times);
//
//                var hist = eval("[" + obj.history.substring(1, obj.history.length - 1) + "]");
//                //for(var i =0;i< r.length;i++){alert(r[i]);}
//                drawServerChart($server, hist, down_times, "chartcontainer" + $server, "today");
//
//            } catch (ex) {
//                alert(ex);
//            }
//            //obj.down_times
//
//        })
//        .fail(function (ex) {
//            alert('error' + ex);
//        })
//        .complete(function () {
//            //alert('complete');
//        });
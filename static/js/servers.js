/**
 * Created by Muhammads on 9/27/2014.
 */

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
//    console.log('start');
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
(function($){
    $.fn.centerIt = function(settings){

        var opts = $.extend({}, $.fn.centerIt.defaults, settings);

        return this.each(function(settings){
          var options = $.extend({}, opts, $(this).data());
          var $this = $(this);

          $this.css({
            position:options.position,
            top:'50%',
            left:'50%',
            width:options.width,                 // adjust width
            height:options.height,               // adjust height
            zIndex:1000,
            marginTop:parseInt((options.height / 2), 10) + 'px',  // half of height
            marginLeft:parseInt((options.width / 2), 10) + 'px'  // half of height
          });

        });
    }

    // plugin defaults - added as a property on our plugin function
    $.fn.centerIt.defaults = {
      width: '600px',
      height: '600px',
      position:'absolute'
    }

})(jQuery);
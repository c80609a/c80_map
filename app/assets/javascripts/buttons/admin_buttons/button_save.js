"use strict";

function SaveChangesButton() {

    var _map = null;
    var _this = this;
    _this.el = null;

    _this.onClick = function (e) {
        if (_this.el.hasClass('disabled')) return;
        e.preventDefault();


    };

    _this.init = function (button_css_selector, link_to_map) {
        _map = link_to_map;
        _this.el = $(button_css_selector);
        _this.el.on('click', _this.onClick);
    };

    _this.check_and_show = function () {

        //check
        var mark_dirty = false;
        for (var bid in _map.drawn_areas) {
            mark_dirty = true;
            break;
        }

        // show
        var d = mark_dirty ? 'block':'none';
        _this.el.css('display',d);

    };

}

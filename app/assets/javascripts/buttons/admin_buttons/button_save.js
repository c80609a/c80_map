"use strict";

function SaveChangesButton() {

    var _map = null;
    var _this = this;
    _this.el = null;

    var sendDataToServer = function () {

        var areas = {};
        var building_areas;
        var iarea;

        for (var building_id in _map.drawn_areas) {
            building_areas = _map.drawn_areas[building_id];
            areas[building_id] = [];

            for (var i = 0; i < building_areas.length; i++) {
                iarea = building_areas[i];
                areas[building_id.split('b').join()].push(iarea.to_json());
            }

        }

        $.ajax({
            url: '/save_map_data',
            type: 'POST',
            data: {
                areas: areas
            },
            dataType: 'json'
        }).done(sendDataToServerDone);
    };

    var sendDataToServerDone = function (data, result) {

    };

    _this.onClick = function (e) {
        if (_this.el.hasClass('disabled')) return;
        e.preventDefault();
        _map.save_preloader_klass.show();
        sendDataToServer();
    };

    _this.init = function (button_css_selector, link_to_map) {
        _map = link_to_map;
        _this.el = $(button_css_selector);
        _this.el.on('click', _this.onClick);
    };

    _this.check_and_enable = function () {

        //check
        var mark_dirty = false;
        for (var bid in _map.drawn_areas) {
            mark_dirty = true;
            break;
        }

        // show
        //var d = mark_dirty ? 'block':'none';
        //

        // enable
        if (mark_dirty) {
            _this.el.removeClass('mapplic-disabled');
        } else {
            _this.el.addClass('mapplic-disabled');
        }

    };

    _this.hide = function () {
        _this.el.css('display','none');
    };

    _this.show = function () {
        _this.el.css('display','block');
    };
}

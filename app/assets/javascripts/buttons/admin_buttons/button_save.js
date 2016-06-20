"use strict";

function SaveChangesButton() {

    var _map = null;
    var _this = this;
    _this.el = null;

    var sendDataToServer = function () {

        var areas;
        var buildings;
        var i, len;

        len = _map.drawn_areas.length;
        if (len > 0) {
            areas = [];
            for (i = 0; i < len; i++) {
                areas.push(_map.drawn_areas[i].to_json());
            }
        }

        len = _map.drawn_buildings.length;
        if (len > 0) {
            buildings = [];
            for (i = 0; i < len; i++) {
                buildings.push(_map.drawn_buildings[i].to_json());
            }
        }

        $.ajax({
            url: '/save_map_data',
            type: 'POST',
            data: {
                areas: areas,
                buildings: buildings
            },
            dataType: 'json'
        }).done(sendDataToServerDone);
    };

    var sendDataToServerDone = function (data, result) {
        console.log("<ButtonSave.sendDataToServerDone> data,result:");
        console.log(data);
        console.log(result);
        console.log("<ButtonSave.sendDataToServerDone> ------------");
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
        var mark_dirty = _map.drawn_areas.length || _map.drawn_buildings.length;

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

"use strict";

function BackToMapButton() {

    var _map = null;
    var _this = this;

    var _cnt = null;
    var _btn = null;

    var _onClick = function () {
        _map.setMode('viewing');

        if (_map.current_building) {
            _map.current_building.exit();
            _map.current_building = null;
        }

        if (_map.current_area) {
            _map.current_area.exit();
            _map.current_area = null;
        }

        _map.svgRemoveAllNodes();
        _map.draw_childs(_map.data["childs"]);

    };

    _this.init = function (parent_div_selector, link_to_map) {
        _map = link_to_map;
        _cnt = $('<div></div>').addClass('back_to_map_button');
        _cnt.appendTo($(parent_div_selector));
        _btn = $('<a href="#" id="BackToMapButton">Обратно на карту</a>');
        _btn.on('click', _onClick);
        _cnt.append(_btn);
    };

    _this.show = function () {
        _cnt.css('display', 'block');
    };

    _this.hide = function () {
        _cnt.css('display', 'none');
    }

}

"use strict";

// именно эта кнопка контролирует переходы между состояниями:
// - viewing, editing;
// - view_building, edit_building;
// - view_area, edit_area;
function EditButton() {

    var _map = null;
    var _this = this;
    _this.state = 'init'; // editing / viewing
    _this.el = null;

    // состояние этой кнопки извне меняет приложение,
    // когда входим в здание\площадь (вот тут [a1x7]),
    // и чтобы не происходило бесконечного зацикленного вызова,
    // вводится флаг mark_change_only_inner_state
    this.setState = function (state,mark_change_only_inner_state) {
        if (mark_change_only_inner_state == undefined) {
            mark_change_only_inner_state = false;
        }
        console.log("<EditButton.setState> state = " + state);

        // этот код коррелирует с [x9cs7]
        _this.state = state;
        _this.el.removeClass('editing');
        _this.el.removeClass('viewing');
        _this.el.removeClass('view_building');
        _this.el.removeClass('edit_building');
        _this.el.removeClass('view_area');
        _this.el.removeClass('edit_area');
        _this.el.addClass(state);

        if (!mark_change_only_inner_state) {
            _map.setMode(state);
        }

    };

    this.onClick = function (e) {
        e.preventDefault();

        switch (_this.state) {
            case 'editing':
                _this.setState('viewing');
                break;

            case 'viewing':
                _this.setState('editing');
                break;

            case 'view_building':
                _this.setState('edit_building');
                break;

            case 'edit_building':
                _this.setState('view_building');
                break;

            case 'view_area':
                _this.setState('edit_area');
                break;

            case 'edit_area':
                _this.setState('view_area');
                break;

        }

    };

    this.init = function (button_css_selector, link_to_map) {
        _map = link_to_map;
        _this.el = $(button_css_selector);
        _this.state = _map.mode;
        _this.el.addClass(_map.mode);
        _this.el.on('click', this.onClick);
    };

}
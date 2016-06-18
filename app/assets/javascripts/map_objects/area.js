"use strict";

function Area() {

    var _map = null;
    var _this = this;
    //var _polygon = null;
    //var _polygon_overlay = null;


    // экранные координаты левой верхней точки, куда надо вписать полигон здания
    //var _left_page_x = 342;
    //var _left_page_y = 65;

    // bounding box полигона (в логических координатах)
    var _bbox = null;

    // центр полигона (в логических координатах)
    var _cx = null;
    var _cy = null;

    _this.init = function (options, parent_building_hash, pself) {
        console.log("<Area.init>");
        //console.log(parent_building_hash);

        _map = pself;
        _this._options = options;
        _this._options.parent_building_hash = parent_building_hash;
        //console.log(_this._options.parent_building_hash);


        _this._polygon = Polygon.createFromSaved(options, false, _map);
        _this._polygon.area = _this;
        _this._polygon.parent_building_hash = parent_building_hash;
        _this._polygon = $(_this._polygon.polygon);


        _this._polygon_overlay = Polygon.createFromSaved(options, true, _map);
        _this._polygon_overlay.area = _this;
        _this._polygon_overlay = $(_this._polygon_overlay.polygon);
        _this._polygon_overlay.hover(_this._mouse_in, _this._mouse_out);
        _this._calcBBox();

        var k = 'free';
        if (options.area_hash != undefined) {
            if (!options.area_hash.is_free) {
                k = 'busy';
            }
        }
        _this._polygon.parent().attr("class", k);

    };

    _this.enter = function () {
        //console.log("<Building.enter>");
        //console.log(_this._options);

        /* рассчитаем масштаб, при котором можно вписать прямоугольник дома в прямоугольник рабочей области */

        var scaleX = _map.calcScale(_bbox.xmin, _bbox.xmax, _map.X1S, _map.X2S);
        var scaleY = _map.calcScale(_bbox.ymin, _bbox.ymax, _map.Y1S, _map.Y2S);
        var scale = (scaleX < scaleY) ? scaleX : scaleY;
        _map.scale = scale;

        // совмещаем точку на экране, в которую надо центрировать дома, с центром дома с учётом рассчитанного масштаба
        _map.x = _map.normalizeX(_map.CX - _map.scale * _cx - _map.container.offset().left);
        _map.y = _map.normalizeY(_map.CY - _map.scale * _cy - _map.container.offset().top);

        console.log("<Area.enter> [qq] moveTo: " + _map.x + ", " + _map.y);
        console.log("<Area.enter> Call moveTo.");
        _map.moveTo(_map.x, _map.y, _map.scale, 400, 'easeInOutCubic');

        setTimeout(function () {
            _map.showAreaInfo(_this._options.area_hash, _this._options.parent_building_hash);
            _map.setMode('view_area');
        }, 400);

        var k;
        if (_map.current_area != null) {
            k = _map.current_area._polygon.parent().attr('class');
            //console.log("k = " + k);
            k = k.split('viewing_area').join("");
            _map.current_area._polygon.parent().attr("class", k);
        }

        k = _this._polygon.parent().attr("class");
        k += " viewing_area";
        _this._polygon.parent().attr("class", k);

        _this.invalidateAnimationMask();

        _map.current_area = _this;
        _map.mark_virgin = false;

    };

    _this.exit = function () {
        _map.current_area = null;
    };

    this.invalidateAnimationMask = function () {
        $("#masked").attr('style', _this._calc_polygon_attr);
    };

    // выдать центр площади в логических координатах
    _this.cx = function () {
        return _cx;
    };
    _this.cy = function () {
        return _cy;
    };

    // рассчитаем bounding box полигона (в логических координатах)
    _this._calcBBox = function () {

        var coords = _this._options.coords;
        var xmin = Number.MAX_VALUE;
        var ymin = Number.MAX_VALUE;
        var xmax = Number.MIN_VALUE;
        var ymax = Number.MIN_VALUE;

        var ix, iy;
        for (var i = 0, c = coords.length; i < c; i += 2) {
            ix = coords[i];
            iy = coords[i + 1];

            //console.log(xmin + " VS " + ix);
            xmin = (ix < xmin) ? ix : xmin;
            ymin = (iy < ymin) ? iy : ymin;

            xmax = (ix > xmax) ? ix : xmax;
            ymax = (iy > ymax) ? iy : ymax;
        }


        _bbox = {
            xmin: xmin,
            ymin: ymin,
            xmax: xmax,
            ymax: ymax
        };

        _cx = xmin + (xmax - xmin) / 2;
        _cy = ymin + (ymax - ymin) / 2;

        console.log("<Area._calcBBox> " +
            //xmin + "," + ymin + "; " + xmax + "," + ymax +
        "; center logical: " + _cx + "," + _cy + ", center screen: " + _map.rightX(_cx) + ", " + _map.rightY(_cy));
    };

    _this._mouse_in = function () {
        //console.log('<Area._mouse_in>');
        //console.log(_this._polygon);
        _this._polygon.attr('class', 'hover');
    };

    _this._mouse_out = function () {
        //console.log('<Area._mouse_out>');
        _this._polygon.attr('class', '');
    };

    _this._calc_polygon_attr = function () {
        var res = "";

        var coords = _this._options["coords"];
        var ix, iy;
        for (var i = 0, c = coords.length; i < c; i += 2) {
            ix = _map.scale * coords[i];
            iy = _map.scale * coords[i + 1];
            res += ix + "px " + iy + "px,"
        }

        //console.log("<Area._calc_polygon_attr> res = " + res);
        res = res.slice(0, res.length - 1);
        res = "-webkit-clip-path:polygon(" + res + ")";
        return res;

    }

}

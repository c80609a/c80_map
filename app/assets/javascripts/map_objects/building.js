"use strict";

function Building() {

    var _map = null;
    var _this = this;
    var _options = null;
    var _polygon = null;


    // экранные координаты левой верхней точки, куда надо вписать полигон здания
    //var _left_page_x = 342;
    //var _left_page_y = 65;

    // bounding box полигона (в логических координатах)
    var _bbox = null;

    // центр полигона (в логических координатах)
    var _cx = null;
    var _cy = null;

    var _image_bg = null;
    var _image_overlay = null;

    var _zoomToMe = function () {

        /* рассчитаем масштаб, при котором можно вписать прямоугольник дома в прямоугольник рабочей области */

        var scaleX = _map.calcScale(_bbox.xmin, _bbox.xmax, _map.X1, _map.X2);
        var scaleY = _map.calcScale(_bbox.ymin, _bbox.ymax, _map.Y1, _map.Y2);
        //console.log("<Building.enter> scaleX = " + scaleX + ", scaleY = " + scaleY);

        var scale = (scaleX < scaleY) ? scaleX : scaleY;
        //var selfX = _map.calcCoord(scale, _map.X1, _bbox.xmin);
        //var selfY = _map.calcCoord(scale, _map.Y1, _bbox.ymin);

        _map.scale = scale;
        //_map.x = selfX;
        //_map.y = selfY;

        /* по-отдельности */

        //var scaleX = _map.calcScale(_bbox.xmin, _bbox.xmax, _map.X1, _map.X2);
        //console.log("<Building.enter> scaleX = " + scaleX);
        //var selfX = _map.calcCoord(scaleX, _map.X1, _bbox.xmin);
        //_map.scale = scaleX;
        //_map.x = selfX;

        //var scaleY = _map.calcScale(_bbox.ymin, _bbox.ymax, _map.Y1, _map.Y2);
        //console.log("<Building.enter> scaleY = " + scaleY);
        //var selfY = _map.calcCoord(scaleY, _map.Y1, _bbox.ymin);
        //_map.scale = scaleY;
        //_map.y = selfY;

        // совмещаем точку на экране, в которую надо центрировать дома, с центром дома с учётом рассчитанного масштаба
        // или, другими словами, перегоняем логические координаты в систему координат экрана
        _map.x = _map.normalizeX(_map.CX - _map.scale * _cx - _map.container.offset().left);
        _map.y = _map.normalizeY(_map.CY - _map.scale * _cy - _map.container.offset().top);

        //console.log("<Building.enter> [qq] moveTo: " + _map.x + ", " + _map.y);
        _map.moveTo(_map.x, _map.y, _map.scale, 400, 'easeInOutCubic');
    };

    _this.init = function (options, link_to_map) {
        console.log("<Building.init>");

        _map = link_to_map;
        _options = options;
        _polygon = Polygon.createFromSaved(options, false, _map);
        _polygon.building = _this;

        _this._calcBBox();
    };

    _this.enter = function () {
        //console.log("<Building.enter>");
        //console.log(_options);

        _zoomToMe();


        setTimeout(function () {
            _image_overlay = _map.draw_child_bg_image(_options.img.overlay.src, 'building', true);
            _image_bg = _map.draw_child_bg_image(_options.img.bg.src, 'building');
            _map.setMode('view_building');
            _map.showBuildingInfo(_options.building_hash);
            _map.draw_childs(_options.childs, _options.building_hash);
        }, 400);

        _map.svgRemoveAllNodes();

        _map.current_building = _this;
        _map.mark_virgin = false;

    };

    _this.exit = function () {
        _image_bg.remove();
        _image_overlay.remove();
        _image_bg = null;
        _image_overlay = null;
        _zoomToMe();
        _map.current_building = null;
    };

    // выдать центр дома в логических координатах
    _this.cx = function () {
        return _cx;
    };
    _this.cy = function () {
        return _cy;
    };

    // рассчитаем bounding box полигона (в логических координатах)
    _this._calcBBox = function () {

        var coords = _options.coords;
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

        console.log("<Building._calcBBox> " +
            //xmin + "," + ymin + "; " + xmax + "," + ymax +
        "; center logical: " + _cx + "," + _cy + ", center screen: " + _map.rightX(_cx) + ", " + _map.rightY(_cy));
    };

    // при редактировании здания (т.е. изменении полигонов и holer-ов площадей)
    // необходимо, чтобы оверлейный слой с колоннами не мешал кликам мышки
    // добраться до слоя с svg
    // эти методы для этого имплементированы
    this.changeOverlayZindex = function () {
        _image_overlay.css('z-index','1');
    };
    this.resetOverlayZindex = function () {
        _image_overlay.css('z-index','3');
    };

}

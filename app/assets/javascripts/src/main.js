"use strict";

var InitMap = function () {

    // - to delete start -----------------------------------------------------------------------------------------------------------------------
    var scale = 0.599999;

    var window_height = $(window).height() - 200;
    if (window_height < 400) window_height = 400;

    var window_width = $(window).width();
    var image_width = MAP_WIDTH * scale;
    var image_height = MAP_HEIGHT * scale;

    var x = (window_width - image_width)/2;
    var y = (window_height - image_height)/2;
    // - to delete end -----------------------------------------------------------------------------------------------------------------------

    $('#map_wrapper').beMap(
        {
            source:LOCS_HASH,
            scale: scale,
            x: x,
            y: y,
            mapwidth: MAP_WIDTH,
            mapheight: MAP_HEIGHT,
            height: window_height
        }
    );

};

var clog = function () {
    //console.log(arguments);
};

(function () {

    var Map = function () {
        var self = this;

        self.debug = true;
        self.o = {
            source: 'locations.json', // data
            height: 400,    // viewbox height, pixels
            mapwidth: 100,   // actual image size, in pixels
            mapheight: 100,
            mapfill: true,
            zoom: true,
            zoombuttons: true,
            maxscale: 1,
            fitscale: 0.51,
            skin: '',         // css class name
            scale: 1,
            x: 0,
            y: 0
        };
        self.state = null;
        self.svg = null;
        self.svg_overlay = null;
        self.container = null;
        self.mode = 'viewing';
        self.setMode = null;
        self.selected_area = null;
        self.new_area = null;
        self.events = [];
        self.edit_type = null;
        self.new_button_klass = null;
        self.edit_button_klass = null;
        self.complete_creating_button_klass = null;
        self.back_to_map_button_klass = null;
        self.current_building = null;
        self.current_area = null;
        self.is_draw = false;

        // true, если:
        //- юзер не кликал по кнопкам zoom
        //- юзер не делал drag-n-drop
        //- юзер не в здании и не в площади
        self.mark_virgin = true;

        self.init = function (el, params) {
            // extend options
            self.o = $.extend(self.o, params);

            self.x = self.o.x;
            self.y = self.o.y;
            self.scale = self.o.scale;

            self.el = el.addClass('melem mloading').addClass(self.o.skin).height(self.o.height);

            // Disable modules when landmark mode is active
            /*if (self.o.landmark) {
             self.o.sidebar = false;
             self.o.zoombuttons = false;
             self.o.deeplinking = false;
             }*/

            if (typeof self.o.source === 'string') {
                // Loading .json file with AJAX
                $.getJSON(self.o.source, function (data) { // Success
                    initProcessData(data);
                    self.el.removeClass('mloading');
                    //setTimeout(invalidateZoom,1000);

                }).fail(function () { // Failure: couldn't load JSON file, or it is invalid.
                    console.error('Couldn\'t load map data. (Make sure you are running the script through a server and not just opening the html file with your browser)');
                    self.el.removeClass('mloading').addClass('merror');
                    alert('Data file missing or invalid!');
                });
            }
            else {
                // Inline json object
                initProcessData(self.o.source);
                self.el.removeClass('mloading');
            }


            return self;


        };

        var initProcessData = function (data) {

            self.data = data;

            //var nrlevels = 0;
            //var shownLevel;

            self.container = $('.mcontainer'); //$('<div></div>').addClass('mcontainer').appendTo(self.el);
            self.map = self.container.find('.mmap'); //$('<div></div>').addClass('mmap').appendTo(self.container);
            if (self.o.zoom) self.map.addClass('mapplic-zoomable');
            self.map_layers = self.map.find('.layers');
            self.map_overlay_layers = self.map.find('.overlay_layers');

            self.svg = $("#svg");
            self.svg_overlay = $('#svg_overlay');
            //$('<svg></svg>')
            //.attr('xmlns','http://www.w3.org/2000/svg')
            //.attr('version','1.2')
            //.attr('baseProfile','tiny')
            //.attr('id','svg')
            //.appendTo(self.map);

            self.levelselect = $('<select></select>').addClass('mlevels_select');

            self.container.css('width', '100%'); // if (!self.o.sidebar)

            self.contentWidth = parseInt(data.mapwidth);
            self.contentHeight = parseInt(data.mapheight);

            self.hw_ratio = data.mapheight / data.mapwidth;

            self.map.css({
                'width': data.mapwidth,
                'height': data.mapheight
            });

            // Create new map layer
            var layer = $('<div></div>').addClass('mlayer').addClass(data["object_type"]).appendTo(self.map_layers); // .hide()
            $('<img>').attr('src', data["img"]).addClass('mmap-image').appendTo(layer);

            // Zoom buttons
            if (self.o.zoombuttons) {
                self.zoombuttons = new ZoomButtons();
                self.zoombuttons.init({height: self.o.height}, self);
                //if (!self.o.clearbutton) self.zoombuttons.el.css('bottom', '0');
            }

            var sc = new StateController();
            sc.init(self);
            self.setMode = sc.setMode;

            // Admin buttons
            $.ajax({
                url: '/ajax/map_edit_buttons',
                type: 'POST',
                dataType: 'script',
                data: {
                    div_css_selector: '#container_buttons .mzoom_buttons'
                }
            }).done(function () {
                clog('<ajax.done>');

                self.edit_button_klass = new EditButton();
                self.edit_button_klass.init('.mapplic-edit-button', self);

                var e = new NewButton();
                e.init('.mapplic-new-button', self);
                self.new_button_klass = e;

                e = new CancelCreatingButton();
                e.init("#cancelCreating", self);

                e = new CompleteCreatingButton();
                e.init("#completeCreating", self);

            });

            // Controls
            initAddControls();

            self.draw_childs(data["childs"]);
            self.state = data;

            self.ivalidateViewArea();

            // Browser resize
            $(window).resize(function () {

                // Mobile
                //if ($(window).width() < 668) {
                //    self.container.height($(window).height() - 66);
                //}
                //else self.container.height('100%');

                // Контейнер с картой должен слушать изменения габаритов окна и подгоняться по высоте
                var window_height = $(window).height() - 200;
                if (window_height < 400) window_height = 400;
                self.el.height(window_height + "px");

                // ------------------------------------------------------------------------------------------------------------------------

                // если пользователь еще не взаимодействовал с картой или вне здания\площади
                // вписываем картинку карты в главный прямоугольник карты
                // т.е. меняем масштаб
                if (self.mark_virgin) {
                    // рассчитаем масштаб, при котором можно вписать главный прямоугольник карты в прямоугольник рабочей области
                    var scaleX = self.calcScale(self.o.mapwidth*0.05, self.o.mapwidth *.95, self.X10, self.X20);
                    var scaleY = self.calcScale(self.o.mapheight*0.05, self.o.mapheight *.95, self.Y10, self.Y20);
                    var scale = (scaleX < scaleY) ? scaleX : scaleY;
                    self.scale = scale;
                }

                // совмещаем точку на экране, в которую надо центрировать карту,
                // с центром карты (или с центром здания\площади, в котором находится юзер),
                // с учётом рассчитанного масштаба

                // если пользователь еще не взаимодействовал с картой или вне здания\площади,
                // то фокусируемся на центр карты,
                // иначе - фокусируемся на центр здания\площади, в котором находится пользователь и
                // фокус сдвигаем, с учётом того, что сбоку открыта панель с информацией о здании

                // NOTE-25::хардкод
                // логические координаты - геометрический центр картинки
                var cx = self.o.mapwidth/2;
                var cy = self.o.mapheight/2;
                var mark_do_moving = false;

                if (self.current_building) {
                    cx = self.current_building.cx();
                    cy = self.current_building.cy();
                    mark_do_moving = true;
                } else if (self.current_area) {
                    cx = self.current_area.cx();
                    cy = self.current_area.cy();
                    mark_do_moving = true;
                } else if (self.mark_virgin) {
                    mark_do_moving = true;
                }

                if (mark_do_moving) {
                    self.x = self.normalizeX(self.CX - self.scale * cx - self.container.offset().left);
                    self.y = self.normalizeY(self.CY - self.scale * cy - self.container.offset().top);
                    clog("<Map.initProcessData> call moveTo");
                    self.moveTo(self.x, self.y, self.scale, 100);
                }

                // ------------------------------------------------------------------------------------------------------------------------


                self.ivalidateViewArea();

            }).resize();

        };

        // Drag & drop
        var __onDragNdropMouseMove = function (event) {
            self.dragging = true;

            var map = self.map;
            var x = event.pageX - map.data('mouseX') + self.x;
            var y = event.pageY - map.data('mouseY') + self.y;

            x = self.normalizeX(x);
            y = self.normalizeY(y);

            clog("<Map.mousemove> x = " + x + "; y = " + y);
            clog("<Map.mousemove> Call moveTo.");
            self.moveTo(x, y);
            map.data('lastX', x);
            map.data('lastY', y);
        };
        var __onDragNdropMouseUp = function (event) {
            clog("<mouseup> self.mode = " + self.mode);

            var map = self.map;

            // * [X] реализовать условие "если dnd был маленький, то делать вызов onClick":
            // защищаемся от "дрожания рук во время клика", когда мизерное движение в сотую доли
            // секунды во время совершения клика заставляют программу думать, что это был drag-n-drop
            var sx = map.data('startX');
            var sy = map.data('startY');
            var dx = sx - self.x;
            var dy = sy - self.y;
            var d = Math.sqrt(dx*dx + dy*dy);
            var is_enough_for_dnd = d > 10;

            // если это в самом деле был drag\n\drop
            if (self.dragging && is_enough_for_dnd) {

                self.x = map.data('lastX');
                self.y = map.data('lastY');
            }

            // иначе - пытаемся выяснить, в каком режиме находимся
            else {

                var p;

                /* если находимся в режиме просмотра всей карты - входим в здание */
                if (self.mode == 'viewing') {
                    //clog($(event.target).parent()[0].obj.building);

                    // добираемся до объекта класса Здание, который обслуживает полигон
                    p = $(event.target).parent()[0];
                    if (p.obj && p.obj.building) {
                        var building = p.obj.building;
                        clog("<mouseup> Входим в здание.");
                        building.enter();
                    }

                }

                /* если находимся в режиме рисования - рисуем */
                else if (self.mode == 'creating') {

                    // и если ещё пока не начали рисовать (т.е. если это первый клик)
                    if (!self.is_draw) {

                        var xx = self.rightX(event.pageX);
                        var yy = self.rightY(event.pageY);
                        //clog("<mouseup> " + xx + "; " + yy);

                        self.new_area = new Polygon(xx, yy, false, self);

                        //self.addEvent(self.el[0], 'mousemove', self.new_area.onDraw)
                        self.addEvent(self.el[0], 'mousemove', function (e) {
                            var _n_f = self.new_area;
                            var right_angle = !!e.shiftKey; //e.shiftKey ? true : false;

                            _n_f.dynamicDraw(self.rightX(e.pageX), self.rightY(e.pageY), right_angle);
                        })
                            //.addEvent(self.new_area.helpers[0].helper, 'click', self.new_area.onDrawStop)
                            //.addEvent(self.el[0], 'click', self.new_area.onDrawAddPoint);
                            .addEvent(self.el[0], 'click', function (e) {

                                // если кликнули в первую точку фигуры - заканчиваем рисование
                                var $et = $(e.target);
                                var $h = $(self.new_area.helpers[0].helper);
                                if ($et.attr('x') == $h.attr('x') && $et.attr('y') == $h.attr('y')) {
                                    //self.new_area.onDrawStop();
                                    self.onDrawStop();
                                    return;
                                }

                                var x = self.rightX(e.pageX),
                                    y = self.rightY(e.pageY),
                                    _n_f = self.new_area;

                                if (e.shiftKey) {
                                    var right_coords = _n_f.right_angle(x, y);
                                    x = right_coords.x;
                                    y = right_coords.y;
                                }
                                _n_f.addPoint(x, y);
                            });
                        //    .addEvent(document, 'keydown', new_area.onDrawStop)
                    }
                }

                /* если находимся в режиме просмотра здания - входим в площадь*/
                else if (self.mode == 'view_building' || self.mode == 'view_area') {

                    // добираемся до объекта класса Area, который обслуживает полигон
                    p = $(event.target).parent()[0];
                    //clog($(event.target).parent()[0].obj.area_hash);

                    if (p.obj && p.obj.area) {
                        var area = p.obj.area;
                        clog("<mouseup> Входим в площадь.");
                        area.enter();
                    }

                }
            }

            self.map.off('mousemove');
            $(document).off('mouseup');

            map.removeClass('mdragging');
        };
        var onDragNdrop = function (event) {
            clog("<mousedown> mode = " + self.mode);
            clog(event);

            var map = self.map;

            // если в данный момент не редактируем фигуру (т.е. не двигаем вершину фигуры)
            if (self.edit_type == null) {
                self.dragging = false;
                map.stop();

                map.data('mouseX', event.pageX);
                map.data('mouseY', event.pageY);
                map.data('lastX', self.x);
                map.data('lastY', self.y);

                map.data('startX',self.x);
                map.data('startY',self.y);

                map.addClass('mdragging');

                self.map.on('mousemove', __onDragNdropMouseMove);
                $(document).on('mouseup', __onDragNdropMouseUp);
            }
        };
        var onSvgMousedown = function (e) {

            clog("<onSvgMousedown> self.mode = " + self.mode);

            if (self.mode === 'editing' || self.mode === "edit_building" || self.mode === 'edit_area') {
                if (e.target.parentNode.tagName === 'g') {
                    clog("<onSvgMousedown> e = ");
                    //clog(e.pageX);
                    //clog("<mouseDown> e.target.parentNode.tagName = " + e.target.parentNode.tagName);
                    //clog(e.target);
                    //info.unload();

                    // запомним ссылку на "выбранную" область
                    self.selected_area = e.target.parentNode.obj;

                    //app.deselectAll();

                    // поменяем внешний вид - добавим класс .selected
                    self.selected_area.select();

                    // запомним начальные координаты кликаы
                    self.selected_area.delta = {
                        'x': e.pageX,
                        'y': e.pageY
                    };

                    // если взаимодействуем с вершиной
                    if (utils.hasClass(e.target, 'helper')) {
                        var helper = e.target;
                        //clog("<mouseDown> helper.action = ");
                        //clog(helper.action);
                        self.edit_type = helper.action; // pointMove

                        if (helper.n >= 0) { // if typeof selected_area == polygon
                            self.selected_area.selected_point = helper.n;
                        }

                        self.addEvent(self.el[0], 'mousemove', self.onEdit)
                            //self.addEvent(self.el[0], 'mousemove', self.selected_area.onEdit)
                            .addEvent(self.el[0], 'mouseup', self.onEditStop);
                    }

                    else if (e.target.tagName === 'rect' || e.target.tagName === 'circle' || e.target.tagName === 'polygon') {
                        self.edit_type = 'move';
                        self.addEvent(self.el[0], 'mousemove', self.onEdit)
                            .addEvent(self.el[0], 'mouseup', self.onEditStop);
                    }
                } else {
                    //app.deselectAll();
                    //info.unload();
                }
            }
        };

        var initAddControls = function () {

            // IE drag fix
            document.ondragstart = function () {
                return false;
            };

            self.svg.on('mousedown', onSvgMousedown);
            self.svg.on('mousedown', onDragNdrop);
            self.svg_overlay.on('mousedown', onDragNdrop);

            /* Disable image dragging */
            self.el[0].addEventListener('dragstart', function (e) {
                e.preventDefault();
            }, false);

            self.back_to_map_button_klass = new BackToMapButton();
            self.back_to_map_button_klass.init("#container_buttons", self);

        };

        // какой должен быть минимальный масштаб, чтобы вписать отрезок [min,max] в отрезок [p1,p2]
        self.calcScale = function (min, max, p1, p2) {
            clog("<calcScale> [" + min + "," + max + '] to [' + p1 + "," + p2 + "]");
            return (p2 - p1) / (max - min);
        };

        self.calcCoord = function (scale, pageC, logicC) {
            return pageC - scale * logicC;
        };

        /* --- ivalidateViewArea BEGIN --------------------------------------------------------------------------------- */

        var _$m = $("#map_wrapper");
        var _$b = $('footer .container');
        var $building_info = $('.building_info');
        var $area_order_button = $('.area_order_button');
        var $container_buttons = $('#container_buttons');
        var _is_debug_drawn = true;

        self.ivalidateViewArea = function () {
            //clog('<init> _$b.offset().left = ' + _$b.offset().left);

            // рассчитаем "константы" - прямоугольник, в который надо вписывать картинки зданий при входе в них
            self.X1 = _$b.offset().left + 100;
            self.X1S = _$b.offset().left + 200;
            self.Y1 = 73;
            self.Y1S = 140;
            self.X2 = self.X1 + _$b.width() * .5;
            self.X2S = self.X1 + _$b.width() * .4;
            self.X3 = self.X1 + _$b.width() - 100;
            self.Y2 = _$m.height() - 20;
            self.Y2S = _$m.height() - 80;
            self.CX = (self.X2 - self.X1) / 2 - 2 + self.X1;
            self.CY = (self.Y2 - self.Y1) / 2 - 2 + self.Y1;

            self.X10 = _$b.offset().left + 15;
            self.X20 = self.X10 + _$b.width();
            self.Y10 = 73;
            self.Y20 = _$m.height();

            // позиционируем элементы
            $building_info.css("left", self.X2 + "px");
            $area_order_button.css("left", self.X2 + "px");
            if (self.container) $container_buttons.css("margin-top", (self.container.height() -10) + "px");

            // DEBUG
            if (self.debug) {

                if (!_is_debug_drawn) {
                    _is_debug_drawn = true;

                    var style = "display:block;position:absolute;background-color:#00ff00;opacity:0.4;";
                    var style_x = style + "width:1px;height:800px;top:0;left:{X}px;";
                    var style_y = style + "width:3000px;height:1px;left:0;top:{Y}px;";
                    var style_dot = style + 'width:4px;height:4px;left:{X}px;top:{Y}px;';

                    var to_draw = [
                        {x: self.X10},
                        {x: self.X20},
                        {y: self.Y10},
                        {y: self.Y20},
                        {x: self.CX},
                        {y: self.CY},
                    ];


                    var i, istyle, xx, yy, ip;
                    for (i = 0; i < to_draw.length; i++) {
                        ip = to_draw[i];

                        if (ip.x != undefined) {
                            istyle = style_x.split("{X}").join(ip.x);
                        } else if (ip.y != undefined) {
                            istyle = style_y.split("{Y}").join(ip.y);
                        }

                        _$m.append($("<div style=" + istyle + "></div>"));
                    }

                }

            }

        };

        /* --- ivalidateViewArea END ----------------------------------------------------------------------------------- */

        self.addEvent = function (target, eventType, func) {
            self.events.push(new AppEvent(target, eventType, func));
            return self;
        };

        self.removeAllEvents = function () {
            utils.foreach(self.events, function (x) {
                x.remove();
            });
            self.events.length = 0;
            self.edit_type = null;
            return this;
        };

        self.addNodeToSvg = function (node, is_overlay) {
            if (is_overlay) {
                self.svg_overlay[0].appendChild(node);
            } else {
                self.svg[0].appendChild(node);
            }
            return self;
        };

        self.svgRemoveAllNodes = function () {
            self.svg.empty();
        };

        self.draw_childs = function (childs, parent_hash) {
            //clog("<Map.draw_childs>");

            //var ip;
            var iobj;
            var ib, id, ia;
            for (var i = 0; i < childs.length; i++) {
                iobj = childs[i];

                switch (iobj["object_type"]) {
                    case 'building':
                        ib = new Building();
                        ib.init(iobj,self);
                        break;
                    case 'dot':
                        id = new Dot();
                        id.init(iobj,self);
                        break;
                    case 'area':
                        ia = new Area();
                        ia.init(iobj, parent_hash, self);
                        break;
                }
                //ip = Polygon.createFromSaved(iobj);
                //utils.id('svg').appendChild(ip.g);
            }
        };

        //
        self.draw_child_bg_image = function (img_src, obj_type, is_overlay) {
            var t;
            if (is_overlay == true) {
                t = self.map_overlay_layers;
            } else {
                t = self.map_layers;
            }
            // Create new map layer
            var layer = $('<div></div>').addClass('mlayer').addClass(obj_type).appendTo(t); // .hide()
            $('<img>').attr('src', img_src).addClass('mmap-image').appendTo(layer);

            return layer;
        };

        self.onEdit = function (e) {

            //clog("<Polygon.prototype.onEdit> _s_f = " + _s_f);
            //clog("<Polygon.prototype.onEdit> e = ");
            //clog(_s_f);
            //clog(e.pageX);

            var selected_area = self.selected_area;
            var edit_type = self.edit_type;
            //clog("<Polygon.prototype.onEdit> edit_type = " + edit_type);

            selected_area.dynamicEdit(selected_area[edit_type](e.pageX - selected_area.delta.x, e.pageY - selected_area.delta.y));
            selected_area.delta.x = e.pageX;
            selected_area.delta.y = e.pageY;
        };

        self.onDrawStop = function (e) {
            clog("<Polygon.onDrawStop>");

            var _n_f = self.new_area;
            //if (e.type == 'click' || (e.type == 'keydown' && e.keyCode == 13)) { // key Enter
            if (_n_f.params.length >= 6) { //>= 3 points for polygon
                _n_f.polyline = _n_f.polygon;
                _n_f.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                _n_f.g.replaceChild(_n_f.polygon, _n_f.polyline);
                _n_f.setCoords(_n_f.params).deselect();
                delete(_n_f.polyline);

                self.removeAllEvents();
                self.new_area = null;
                self.is_draw = false;
                self.complete_creating_button_klass.onClick();
                //    .setIsDraw(false)
                //    .resetNewArea();
            }
            //}
            //e.stopPropagation();
        };

        self.onEditStop = function (e) {
            //clog("<Polygon.prototype.onEditStop>");
            var _s_f = self.selected_area,
                edit_type = self.edit_type;

            _s_f.setParams(_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y)));

            self.removeAllEvents();
        };

        self.normalizeX = function (x) {
            var minX = self.container.width() - self.contentWidth * self.scale;

            if (minX < 0) {
                if (x > 0) x = 0;
                else if (x < minX) x = minX;
            }
            else x = minX / 2;

            return x;
        };

        self.normalizeY = function (y) {
            var minY = self.container.height() - self.contentHeight * self.scale;

            if (minY < 0) {
                if (y >= 0) y = 0;
                else if (y < minY) y = minY;
            }
            else y = minY / 2;

            return y;
        };

        self.normalizeScale = function (scale) {
            clog('<self.normalizeScale>' + self.o.fitscale);
            if (scale < self.o.fitscale) scale = self.o.fitscale;
            else if (scale > self.o.maxscale) scale = self.o.maxscale;

            if (self.zoombuttons) self.zoombuttons.update(scale);

            return scale;
        };

        self.zoomTo = function (x, y, s, duration, easing, ry) {
            duration = typeof duration !== 'undefined' ? duration : 400;
            ry = typeof ry !== 'undefined' ? ry : 0.5;

            self.scale = self.normalizeScale(self.o.fitscale * s);

            self.x = self.normalizeX(self.container.width() * 0.5 - self.scale * self.contentWidth * x);
            self.y = self.normalizeY(self.container.height() * ry - self.scale * self.contentHeight * y);

            clog("<Map.zoomTo> Call moveTo.");
            self.moveTo(self.x, self.y, self.scale, duration, easing);
        };

        // optimisation
        var __moveToStep = function () {
            //clog(self.map.attr('style'));
            // left: -69.9985px; top: -299.999px;
            // left: [-]{0,1}(\d+\.\d+px);

            var str = self.map.attr('style');
            var rx_left = /left: [-]{0,1}(\d+\.\d+)px;/;
            var rx_top = /top: ([-]{0,1}\d+\.\d+)px;/;
            var match_left = str.match(rx_left);
            var match_right = str.match(rx_top);

            if (match_left != null && match_right != null) {
                var x = -1 * Number(match_left[1]); // ["left: -69.9985px;", "69.9985"]
                var y = -1 * Number(match_right[1]); // ["left: -69.9985px;", "69.9985"]
                var att = x + " " + y + " " + self.contentWidth + " " + self.contentHeight;
                //clog(x + "; y = " + y);
                self.svg.attr('viewBox', att);
                self.svg_overlay.attr('viewBox', att);
            }

        };
        var __moveToTimeout = function () {
            $("#masked").removeClass('hiddn');
        };
        var __moveToAnimate = function () {
            if (self.tooltip) self.tooltip.position();
        };
        
        // x,y - экранные координаты
        self.moveTo = function (x, y, scale, d, easing) {
            clog("<self.moveTo> x = " + x + "; y = " + y + "; scale = " + scale);

            // если подан аргумент scale(масштаб)
            // перемещаемся анимированно
            if (scale !== undefined) {

                // на время движения скрываем слой с полосатой анимацией
                if (self.current_area != null) {
                    $("#masked").addClass('hiddn');
                    setTimeout(__moveToTimeout, d);
                    setTimeout(__moveToStep, d);
                }

                self.map.stop().animate(
                    {
                        'left': x,
                        'top': y,
                        'width': self.contentWidth * scale,
                        'height': self.contentHeight * scale
                    },
                    //{ 'step': __moveToStep },
                    d,
                    easing,
                    __moveToAnimate
                );

            }

            // если не подан аргумент scale(масштаб)
            // перемещаемся без анимации
            else {

                self.map.css({
                    'left': x,
                    'top': y
                });

                var t = (-x) + " " + (-y) + " " + self.contentWidth * self.scale + " " + self.contentHeight * self.scale;
                self.svg.attr('viewBox',t);
                self.svg_overlay.attr('viewBox', t);
            }

            if (self.current_area != null) {
                self.current_area.invalidateAnimationMask();
            }

            //if (self.tooltip) self.tooltip.position();
            //if (self.minimap) self.minimap.update(x, y);
        };

        // показать инфо о здании
        self.showBuildingInfo = function (building_hash) {
            //"building_hash": {
            //    "id": 2,
            //        "title": "Здание 2",
            //        "props": {
            //            "square": "1234 кв.м.",
            //            "square_free": "124 кв. м",
            //            "floor_height": "124 кв. м",
            //            "column_step": "2 м",
            //            "gate_type": "распашные",
            //            "communications": "Интернет, электричество, водоснабжение",
            //            "price": "от 155 руб/кв.м в месяц"
            //    }

            $building_info.find("h2").text(building_hash["title"]);

            var v;
            for (var p in building_hash["props"]) {
                v = building_hash["props"][p];
                $building_info.find("#" + p).find('span').text(v);
            }

            $building_info.find("#square_free").css('height', 'auto');

        };

        // показать инфо о просматриваемой площади
        self.showAreaInfo = function (area_hash, parent_building_hash) {
            //clog(area_hash);

            //"area_hash": {
            //        "id": 2,
            //        "title": "Площадь 2.12",
            //        "is_free": false,
            //        "props": {
            //            "square": "100 кв.м.",
            //            "floor_height": "6 кв. м",
            //            "column_step": "2 м",
            //            "gate_type": "распашные",
            //            "communications": "Интернет, электричество, водоснабжение",
            //            "price": "от 155 руб/кв.м в месяц"
            //    }

            //"building_hash": {
            //        "id": 2,
            //        "title": "Здание 2",
            //        "props": {
            //            "square": "1234 кв.м.",
            //            "square_free": "124 кв. м",
            //            "floor_height": "6 кв. м",
            //            "column_step": "2 м",
            //            "gate_type": "распашные",
            //            "communications": "Интернет, электричество, водоснабжение",
            //            "price": "от 155 руб/кв.м в месяц"
            //    }

            $building_info.find("h2").html("</span>" + area_hash["title"] + "<span style='color:#D0B2B2;'> / " + parent_building_hash["title"]);

            var v;
            for (var p in area_hash["props"]) {
                v = area_hash["props"][p];
                $building_info.find("#" + p).find('span').text(v);
            }

            $building_info.find("#square_free").css('height', '0');

        };

        // перевод экранных координат в логические
        self.rightX = function(x) {
            return (x - self.x - self.container.offset().left) / self.scale;
        };

        self.rightY = function(y) {
            return (y - self.y - self.container.offset().top) / self.scale
        }

    };

    //  Create a jQuery plugin
    $.fn.beMap = function (params) {
        var len = this.length;

        return this.each(function (index) {
            var me = $(this),
                key = 'beMap' + (len > 1 ? '-' + ++index : ''),
                instance = (new Map).init(me, params);
        });
    };

})
(jQuery);
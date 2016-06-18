/* Polygon constructor */
var Polygon = function (x, y, is_overlay, self) {

    this._map = self;
    this._map.is_draw = true;

    this.params = [x, y]; //array of coordinates of polygon points

    this.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    this._map.addNodeToSvg(this.g, is_overlay);
    this.g.appendChild(this.polygon);

    this.g.obj = this;
    /* Link to parent object */

    this.helpers = [ //array of all helpers-rectangles
        new Helper(this.g, this.params[0], this.params[1])
    ];

    this.helpers[0].setAction('pointMove').setCursor('pointer').setId(0);

    this.selected_point = -1;

    this.select().redraw();

    // app.addObject(this); //add this object to array of all objects
};

Polygon.prototype.setCoords = function (params) {
    //console.log(params);
    var coords_values = params.join(' ');
    this.polygon.setAttribute('points', coords_values);
    utils.foreach(this.helpers, function (x, i) {
        x.setCoords(params[2 * i], params[2 * i + 1]);
    });

    return this;
};

Polygon.prototype.setParams = function (arr) {
    this.params = Array.prototype.slice.call(arr);

    return this;
};

Polygon.prototype.addPoint = function (x, y) {
    var helper = new Helper(this.g, x, y);
    helper.setAction('pointMove').setCursor('pointer').setId(this.helpers.length);
    this.helpers.push(helper);
    this.params.push(x, y);
    this.redraw();

    return this;
};

Polygon.prototype.redraw = function () {
    this.setCoords(this.params);

    return this;
};

Polygon.prototype.right_angle = function (x, y) {
    var old_x = this.params[this.params.length - 2],
        old_y = this.params[this.params.length - 1],
        dx = x - old_x,
        dy = -(y - old_y),
        tan = dy / dx; //tangens

    if (dx > 0 && dy > 0) {
        if (tan > 2.414) {
            x = old_x;
        } else if (tan < 0.414) {
            y = old_y;
        } else {
            Math.abs(dx) > Math.abs(dy) ? x = old_x + dy : y = old_y - dx;
        }
    } else if (dx < 0 && dy > 0) {
        if (tan < -2.414) {
            x = old_x;
        } else if (tan > -0.414) {
            y = old_y;
        } else {
            Math.abs(dx) > Math.abs(dy) ? x = old_x - dy : y = old_y + dx;
        }
    } else if (dx < 0 && dy < 0) {
        if (tan > 2.414) {
            x = old_x;
        } else if (tan < 0.414) {
            y = old_y;
        } else {
            Math.abs(dx) > Math.abs(dy) ? x = old_x + dy : y = old_y - dx;
        }
    } else if (dx > 0 && dy < 0) {
        if (tan < -2.414) {
            x = old_x;
        } else if (tan > -0.414) {
            y = old_y;
        } else {
            Math.abs(dx) > Math.abs(dy) ? x = old_x - dy : y = old_y + dx;
        }
    }

    return {
        x: x,
        y: y
    };
};

Polygon.prototype.dynamicDraw = function (x, y, right_angle) {
    var temp_params = [].concat(this.params);

    if (right_angle) {
        var right_coords = this.right_angle(x, y);
        x = right_coords.x;
        y = right_coords.y;
    }

    temp_params.push(x, y);

    this.setCoords(temp_params);

    return temp_params;
};

/*Polygon.prototype.onDraw = function (e) {
    var _n_f = this._map.new_area;
    var right_angle = e.shiftKey ? true : false;

    _n_f.dynamicDraw(this._map.rightX(e.pageX), this._map.rightY(e.pageY), right_angle);
};*/

/*Polygon.prototype.onDrawAddPoint = function (e) {
    //console.log("<Polygon.onDrawAddPoint>");

    //console.log("<Polygon.onDrawAddPoint> e.target = ");
    //console.log(e.target);

    //console.log("<Polygon.onDrawAddPoint> helper[0].helper = ");
    //console.log(this._map.new_area.helpers[0].helper);

    //console.log($(this._map.new_area.helpers[0].helper).attr("x") + "; " + $(e.target).attr("x"));

    //console.log("<Polygon.onDrawAddPoint> e = ");
    //console.log(e);

    // если кликнули в первую точку фигуры - заканчиваем рисование
    var $et = $(e.target);
    var $h = $(this._map.new_area.helpers[0].helper);
    if ($et.attr('x') == $h.attr('x') && $et.attr('y') == $h.attr('y')) {
        this._map.new_area.onDrawStop();
        return;
    }

    var x = this._map.rightX(e.pageX),
        y = this._map.rightY(e.pageY),

        _n_f = this._map.new_area;

    if (e.shiftKey) {
        var right_coords = _n_f.right_angle(x, y);
        x = right_coords.x;
        y = right_coords.y;
    }
    _n_f.addPoint(x, y);
};*/

/*Polygon.prototype.onDrawStop = function (*//*e*//*) {
    console.log("<Polygon.onDrawStop>");

    var _n_f = this._map.new_area;
    //if (e.type == 'click' || (e.type == 'keydown' && e.keyCode == 13)) { // key Enter
    if (_n_f.params.length >= 6) { //>= 3 points for polygon
        _n_f.polyline = _n_f.polygon;
        _n_f.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        _n_f.g.replaceChild(_n_f.polygon, _n_f.polyline);
        _n_f.setCoords(_n_f.params).deselect();
        delete(_n_f.polyline);

        this._map.removeAllEvents();
        this._map.new_area = null;
        this._map.is_draw = false;
        this._map.complete_creating_button_klass.onClick();
        //    .setIsDraw(false)
        //    .resetNewArea();
    }
    //}
    //e.stopPropagation();
};*/

Polygon.prototype.move = function (x, y) { //offset x and y
    var temp_params = Object.create(this.params);

    for (var i = 0, count = this.params.length; i < count; i++) {
        //i % 2 ? this.params[i] += y : this.params[i] += x;
        if (i % 2) {
            this.params[i] = Number(this.params[i]) + y;
        } else {
            this.params[i] = Number(this.params[i]) + x;
        }
    }

    return temp_params;
};

Polygon.prototype.pointMove = function (x, y) { //offset x and y
    this.params[2 * this.selected_point] += x;
    this.params[2 * this.selected_point + 1] += y;

    return this.params;
};

Polygon.prototype.dynamicEdit = function (temp_params) {
    this.setCoords(temp_params);

    return temp_params;
};

/*Polygon.prototype.onEdit = function (e) {
    var selected_area = this._map.selected_area;

    //console.log("<Polygon.prototype.onEdit> _s_f = " + _s_f);
    //console.log("<Polygon.prototype.onEdit> e = ");
    //console.log(_s_f);
    //console.log(e.pageX);

    var edit_type = this._map.edit_type;
    //console.log("<Polygon.prototype.onEdit> edit_type = " + edit_type);

    selected_area.dynamicEdit(selected_area[edit_type](e.pageX - selected_area.delta.x, e.pageY - selected_area.delta.y));
    selected_area.delta.x = e.pageX;
    selected_area.delta.y = e.pageY;
};*/

/*Polygon.prototype.onEditStop = function (e) {
    //console.log("<Polygon.prototype.onEditStop>");
    var _s_f = this._map.selected_area,
        edit_type = this._map.edit_type;

    _s_f.setParams(_s_f.dynamicEdit(_s_f[edit_type](e.pageX - _s_f.delta.x, e.pageY - _s_f.delta.y)));

    this._map.removeAllEvents();
};*/

Polygon.prototype.remove = function () {
    app.removeNodeFromSvg(this.g);
};

Polygon.prototype.select = function () {
    utils.addClass(this.polygon, 'selected');

    return this;
};

Polygon.prototype.deselect = function () {
    utils.removeClass(this.polygon, 'selected');

    return this;
};

Polygon.prototype.toString = function () { //to html map area code
    for (var i = 0, count = this.params.length, str = ''; i < count; i++) {
        str += this.params[i];
        if (i != count - 1) {
            str += ', ';
        }
    }
    return '<area shape="poly" coords="'
        + str
        + '"'
        + (this.href ? ' href="' + this.href + '"' : '')
        + (this.alt ? ' alt="' + this.alt + '"' : '')
        + (this.title ? ' title="' + this.title + '"' : '')
        + ' />';
};

Polygon.createFromSaved = function (params, is_overlay, self) {
    //console.log("<Polygon.createFromSaved>");

    var coords = params.coords,
        area = new Polygon(coords[0], coords[1], is_overlay, self);

    for (var i = 2, c = coords.length; i < c; i += 2) {
        area.addPoint(coords[i], coords[i + 1]);
    }

    area.polyline = area.polygon;
    area.polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    area.g.replaceChild(area.polygon, area.polyline);
    area.setCoords(area.params).deselect();
    delete(area.polyline);

    self.is_draw = false;
    self.new_area = null;

    return area;

};

Polygon.prototype.toJSON = function () {
    return {
        type: 'polygon',
        coords: this.params,
        href: this.href,
        alt: this.alt,
        title: this.title
    }
};

'use strict';

const PaintType = {
  BRUSH: 0,
  LINE: 1,
  CIRCLE: 2,
  CIRCLE_FILL: 3
};

const PaintTypeMap = {
  'brush': PaintType.BRUSH,
  'line': PaintType.LINE,
  'circle': PaintType.CIRCLE,
  'circleFill': PaintType.CIRCLE_FILL
};

const drawFuncList = (canvasModel, ctx) => {
  return {
    begin: (e) => {
      const rect = e.target.getBoundingClientRect();
      const beforeX = e.clientX - rect.left;
      const beforeY = e.clientY - rect.top;
      canvasModel.draw(beforeX, beforeY, ctx.getImageData(0, 0, canvasModel.width, canvasModel.height));
    },
    beforeDraw: (e) => {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      canvasModel.moveDraw(x, y, null);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    beforeDrawTool: (e) => {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      canvasModel.moveDraw(x, y, ctx.getImageData(0, 0, canvasModel.width, canvasModel.height));
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    free: () => {
      ctx.putImageData(canvasModel.beforeImg, 0, 0);
      // ctx.moveTo(canvasModel.beforeX, canvasModel.beforeY);
      ctx.lineTo(canvasModel.x, canvasModel.y);
      ctx.stroke();
      canvasModel.moveTo();


      canvasModel._beforeImg =  ctx.getImageData(0, 0, canvasModel.width, canvasModel.height);
    },
    line: () => {
      ctx.putImageData(canvasModel.beforeImg, 0, 0);
      ctx.moveTo(canvasModel.beforeX, canvasModel.beforeY);
      ctx.lineTo(canvasModel.x, canvasModel.y);
      ctx.stroke();
    },
    circle: () => {
      ctx.putImageData(canvasModel.beforeImg, 0, 0);
      const dx = canvasModel.beforeX - canvasModel.x;
      const dy = canvasModel.beforeY - canvasModel.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      ctx.arc(canvasModel.beforeX, canvasModel.beforeY, r, 0, 2 * Math.PI, false);
      ctx.stroke();
    },
    circleFill: () => {
      ctx.putImageData(canvasModel.beforeImg, 0, 0);
      const dx = canvasModel.beforeX - canvasModel.x;
      const dy = canvasModel.beforeY - canvasModel.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      ctx.arc(canvasModel.beforeX, canvasModel.beforeY, r, 0, 2 * Math.PI, false);
      ctx.fill();
    },
    finish: (e) => {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      canvasModel.endDraw(x, y, ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
    }
  }
};

class Model {
  constructor() {
    this._attributeList = {};
    this._handlerList = {};
  }

  get(key) {
    return this._attributeList[key];
  }

  set(key, value) {
    this._attributeList[key] = value;
  }

  on(event, handler) {
    (this._handlerList[event] || (this._handlerList[event] = [])).push(handler);
  }

  _trigger(event, argList) {
    const list = this._handlerList[event];
    if (list) {
      list.forEach(handler => {
        handler(argList);
      });
    }
  }
}

class View {
  constructor() {
  }

  _setEl(elList) {
    for (let key in elList) {
      if (elList.hasOwnProperty(key)) {
        this[elList[key]] = document.getElementById(key);
      }
    }
  }

  _setEvent(eventList) {
    for (let key in eventList) {
      if (eventList.hasOwnProperty(key)) {
        const callback = eventList[key];
        const keys = key.split(' ');
        document.getElementById(keys[1]).addEventListener(keys[0], (e) => {
          callback.call(this, e);
        });
      }
    }
  }

  _setAppEvent(model, eventList) {
    for (let key in eventList) {
      if (eventList.hasOwnProperty(key)) {
        const callback = eventList[key];
        model.on(key, argList => {
          callback.call(this, argList);
        });
      }
    }
  }
}

class CanvasModel extends Model {
  constructor(width, height) {
    super();
    this._width = width;
    this._height = height;

    this._drawing = false;
    this._beforeImg = null;
    this._beforeX = 0;
    this._beforeY = 0;
    this._x = 0;
    this._y = 0;

    this._paintType = PaintType.BRUSH;
    this._lineWidth = 1;
    this._color = '#000';
    this._opacity = 1.0;
    this._lineCap = 'round';
    this._lineJoin = 'round';
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get beforeImg() {
    return this._beforeImg;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get beforeX() {
    return this._beforeX;
  }

  get beforeY() {
    return this._beforeY;
  }

  get paintType() {
    return this._paintType;
  }

  get lineWidth() {
    return this._lineWidth;
  }

  get color() {
    return this._color;
  }

  get opacity() {
    return this._opacity;
  }

  get lineCap() {
    return this._lineCap;
  }

  get lineJoin() {
    return this._lineJoin;
  }

  draw(beforeX, beforeY, img) {
    this._drawing = true;
    this._beforeX = beforeX;
    this._beforeY = beforeY;
    this._beforeImg = img;
  }

  moveDraw(x, y) {
    if (!this._drawing) return;
    this._x = x;
    this._y = y;

    this._trigger('draw');
  }

  moveTo() {
    this._beforeX = this._x;
    this._beforeY = this._y;
  }

  endDraw(x, y, img) {
    this._drawing = false;

    this._beforeImg = img;
    this._trigger('endDraw');
  }

  setColor(color) {
    this._color = color;
    this._trigger('changeColor');
  }

  setLineWidth(lineWidth) {
    this._lineWidth = lineWidth;
    this._trigger('changeLineWidth');
  }

  setOpacity(opacity) {
    this._opacity = opacity;
    this._trigger('changeOpacity');
  }

  setPaintType(paintType) {
    this._paintType = paintType;
  }
}

class CanvasView extends View {
  constructor(el, canvasModel) {
    super();
    this.$el = document.getElementById(el);
    this._ctx = this.$el.getContext('2d');

    this._ctx.strokeStyle = canvasModel.color;
    this._ctx.fillStyle = canvasModel.color;
    this._ctx.lineWidth = canvasModel.lineWidth;
    this._ctx.lineCap = canvasModel.lineCap;
    this._ctx.lineJoin  = canvasModel.lineJoin;

    this._setEvent({
      'mousemove canvas': this._onMouseMove,
      'mousedown canvas': this._onMouseDown,
      'mouseup canvas': this._onMouseUp
    });

    this._canvasModel = canvasModel;

    this._setAppEvent(this._canvasModel, {
      'draw': this._draw,
      'movePath': this._movePath,
      'changeColor': this._onChangeColor,
      'changeLineWidth': this._onChangeLineWidth,
      'changeOpacity': this._onChangeOpacity
    });

    const drawFunc = drawFuncList(this._canvasModel, this._ctx);
    this.drawType = [];
    this.drawType[PaintType.BRUSH] = {
      begin: drawFunc.begin,
      beforeDraw: drawFunc.beforeDraw,
      draw: drawFunc.free,
      finish: drawFunc.finish
    };

    this.drawType[PaintType.LINE] = {
      begin: drawFunc.begin,
      beforeDraw: drawFunc.beforeDrawTool,
      draw: drawFunc.line,
      finish: drawFunc.finish
    };

    this.drawType[PaintType.CIRCLE] = {
      begin: drawFunc.begin,
      beforeDraw: drawFunc.beforeDrawTool,
      draw: drawFunc.circle,
      finish: drawFunc.finish
    };

    this.drawType[PaintType.CIRCLE_FILL] = {
      begin: drawFunc.begin,
      beforeDraw: drawFunc.beforeDrawTool,
      draw: drawFunc.circleFill,
      finish: drawFunc.finish
    };
  }

  _onMouseMove(e) {
    this.drawType[this._canvasModel.paintType].beforeDraw(e);
  }

  _onMouseDown(e) {
    if (e.button === 0) {
      this.drawType[this._canvasModel.paintType].begin(e);
    }
  }

  _onMouseUp(e) {
    this.drawType[this._canvasModel.paintType].finish(e);
  }

  _draw(e) {
    this.drawType[this._canvasModel.paintType].draw(e);
  }

  _onChangeColor() {
    this._ctx.strokeStyle = this._canvasModel.color;
    this._ctx.fillStyle = this._canvasModel.color;
  }

  _onChangeLineWidth() {
    this._ctx.lineWidth = this._canvasModel.lineWidth;
  }

  _onChangeOpacity() {
    this._ctx.globalAlpha = this._canvasModel.opacity;
  }
}

class ToolbarView extends View {
  constructor(el, canvasModel) {
    super();
    this.$el = document.getElementById(el);

    this._canvasModel = canvasModel;

    this._setEvent({
      'click drawTool': this._onClickDrawTool,
      'change color': this._onChangeColor,
      'change lineWidth': this._onChangeLineWidth,
      'change opacity': this._onChangeOpacity
    });
  }

  _onClickDrawTool(e) {
    return this._canvasModel.setPaintType(PaintTypeMap[e.target.value]);
  }

  _onChangeColor(e) {
    this._canvasModel.setColor(e.target.value);
  }

  _onChangeLineWidth(e) {
    this._canvasModel.setLineWidth(e.target.value);
  }

  _onChangeOpacity(e) {
    this._canvasModel.setOpacity(e.target.value);
  }
}

class AppController {
  constructor() {
    this.canvasModel = new CanvasModel(600, 400);

    new CanvasView('canvas', this.canvasModel);
    new ToolbarView('toolbar', this.canvasModel);
  }
}

new AppController();

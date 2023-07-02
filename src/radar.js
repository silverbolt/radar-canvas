class Radar {
    width;
    height;
    radius;
    centerX;
    centerY;
  
    pause = false;
    scandPeriod; // 扫描周期
    sectorCurrentAngle = 0; // 弧度值，扇形当前偏移角度
    sectorWidth = Math.PI / 4; // 扇形宽度，圆的8分之一
    sectorColorRGBArray; // [r, g, b], eg: ['00','90','00']
    lineColorStr;
  
    // backup
    originLineColorStr;
    originSectorColorRGBArray;
  
    _sectorOffset = 0; // 起始偏移
    _periodCount = 0;
    _processInPeriod = 0;
    __TwoPI = Math.PI * 2; // 一圈的弧度值
  
    beforeRender = (instance) => {};
    afterRender = this.beforeRender;
  
    constructor(canvasElement, options) {
      this.canvas =
        typeof canvasElement === "string"
          ? document.getElementById(canvasElement)
          : canvasElement;
      if (!this.canvas) {
        throw new Error("Can ntt get canvas element!");
      }
      this.ctx = canvasElement.getContext("2d");
  
      const _default = {
        width: 300,
        height: 300,
        lineColorStr: "#090",
        scandPeriod: 2000,
        sectorColorRGBArray: ["42", "195", "39"], // format: [r, g, b], fit to set alpha
      };
      this.setOptions(Object.assign(_default, options));
  
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
      this.radius = Math.max(this.width, this.height) / 2;
      this.originLineColorStr = this.lineColorStr;
      this.originSectorColorRGBArray = this.sectorColorRGBArray;
    }
  
    renderBasePanel() {
      const { radius } = this;
  
      this.ctx.setLineDash([5, 3]);
      this.drawCircle(radius);
      this.drawCircle(0.75 * radius);
      this.drawCircle(0.5 * radius);
      this.drawCircle(0.25 * radius);
  
      // 8条等分虚线
      for (let i = 1; i <= 8; i++) {
        this.drawLine(
          this.centerX + Math.sin((Math.PI * i) / 4) * radius,
          this.centerY + Math.cos((Math.PI * i) / 4) * radius,
          this.lineColorStr
        );
      }
  
      for (let i = 1; i <= 4; i++) {
        this.drawLine(
          this.centerX + Math.sin((Math.PI * i) / 2) * radius,
          this.centerY + Math.cos((Math.PI * i) / 2) * radius,
          this.lineColorStr
        );
      }
  
      this.ctx.setLineDash([]);
    }
  
    drawCircle(r, lineWidth = 1) {
      const { ctx, centerX, centerY, lineColorStr } = this;
      ctx.beginPath(); // 起始一条路径
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI); // 定义圆弧路径
      ctx.lineWidth = lineWidth; // 定义线宽
      ctx.strokeStyle = lineColorStr; // 定义绘笔颜色
      ctx.stroke(); // 绘制路径
    }
  
    drawLine(x, y, color = "#396a00", lineWidth = 1) {
      const { ctx, centerX, centerY } = this;
      ctx.beginPath(); // 起始一条路径
      ctx.moveTo(centerX, centerY); // 起点
      ctx.lineTo(x, y); // 添加到新点的线段
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  
    drawPoint(x, y, n) {
      const { ctx } = this;
      ctx.lineWidth = 1;
      for (let i = n; i > 0; i--) {
        ctx.beginPath();
        ctx.arc(x, y, n - i, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(42,195,39," + i / n + ")";
        ctx.stroke();
      }
    }
  
    renderSector(sAngle, eAngle) {
      const { ctx, centerX, centerY, radius, sectorColorRGBArray } = this;
      const blob = 30; // 分割扇形块数
      // const increase = (eAngle - sAngle) / blob; // 每块扇形夹角的度数 (eAngle - sAngle) / blob
      const increase = 0.02617993877991494; // 每块扇形夹角的度数 (eAngle - sAngle) / blob
  
      let angle1 = sAngle;
      let angle2 = sAngle + increase;
  
      // 从透明度最低的地方开始绘制扇形
      for (let i = 0; i < blob; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle1, angle2);
        ctx.fillStyle = `rgba(${sectorColorRGBArray.join(",")},${
          i / blob - 0.2
        })`;
        ctx.fill();
        angle1 = angle2;
        angle2 = angle1 + increase;
      }
    }
  
    startScan() {
      this.pause = false;
      this.scan();
    }
  
    stopScan() {
      this.pause = true;
    }
  
    scan() {
      this._animationStartTime = Date.now();
      this._sectorOffset = this.sectorCurrentAngle;
  
      window.requestAnimationFrame(() => {
        this._doScan();
      });
    }
  
    _doScan() {
      const animationStartTime = this._animationStartTime;
      const time = Date.now();
      const usedTime = time - animationStartTime;
      const processTime = usedTime % this.scandPeriod; // 一个周期内，行进时间
      const processRate = processTime / this.scandPeriod; // 周期内进度比例
  
      // 记录周期进度
      this._processInPeriod = processRate;
      this._periodCount = Math.ceil(usedTime / this.scandPeriod);
  
      // 记录扇区偏移角度
      this.sectorCurrentAngle =
        (this._sectorOffset + processRate * this.__TwoPI) % this.__TwoPI;
      const eAngle = this.sectorCurrentAngle + this.sectorWidth;
  
      this.clear();
  
      this.beforeRender(this); // 附加自定义渲染
  
      this.renderBasePanel();
      this.renderSector(this.sectorCurrentAngle, eAngle);
  
      this.afterRender(this);
  
      window.requestAnimationFrame(() => {
        if (!this.pause) this._doScan();
      });
    }
  
    setOptions(opt, needRestart) {
      needRestart && this.stopScan();
      for (const key in opt) {
        if (this.hasOwnProperty(key)) {
          this[key] = opt[key];
  
          // TODO save origin color
          if (key == "lineColorStr") {
            this.originLineColorStr = opt[key];
          } else if (key == "lineColorStr") {
            this.originSectorColorRGBArray = opt[key];
          }
        }
      }
      needRestart && this.startScan();
    }
  
    clear() {
      const endX = this.radius * 2;
      this.ctx.clearRect(0, 0, endX, endX);
    }
  }
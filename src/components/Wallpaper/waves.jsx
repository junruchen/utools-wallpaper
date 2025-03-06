import p5 from 'p5'

// 提取常量配置
const WAVE_CONFIG = {
  NOISE_DETAIL: { SCALE: 3, FALLOFF: 1.4 },
  WAVE_COUNT: 4,
  ALPHA_STEP: 50,
  HEIGHT_STEP: 35,
  VERTEX_STEP: 6,
  NOISE_STEP: 0.03,
  MAX_NOISE_HEIGHT: 80
};

const TEXT_CONFIG = {
  COLOR_SIZE: 150,
  POEM_SIZE: 28,
  TITLE_SIZE: 16,
  AUTHOR_SIZE: 12,
  PADDING_LEFT: 15,
  AUTHOR_PADDING: 4,
  POEM_Y_RATIO: 0.25,
  AUTHOR_Y_OFFSET: 30,
  AUTHOR_BG_RADIUS: 3,
  AUTHOR_BG_HEIGHT: 22
};

const COLORS = {
  DARK_BG: '#323232',
  LIGHT_BG: '#e6e6e6',
  AUTHOR_BG: '#c9333e',
  DEFAULT_WAVE: '#f9f4dc',
  DEFAULT_WAVE_NAME: '乳白',
  DARK_NAME: 'rgba(0, 0, 0, 0.2)',
  LIGHT_NAME: 'rgba(255, 255, 255, 0.2)',
};

class Mountain {
  constructor(color, y, p) {
    this.c = color;
    this.y = y;
    this.offset = p.random(100, 200);
    this.t = p.random(0, 100);
  }

  display(p) {
    let xoff = 0;
    p.noStroke();
    p.fill(this.c);
    p.noiseDetail(WAVE_CONFIG.NOISE_DETAIL.SCALE, WAVE_CONFIG.NOISE_DETAIL.FALLOFF);

    const points = [];
    for (let x = 0; x <= p.width + WAVE_CONFIG.VERTEX_STEP; x += WAVE_CONFIG.VERTEX_STEP) {
      const yoff = p.map(
        p.noise(xoff + this.offset, this.t + this.offset),
        0, 1, 0, WAVE_CONFIG.MAX_NOISE_HEIGHT
      );
      points.push([x, this.y - yoff]);
      xoff += WAVE_CONFIG.NOISE_STEP;
    }

    p.beginShape();
    points.forEach(([x, y]) => p.vertex(x, y));
    p.vertex(p.width + 100, p.height);
    p.vertex(0, p.height);
    p.endShape(p.CLOSE);

    // 静态展示，不更新时间
  }
}

function growMountains(p, mountains, hexColor) {
  const c = p.color(hexColor);
  const availableHeight = p.height * 0.3;

  new Array(WAVE_CONFIG.WAVE_COUNT).fill(1).map((_, i) => {
    const a = 255 - WAVE_CONFIG.ALPHA_STEP * i;
    c.setAlpha(a);
    const h = availableHeight - WAVE_CONFIG.HEIGHT_STEP * i;
    mountains.push(new Mountain(c, h, p));
  });
}

export default function waves(p) {
  let mountains = [];
  let bgColor = COLORS.DARK_BG;
  let isDarkMode = true;
  let waveColor = COLORS.DEFAULT_WAVE;
  let waveColorName = COLORS.DEFAULT_WAVE_NAME;
  let poem = {
    content: '',
    author: '',
    title: ''
  };

  p.setup = function () {
    const container = document.getElementById('waves-container');
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const pixelDensity = window.devicePixelRatio || 1;
    p.createCanvas(containerWidth, containerHeight);
    p.pixelDensity(pixelDensity);
    p.frameRate(0);
    mountains = [];
    growMountains(p, mountains, waveColor);
    p.background(bgColor);
    mountains.forEach((m) => m.display(p));
  };

  p.draw = function () {
    p.background(bgColor);
    
    p.textFont('JXZhuoKai');
    if (waveColorName) {
      // 渲染颜色文字（竖向排列）
      p.textAlign(p.RIGHT, p.TOP);
      p.fill(isDarkMode ? COLORS.LIGHT_NAME : COLORS.DARK_NAME);
      const pixelDensity = window.devicePixelRatio || 1;
      p.textSize(TEXT_CONFIG.COLOR_SIZE / pixelDensity);
      const chars = waveColorName.split('');
      let yOffset = 50;
      chars.forEach(char => {
        p.text(char, p.width - 30, yOffset);
        yOffset += (TEXT_CONFIG.COLOR_SIZE / pixelDensity) * 1.2;
      });
    }

    if (poem.content) {
      renderPoem(p, poem, isDarkMode);
    }

    p.push();
    p.translate(0, p.height * 0.67);
    mountains.forEach((m) => m.display(p));
    p.pop();
  };

  function renderPoem(p, poem, isDarkMode) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(isDarkMode ? COLORS.LIGHT_BG : COLORS.DARK_BG);
    
    // 渲染诗句
    p.textSize(TEXT_CONFIG.POEM_SIZE); 
    p.text(poem.content, p.width/2, p.height * TEXT_CONFIG.POEM_Y_RATIO);

    // 渲染标题和作者
    p.textAlign(p.LEFT, p.TOP);
    const titleText = `「${poem.title}」`;
    const authorText = poem.author;

    p.textSize(TEXT_CONFIG.TITLE_SIZE);
    const titleWidth = p.textWidth(titleText);
    p.textSize(TEXT_CONFIG.AUTHOR_SIZE);
    const authorWidth = p.textWidth(authorText);
    
    const startX = p.width/2 - (authorWidth + titleWidth + TEXT_CONFIG.PADDING_LEFT)/2;
    const startY = p.height * TEXT_CONFIG.POEM_Y_RATIO + TEXT_CONFIG.AUTHOR_Y_OFFSET;

    // 绘制作者背景
    p.push();
    p.fill(COLORS.AUTHOR_BG);
    p.noStroke();
    p.rect(
      startX + titleWidth + TEXT_CONFIG.PADDING_LEFT - TEXT_CONFIG.AUTHOR_PADDING,
      startY - TEXT_CONFIG.AUTHOR_PADDING,
      authorWidth + TEXT_CONFIG.AUTHOR_PADDING * 2,
      TEXT_CONFIG.AUTHOR_BG_HEIGHT,
      TEXT_CONFIG.AUTHOR_BG_RADIUS
    );
    p.pop();

    // 渲染标题和作者文本
    p.textSize(TEXT_CONFIG.TITLE_SIZE);
    p.fill(isDarkMode ? COLORS.LIGHT_BG : COLORS.DARK_BG);
    p.text(titleText, startX, startY);
    p.textSize(TEXT_CONFIG.AUTHOR_SIZE);
    p.fill(COLORS.LIGHT_BG);
    p.text(authorText, startX + titleWidth + TEXT_CONFIG.PADDING_LEFT, startY + 2);
  }

  let resizeTimeout = null;
  p.windowResized = function () {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(() => {
      const container = document.getElementById('waves-container');
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const pixelDensity = window.devicePixelRatio || 1;
      p.resizeCanvas(containerWidth, containerHeight);
      p.pixelDensity(pixelDensity);
      mountains = [];
      growMountains(p, mountains, waveColor);
      p.draw();
    }, 250);
  };

  p.updateWithProps = function (newProps) {
    p.frameRate(0);
    bgColor = newProps.isDarkMode ? COLORS.DARK_BG : COLORS.LIGHT_BG;
    waveColor = newProps.waveColor.color;
    waveColorName = newProps.waveColor.name;
    isDarkMode = newProps.isDarkMode;
    poem = newProps.poem;
    mountains = [];
    growMountains(p, mountains, waveColor);
    p.draw();
  };

  // 新增：创建壁纸画布
  p.createWallpaperCanvas = function () {
    const { width: screenWidth, height: screenHeight } = window.screen;
    let tempP5Instance = null;

    return new Promise((resolve) => {
      tempP5Instance = new p5((p) => {
        p.setup = () => {
          const canvas = p.createCanvas(screenWidth, screenHeight);
          p.pixelDensity(window.devicePixelRatio || 1);
          p.background(bgColor);
          p.textFont('JXZhuoKai');
          
          // 重新生成山脉
          const tempMountains = [];
          growMountains(p, tempMountains, waveColor);
          
          // 绘制壁纸
          if (waveColorName) {
            p.textAlign(p.RIGHT, p.TOP);
            p.fill(isDarkMode ? COLORS.LIGHT_NAME : COLORS.DARK_NAME);
            const pixelDensity = window.devicePixelRatio || 1;
            p.textSize(TEXT_CONFIG.COLOR_SIZE / pixelDensity);
            const chars = waveColorName.split('');
            let yOffset = 100;
            chars.forEach(char => {
              p.text(char, p.width - 30, yOffset);
              yOffset += (TEXT_CONFIG.COLOR_SIZE / pixelDensity) * 1.2;
            });
          }

          if (poem.content) {
            renderPoem(p, poem, isDarkMode);
          }

          p.push();
          p.translate(0, p.height * 0.67);
          tempMountains.forEach((m) => m.display(p));
          p.pop();
          
          // 获取画布数据并清理 p5 实例
          const dataUrl = canvas.elt.toDataURL('image/png');
          if (tempP5Instance) {
            tempP5Instance.remove();
            tempP5Instance = null;
          }
          resolve(dataUrl);
        };
      });
    });
  };
}
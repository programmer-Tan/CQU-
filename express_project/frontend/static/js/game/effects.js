// file: frontend/static/js/game/effects.js

/**
 * 在棋盘上方显示胜利特效
 * @param {string} text 要显示的文字
 */
export function showEffectText(text) {
  // 创建特效容器
  const effectContainer = document.createElement('div');
  effectContainer.className = 'absolute inset-0 flex items-center justify-center pointer-events-none z-50';
  
  // 创建文字元素
  const effectText = document.createElement('div');
  effectText.className = 'text-5xl md:text-7xl font-extrabold text-center';
  effectText.style.color = '#ffd700';
  effectText.style.textShadow = '0 0 15px rgba(255, 215, 0, 0.8)';
  effectText.style.opacity = '0';
  effectText.style.transform = 'scale(0.5)';
  effectText.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  effectText.style.background = 'linear-gradient(to bottom, #ffd700, #ff8c00)';
  effectText.style.webkitBackgroundClip = 'text';
  effectText.style.backgroundClip = 'text';
  effectText.style.color = 'transparent';
  effectText.style.padding = '0.5rem 1.5rem';
  effectText.style.borderRadius = '1rem';
  effectText.textContent = text;

  // 创建光环效果
  const halo = document.createElement('div');
  halo.className = 'absolute rounded-full';
  halo.style.width = '0';
  halo.style.height = '0';
  halo.style.background = 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0) 70%)';
  halo.style.transition = 'all 1s ease-out';
  
  effectContainer.appendChild(halo);
  effectContainer.appendChild(effectText);
  
  // 添加到棋盘容器中
  const boardContainer = document.querySelector('.relative.w-full');
  if (boardContainer) {
    boardContainer.appendChild(effectContainer);
    
    // 触发动画
    setTimeout(() => {
      effectText.style.opacity = '1';
      effectText.style.transform = 'scale(1.1)';
      halo.style.width = '300px';
      halo.style.height = '300px';
      halo.style.opacity = '0.8';
    }, 50);
    
    // 添加闪烁效果
    let scale = 1.1;
    const blinkInterval = setInterval(() => {
      scale = scale === 1.1 ? 1.15 : 1.1;
      effectText.style.transform = `scale(${scale})`;
    }, 800);
    
    // 5秒后移除
    setTimeout(() => {
      clearInterval(blinkInterval);
      effectText.style.opacity = '0';
      effectText.style.transform = 'scale(1.5)';
      halo.style.opacity = '0';
      
      // 完全移除元素
      setTimeout(() => {
        effectContainer.remove();
      }, 800);
    }, 5000);
  }
}

/**
 * 显示失败特效
 */
export function showFailEffect() {
  // 创建特效容器
  const effectContainer = document.createElement('div');
  effectContainer.className = 'absolute inset-0 flex items-center justify-center pointer-events-none z-50';
  
  // 创建文字元素
  const effectText = document.createElement('div');
  effectText.className = 'text-4xl md:text-6xl font-bold text-center';
  effectText.style.color = '#ff3860';
  effectText.style.textShadow = '0 0 15px rgba(255, 56, 96, 0.6)';
  effectText.style.opacity = '0';
  effectText.style.transform = 'translateY(20px) rotate(-5deg)';
  effectText.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  effectText.style.background = 'linear-gradient(to bottom, #ff3860, #ff1443)';
  effectText.style.webkitBackgroundClip = 'text';
  effectText.style.backgroundClip = 'text';
  effectText.style.color = 'transparent';
  effectText.style.padding = '0.5rem 1.5rem';
  effectText.textContent = '很遗憾，再接再厉！';

  // 创建破碎效果
  const fragments = document.createElement('div');
  fragments.className = 'absolute inset-0 overflow-hidden';
  
  // 添加多个碎片元素
  for (let i = 0; i < 20; i++) {
    const fragment = document.createElement('div');
    fragment.className = 'absolute bg-red-500 opacity-70';
    fragment.style.width = `${Math.random() * 20 + 10}px`;
    fragment.style.height = `${Math.random() * 20 + 10}px`;
    fragment.style.left = `${Math.random() * 100}%`;
    fragment.style.top = `${Math.random() * 100}%`;
    fragment.style.transform = 'scale(0)';
    fragment.style.transition = `all ${Math.random() * 0.5 + 0.5}s ease-out`;
    fragment.style.borderRadius = '30% 70% 70% 30% / 30% 30% 70% 70%';
    fragments.appendChild(fragment);
  }
  
  effectContainer.appendChild(fragments);
  effectContainer.appendChild(effectText);
  
  // 添加到棋盘容器中
  const boardContainer = document.querySelector('.relative.w-full');
  if (boardContainer) {
    boardContainer.appendChild(effectContainer);
    
    // 触发动画
    setTimeout(() => {
      effectText.style.opacity = '1';
      effectText.style.transform = 'translateY(0) rotate(0)';
      
      // 触发碎片动画
      fragments.querySelectorAll('div').forEach(frag => {
        frag.style.transform = `scale(1) translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px) rotate(${Math.random() * 360}deg)`;
        frag.style.opacity = '0';
      });
    }, 50);
    
    // 3秒后移除
    setTimeout(() => {
      effectText.style.opacity = '0';
      effectText.style.transform = 'translateY(-20px) rotate(5deg)';
      
      // 完全移除元素
      setTimeout(() => {
        effectContainer.remove();
      }, 600);
    }, 3000);
  }
}

/**
 * 在棋盘上显示烟花效果
 */
export function showFireworks() {
  const boardContainer = document.querySelector('.relative.w-full');
  if (!boardContainer) return;
  
  // 创建烟花容器
  const fireworksContainer = document.createElement('div');
  fireworksContainer.className = 'absolute inset-0 overflow-hidden pointer-events-none z-40';
  boardContainer.appendChild(fireworksContainer);
  
  // 创建多个烟花发射点
  for (let i = 0; i < 8; i++) {
    createFirework(fireworksContainer);
  }
  
  // 3秒后移除容器
  setTimeout(() => {
    fireworksContainer.remove();
  }, 3000);
}

function createFirework(container) {
  const delay = Math.random() * 1500;
  
  setTimeout(() => {
    const firework = document.createElement('div');
    firework.className = 'absolute';
    firework.style.left = `${Math.random() * 80 + 10}%`;
    firework.style.top = `${Math.random() * 80 + 10}%`;
    firework.style.width = '4px';
    firework.style.height = '4px';
    firework.style.borderRadius = '50%';
    firework.style.backgroundColor = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`;
    firework.style.boxShadow = `0 0 10px 2px hsl(${Math.random() * 60 + 10}, 100%, 50%)`;
    firework.style.transform = 'scale(0)';
    firework.style.transition = 'transform 0.3s ease-out';
    
    container.appendChild(firework);
    
    // 发射动画
    setTimeout(() => {
      firework.style.transform = 'scale(1) translateY(-100px)';
      firework.style.opacity = '0.8';
      
      // 爆炸效果
      setTimeout(() => {
        firework.remove();
        createExplosion(container, firework.style.left, firework.style.top);
      }, 300);
    }, 10);
  }, delay);
}

function createExplosion(container, left, top) {
  const particleCount = 30;
  const colors = [
    '#ff0000', '#ff7f00', '#ffff00', 
    '#00ff00', '#00ffff', '#0000ff', 
    '#8b00ff', '#ff1493', '#ff69b4'
  ];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute rounded-full';
    particle.style.left = left;
    particle.style.top = top;
    particle.style.width = '6px';
    particle.style.height = '6px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.boxShadow = `0 0 10px 2px ${colors[Math.floor(Math.random() * colors.length)]}`;
    particle.style.transform = 'scale(0)';
    particle.style.transition = `all ${Math.random() * 0.5 + 0.5}s ease-out`;
    
    container.appendChild(particle);
    
    // 爆炸动画
    setTimeout(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 80 + 50;
      particle.style.transform = `scale(1) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
      particle.style.opacity = '0';
      
      // 移除粒子
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }, 10);
  }
}

// 初始化样式
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }
    
    .win-text {
      animation: float 3s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// 初始化时添加样式
addStyles();
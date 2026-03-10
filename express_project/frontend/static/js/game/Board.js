// file: frontend/static/js/game/Board.js
export class Board {
  constructor(size = 15, onCellClick) {
    this.size = size;
    this.onCellClick = onCellClick;
    this.boardElement = document.getElementById('board');
    this.cells = [];
    this.pieces = [];
    this.initialize();
  }

  initialize() {
    this.boardElement.innerHTML = '';
    this.cells = [];
    this.pieces = [];

    // 创建棋盘网格
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const cell = document.createElement('div');
        cell.className = 'absolute cursor-pointer hover:bg-black/5 transition-colors';
        cell.style.width = `calc(100% / ${this.size})`;
        cell.style.height = `calc(100% / ${this.size})`;
        cell.style.left = `calc(${j} * (100% / ${this.size}))`;
        cell.style.top = `calc(${i} * (100% / ${this.size}))`;
        cell.dataset.row = i;
        cell.dataset.col = j;
        
        cell.addEventListener('click', () => {
          if (this.onCellClick) {
            this.onCellClick(i, j);
          }
        });
        
        this.boardElement.appendChild(cell);
        this.cells.push(cell);
      }
    }
  }

  placePiece(row, col, color, isBlack) {
    const piece = document.createElement('div');
    piece.className = `absolute rounded-full shadow-md transform transition-all duration-200 ${
      isBlack ? 'piece-black' : 'piece-white'
    }`;
    
    piece.style.width = `calc(60% / ${this.size})`;
    piece.style.height = `calc(60% / ${this.size})`;
    piece.style.left = `calc(${col} * (100% / (${this.size} - 1)) - (30% / ${this.size}))`;
    piece.style.top = `calc(${row} * (100% / (${this.size} - 1)) - (30% / ${this.size}))`;
    piece.style.transform = 'scale(0)';
    
    this.boardElement.appendChild(piece);
    this.pieces.push(piece);

    setTimeout(() => {
      piece.style.transform = 'scale(1)';
    }, 10);
  }

  removeLastPiece() {
    if (this.pieces.length > 0) {
      const lastPiece = this.pieces.pop();
      lastPiece.style.transform = 'scale(0)';
      setTimeout(() => lastPiece.remove(), 200);
    }
  }

  clear() {
    this.boardElement.innerHTML = '';
    this.cells = [];
    this.pieces = [];
  }

  disable() {
    this.cells.forEach(cell => {
      cell.style.pointerEvents = 'none';
      cell.classList.remove('hover:bg-black/5');
    });
  }

  enable() {
    this.cells.forEach(cell => {
      cell.style.pointerEvents = 'auto';
      cell.classList.add('hover:bg-black/5');
    });
  }

  highlightWinLine(positions) {
    positions.forEach(([row, col]) => {
      const index = row * this.size + col;
      if (index >= 0 && index < this.cells.length) {
        this.cells[index].classList.add('bg-yellow-200/50');
      }
    });
  }


  updateState(boardState) {
      this.clear();
      boardState.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
              if (cell !== 0) {
                  this.placePiece(rowIndex, colIndex, cell, cell === 1);
              }
          });
      });
  }

  destroy() {
    this.clear();
    this.boardElement.removeEventListener('click', this.onCellClick);
  }
}
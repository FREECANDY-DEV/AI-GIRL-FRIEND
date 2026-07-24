import React, { useState, useEffect, useCallback } from 'react';

type Grid = number[][];

const initializeGrid = (): Grid => {
  const grid = Array(4).fill(null).map(() => Array(4).fill(0));
  addRandomTile(grid);
  addRandomTile(grid);
  return grid;
};

const getEmptyTiles = (grid: Grid) => {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) {
        empty.push({ r, c });
      }
    }
  }
  return empty;
};

const addRandomTile = (grid: Grid) => {
  const empty = getEmptyTiles(grid);
  if (empty.length > 0) {
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
};

const cloneGrid = (grid: Grid): Grid => grid.map(row => [...row]);

export function Game2048() {
  const [grid, setGrid] = useState<Grid>(initializeGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const resetGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setGameOver(false);
  };

  const moveGrid = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;
    
    let newGrid = cloneGrid(grid);
    let moved = false;
    let scoreGained = 0;

    const moveLeft = (row: number[]) => {
      const nonZero = row.filter(val => val !== 0);
      const merged = [];
      let i = 0;
      while (i < nonZero.length) {
        if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
          merged.push(nonZero[i] * 2);
          scoreGained += nonZero[i] * 2;
          i += 2;
        } else {
          merged.push(nonZero[i]);
          i++;
        }
      }
      while (merged.length < 4) merged.push(0);
      return merged;
    };

    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        const row = newGrid[r];
        const originalRow = [...row];
        const newRow = direction === 'LEFT' ? moveLeft(row) : moveLeft(row.reverse()).reverse();
        newGrid[r] = newRow;
        if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) moved = true;
      }
    } else {
      for (let c = 0; c < 4; c++) {
        const col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        const originalCol = [...col];
        const newCol = direction === 'UP' ? moveLeft(col) : moveLeft(col.reverse()).reverse();
        for (let r = 0; r < 4; r++) newGrid[r][c] = newCol[r];
        if (JSON.stringify(originalCol) !== JSON.stringify(newCol)) moved = true;
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(s => s + scoreGained);
      
      // Check game over
      if (getEmptyTiles(newGrid).length === 0) {
        let possibleMove = false;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (
              (r < 3 && newGrid[r][c] === newGrid[r + 1][c]) ||
              (c < 3 && newGrid[r][c] === newGrid[r][c + 1])
            ) {
              possibleMove = true;
            }
          }
        }
        if (!possibleMove) setGameOver(true);
      }
    }
  }, [grid, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp': moveGrid('UP'); break;
        case 'ArrowDown': moveGrid('DOWN'); break;
        case 'ArrowLeft': moveGrid('LEFT'); break;
        case 'ArrowRight': moveGrid('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveGrid]);

  const getColor = (val: number) => {
    const colors: Record<number, { bg: string, text: string }> = {
      0: { bg: 'bg-[#cdc1b4]', text: '' },
      2: { bg: 'bg-[#eee4da]', text: 'text-[#776e65]' },
      4: { bg: 'bg-[#ede0c8]', text: 'text-[#776e65]' },
      8: { bg: 'bg-[#f2b179]', text: 'text-white' },
      16: { bg: 'bg-[#f59563]', text: 'text-white' },
      32: { bg: 'bg-[#f67c5f]', text: 'text-white' },
      64: { bg: 'bg-[#f65e3b]', text: 'text-white' },
      128: { bg: 'bg-[#edcf72]', text: 'text-white' },
      256: { bg: 'bg-[#edcc61]', text: 'text-white' },
      512: { bg: 'bg-[#edc850]', text: 'text-white' },
      1024: { bg: 'bg-[#edc53f]', text: 'text-white' },
      2048: { bg: 'bg-[#edc22e]', text: 'text-white' },
    };
    return colors[val] || { bg: 'bg-[#3c3a32]', text: 'text-[#f9f6f2]' };
  };

  return (
    <div className="w-full h-full bg-[#faf8ef] text-[#776e65] flex flex-col items-center justify-center font-sans select-none p-4 rounded-b-md">
      <div className="flex justify-between items-center w-[300px] mb-4">
        <h1 className="text-4xl font-bold text-[#776e65]">2048</h1>
        <div className="flex gap-2">
          <div className="bg-[#bbada0] px-4 py-1 rounded text-center">
            <div className="text-xs text-[#eee4da] uppercase font-bold tracking-widest">Score</div>
            <div className="text-white font-bold leading-tight">{score}</div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center w-[300px] mb-4">
        <p className="text-sm">Join the numbers!</p>
        <button 
          onClick={resetGame}
          className="bg-[#8f7a66] text-white font-bold py-2 px-4 rounded hover:bg-[#9f8b77] transition"
        >
          New Game
        </button>
      </div>

      <div className="relative bg-[#bbada0] p-2 rounded-lg w-[300px] h-[300px] shadow-inner">
        {gameOver && (
          <div className="absolute inset-0 bg-[#eee4da]/70 z-10 rounded-lg flex flex-col items-center justify-center animate-in fade-in">
            <h2 className="text-4xl font-bold text-[#776e65] mb-4">Game Over!</h2>
            <button onClick={resetGame} className="bg-[#8f7a66] text-white font-bold py-2 px-4 rounded shadow-lg hover:scale-105 transition">Try Again</button>
          </div>
        )}
        
        <div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
          {grid.map((row, rIdx) => 
            row.map((val, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`w-full h-full rounded flex items-center justify-center font-bold text-2xl transition-all duration-150 ${getColor(val).bg} ${getColor(val).text}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-center text-[#776e65]/70 max-w-[300px]">
        Use your arrow keys to move the tiles. Tiles with the same number merge into one when they touch.
      </p>
    </div>
  );
}

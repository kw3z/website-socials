'use client';
import { useKonamiCode } from '@/hooks/useKonamiCode';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

export default function KonamiEgg() {
  const { activated, progress, reset } = useKonamiCode();
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProcessedDirection = useRef<Direction>('UP');

  // Toggle retro mode class on document body
  useEffect(() => {
    if (activated) {
      document.body.classList.add('retro-mode');
      // Load high score
      try {
        const hs = localStorage.getItem('quesz_snake_highscore');
        if (hs) setHighScore(parseInt(hs, 10));
      } catch {}
    } else {
      document.body.classList.remove('retro-mode');
      setGameState('IDLE');
    }
  }, [activated]);

  // Generate random food position not occupied by the snake
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20),
      };
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setDirection('UP');
    lastProcessedDirection.current = 'UP';
    setScore(0);
    setGameState('PLAYING');
  };

  // Handle game loop tick
  const gameTick = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      let newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      lastProcessedDirection.current = direction;

      // Check collision with walls or self
      if (
        newHead.x < 0 || newHead.x >= 20 ||
        newHead.y < 0 || newHead.y >= 20 ||
        prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameState('GAME_OVER');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prevScore) => {
          const nextScore = prevScore + 1;
          if (nextScore > highScore) {
            setHighScore(nextScore);
            try {
              localStorage.setItem('quesz_snake_highscore', nextScore.toString());
            } catch {}
          }
          return nextScore;
        });

        setFood(generateFood(newSnake));
      } else {
        newSnake.pop(); // Remove tail
      }

      return newSnake;
    });
  }, [direction, food, highScore, generateFood]);

  // Set up interval when playing
  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameInterval.current = setInterval(gameTick, 110);
    }
    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
    };
  }, [gameState, gameTick]);

  // Handle keyboard inputs during game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activated) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault(); // Prevent scrolling
      }

      if (gameState !== 'PLAYING') {
        if (e.code === 'Enter' || e.code === 'Space') {
          startGame();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          if (lastProcessedDirection.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (lastProcessedDirection.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          if (lastProcessedDirection.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (lastProcessedDirection.current !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activated, gameState, direction]);

  return (
    <>
      {/* Progress indicator — subtle hint in corner */}
      {progress > 0 && !activated && (
        <div className="konami-progress">
          <div className="konami-progress-bar" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      {/* Full-screen easter egg */}
      <AnimatePresence>
        {activated && (
          <motion.div
            className="konami-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Flash effect */}
            <motion.div
              className="konami-flash"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />

            {/* Retro CRT Grid Scanlines */}
            <div className="retro-scanlines" />

            <div className="konami-game-container">
              <div className="arcade-header">
                <span className="arcade-title">👾 RETRO ARCADE MACHINE 👾</span>
                <button className="arcade-close-btn" onClick={reset}>✕ EXIT</button>
              </div>

              <div className="arcade-cabinet">
                {/* Scoreboard */}
                <div className="arcade-scores">
                  <div>SCORE: <span className="score-val">{score}</span></div>
                  <div className="highscore-label">HI-SCORE: <span>{highScore}</span></div>
                </div>

                {/* Snake Screen */}
                <div className="arcade-screen">
                  {gameState === 'IDLE' && (
                    <div className="screen-overlay">
                      <div className="overlay-title">SNAKE GAME</div>
                      <div className="overlay-desc">Press ENTER or SPACE to start</div>
                      <div className="overlay-controls">Use Arrow Keys / WASD</div>
                    </div>
                  )}

                  {gameState === 'GAME_OVER' && (
                    <div className="screen-overlay game-over-overlay">
                      <div className="overlay-title blink-text">GAME OVER</div>
                      <div className="overlay-score">Final Score: {score}</div>
                      <div className="overlay-desc">Press ENTER to restart</div>
                    </div>
                  )}

                  {/* Grid */}
                  <div className="game-grid">
                    {Array.from({ length: 20 }).map((_, y) => (
                      <div key={y} className="grid-row">
                        {Array.from({ length: 20 }).map((_, x) => {
                          const isSnake = snake.some((seg) => seg.x === x && seg.y === y);
                          const isHead = snake[0]?.x === x && snake[0]?.y === y;
                          const isFood = food.x === x && food.y === y;

                          return (
                            <div
                              key={x}
                              className={`grid-cell ${isSnake ? 'cell-snake' : ''} ${isHead ? 'cell-head' : ''} ${isFood ? 'cell-food' : ''}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cabinet Controls Hint */}
                <div className="arcade-instructions">
                  <div className="instruction-key">↑ ↓ ← → / WASD</div>
                  <span>to control snake</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

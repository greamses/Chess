# Chess Master - Interactive Chess Game

## Overview
Chess Master is a fully-featured chess application built with vanilla JavaScript that provides an immersive chess experience with both human and computer opponents. The game features a clean, responsive interface with support for touch and desktop interactions.

## Key Features

### Core Gameplay
- **Complete Chess Rules Implementation**:
  - All piece movements including special moves (castling, en passant, pawn promotion)
  - Check/checkmate detection
  - Stalemate and draw rules (threefold repetition, 50-move rule, insufficient material)
  
- **Multiple Game Modes**:
  - Human vs Human
  - Human vs Computer (with adjustable difficulty)
  - Computer vs Computer (for observation)

### User Interface
- **Interactive Chessboard**:
  - Drag-and-drop piece movement
  - Touch support for mobile devices
  - Visual move hints and highlights
  - Board flipping (perspective switching)
  
- **Game Information**:
  - Turn indicator
  - Move history with standard algebraic notation
  - Game status (check, checkmate, stalemate)
  
- **Sound Effects**:
  - Move sounds
  - Capture sounds
  - Check/checkmate notifications

### Computer AI
- **Adjustable Difficulty Levels** (1-10):
  - Random moves (level 1)
  - Basic capture logic (levels 2-3)
  - Material evaluation (levels 4-5)
  - Minimax search (levels 6-8)
  - Alpha-beta pruning with quiescence search (levels 9-10)
  
- **Advanced Features**:
  - Piece-square tables for positional play
  - Mobility evaluation
  - Pawn structure analysis
  - King safety considerations

## Technical Implementation

### Architecture
- **Model-View-Controller Pattern**:
  - `ChessGame` class handles game logic and state
  - `ChessUIController` manages UI interactions and rendering
  - `PreGameUI` handles game setup and configuration

- **Modern JavaScript Features**:
  - ES6 classes
  - Arrow functions
  - Template literals
  - Destructuring assignment

### Key Algorithms
- **Move Generation**:
  - Legal move validation with check detection
  - Special move handling (castling, en passant, promotion)
  
- **AI Implementation**:
  - Minimax algorithm with alpha-beta pruning
  - Quiescence search to avoid horizon effect
  - Evaluation function with multiple heuristics
  - Move ordering for search efficiency

### Performance Optimizations
- **Efficient Board Representation**:
  - 8x8 array for piece storage
  - Bitboard-like position hashing for repetition detection
  
- **Selective Deepening**:
  - Variable search depth based on difficulty
  - Focused search on promising lines

## How to Play

1. **Setup Game**:
   - Choose player types (Human/Computer) for both sides
   - Select computer difficulty level
   - Click "Start Game"

2. **Make Moves**:
   - Click or drag pieces to move them
   - Valid moves will be highlighted
   - Special moves are handled automatically

3. **Game Controls**:
   - Undo moves with the Undo button
   - Flip the board perspective
   - Start a new game at any time

## Installation
No installation required - runs directly in modern browsers:
1. Clone repository
2. Open `index.html` in any browser

```bash
git clone https://github.com/greamses/Chess.git
```

## Development Highlights
- Implemented complete chess rules including all special moves
- Developed adjustable AI with 10 difficulty levels
- Created responsive UI with both mouse and touch support
- Added visual feedback for game state and valid moves
- Implemented sound effects for game events

## Future Enhancements
- Opening book integration
- Endgame tablebase support
- Game saving/loading
- Online multiplayer
- Chess puzzles and training modes

## License
MIT License - Free for educational and personal use
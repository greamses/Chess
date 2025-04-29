

class ChessGame {
    constructor() {
      this.board = Array(8).fill().map(() => Array(8).fill(null));
      this.turn = 'white';
      this.selectedSquare = null;
      this.possibleMoves = [];
      this.moveHistory = [];
      this.boardOrientation = 'white';
      this.check = false;
      this.checkmate = false;
      this.stalemate = false;
      this.lastCapture = null;
      this.draggedPiece = null;
      this.draggedPieceClone = null;
      this.enPassantTarget = null;
      this.castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };
      this.computerPlaysWhite = false;
      this.computerPlaysBlack = false;
      this.isComputerThinking = false;
      this.uiController = null;
    }
    
    
async findBestMove(difficulty) {
  return new Promise(resolve => {
    setTimeout(() => {
      const validMoves = this.getAllValidMoves();
      if (validMoves.length === 0) return resolve(null);
      
      // Convert numeric difficulty to corresponding algorithm
      let difficultyLevel;
      if (typeof difficulty === 'string') {
        // Parse the string to ensure no octal interpretation
        const diffNum = parseInt(difficulty, 10);
        
        // Map numeric levels to algorithm types
        if (diffNum === 1) {
          difficultyLevel = 'random';
        } else if (diffNum >= 2 && diffNum <= 3) {
          difficultyLevel = 'easy';
        } else if (diffNum >= 4 && diffNum <= 6) {
          difficultyLevel = 'medium';
        } else if (diffNum >= 7 && diffNum <= 8) {
          difficultyLevel = 'hard';
        } else if (diffNum >= 9) {
          difficultyLevel = 'advanced';
        } else {
          // If it's a direct string like 'easy', 'medium', 'hard'
          difficultyLevel = difficulty;
        }
      } else {
        // If it's already a number
        if (difficulty === 1) {
          difficultyLevel = 'random';
        } else if (difficulty >= 2 && difficulty <= 3) {
          difficultyLevel = 'easy';
        } else if (difficulty >= 4 && difficulty <= 6) {
          difficultyLevel = 'medium';
        } else if (difficulty >= 7 && difficulty <= 8) {
          difficultyLevel = 'hard';
        } else if (difficulty >= 9) {
          difficultyLevel = 'advanced';
        } else {
          difficultyLevel = 'medium'; // Default
        }
      }
      
      // Random move selection
      if (difficultyLevel === 'random') {
        return resolve(validMoves[Math.floor(Math.random() * validMoves.length)]);
      }
      
      // Easy - Slightly biased toward captures but mostly random
      if (difficultyLevel === 'easy') {
        const captures = validMoves.filter(move => move.capture);
        if (captures.length && Math.random() > 0.7) {
          return resolve(captures[Math.floor(Math.random() * captures.length)]);
        }
        return resolve(validMoves[Math.floor(Math.random() * validMoves.length)]);
      }
      
      // Medium - Prioritizes captures and checks
      if (difficultyLevel === 'medium') {
        const captures = validMoves.filter(move => move.capture);
        if (captures.length) {
          // Sort captures by value
          captures.sort((a, b) => {
            const aValue = this.getPieceValue(this.board[a.to.row][a.to.col] || { type: 'pawn' });
            const bValue = this.getPieceValue(this.board[b.to.row][b.to.col] || { type: 'pawn' });
            return bValue - aValue;
          });
          // 80% chance to pick the highest value capture
          if (Math.random() > 0.2) {
            return resolve(captures[0]);
          }
          return resolve(captures[Math.floor(Math.random() * captures.length)]);
        }
        return resolve(validMoves[Math.floor(Math.random() * validMoves.length)]);
      }
      
      // Hard - Uses simple evaluation with limited depth
      if (difficultyLevel === 'hard') {
        let bestScore = -Infinity;
        let bestMove = validMoves[0];
        
        for (const move of validMoves) {
          // Make the move
          const fromPiece = this.board[move.from.row][move.from.col];
          const toPiece = this.board[move.to.row][move.to.col];
          this.board[move.to.row][move.to.col] = fromPiece;
          this.board[move.from.row][move.from.col] = null;
          
          // Evaluate position
          const score = this.evaluateBoard();
          
          // Undo the move
          this.board[move.from.row][move.from.col] = fromPiece;
          this.board[move.to.row][move.to.col] = toPiece;
          
          // Update best move
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        return resolve(bestMove);
      }
      
      // Advanced - Uses minimax with position evaluation
      if (difficultyLevel === 'advanced') {
        // Sort moves to improve alpha-beta pruning
        const sortedMoves = [...validMoves].sort((a, b) => {
          // Prioritize captures
          const aCapture = a.capture ? 1 : 0;
          const bCapture = b.capture ? 1 : 0;
          
          // Then by piece value
          const aValue = this.getPieceValue(this.board[a.to.row][a.to.col] || { type: 'pawn' });
          const bValue = this.getPieceValue(this.board[b.to.row][b.to.col] || { type: 'pawn' });
          
          return (bCapture * 10 + bValue) - (aCapture * 10 + aValue);
        });
        
        let bestScore = -Infinity;
        let bestMove = sortedMoves[0];
        
        // Simple minimax with limited depth
        for (const move of sortedMoves) {
          // Make the move
          const fromPiece = this.board[move.from.row][move.from.col];
          const toPiece = this.board[move.to.row][move.to.col];
          this.board[move.to.row][move.to.col] = fromPiece;
          this.board[move.from.row][move.from.col] = null;
          
          // Evaluate with one ply lookahead
          const currentTurn = this.turn;
          this.turn = this.turn === 'white' ? 'black' : 'white';
          const opponentMoves = this.getAllValidMoves();
          
          let worstScore = Infinity;
          // Limit evaluation to first 5 moves
          const movesToEvaluate = opponentMoves.slice(0, 5);
          for (const oppMove of movesToEvaluate) {
            const oppFromPiece = this.board[oppMove.from.row][oppMove.from.col];
            const oppToPiece = this.board[oppMove.to.row][oppMove.to.col];
            this.board[oppMove.to.row][oppMove.to.col] = oppFromPiece;
            this.board[oppMove.from.row][oppMove.from.col] = null;
            
            const score = this.evaluateBoard();
            
            this.board[oppMove.from.row][oppMove.from.col] = oppFromPiece;
            this.board[oppMove.to.row][oppMove.to.col] = oppToPiece;
            
            worstScore = Math.min(worstScore, score);
          }
          
          // Restore state
          this.turn = currentTurn;
          this.board[move.from.row][move.from.col] = fromPiece;
          this.board[move.to.row][move.to.col] = toPiece;
          
          // Update best move
          if (worstScore > bestScore) {
            bestScore = worstScore;
            bestMove = move;
          }
        }
        return resolve(bestMove);
      }
      
      // Default to random move if no matching difficulty
      resolve(validMoves[Math.floor(Math.random() * validMoves.length)]);
    }, 0);
  });
}

    selectMoveByDifficulty(validMoves, level) {
      switch (level) {
        case 1: // Completely random
          return this.randomMove(validMoves);
        case 2: // Prefers captures
          return this.captureOrRandomMove(validMoves, 0.3);
        case 3: // Prefers captures and checks
          return this.captureCheckOrRandomMove(validMoves, 0.5);
        case 4: // Basic material evaluation
          return this.basicMaterialMove(validMoves, 1);
        case 5: // Material + mobility
          return this.basicMaterialMove(validMoves, 2);
        case 6: // 1-ply lookahead
          return this.minimaxMove(validMoves, 1);
        case 7: // 2-ply lookahead
          return this.minimaxMove(validMoves, 2);
        case 8: // 3-ply lookahead with basic evaluation
          return this.minimaxMove(validMoves, 3);
        case 9: // 4-ply lookahead with advanced evaluation
          return this.minimaxMove(validMoves, 4);
        case 10: // 4-6 ply lookahead with alpha-beta pruning and full evaluation
          return this.alphaBetaMove(4 + Math.floor(Math.random() * 3));
        default:
          return this.randomMove(validMoves);
      }
    }
    
  }
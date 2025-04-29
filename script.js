document.addEventListener('DOMContentLoaded', () => {
  
  const PIECES = {
    WHITE: {
      KING: '♔',
      QUEEN: '♕',
      ROOK: '♖',
      BISHOP: '♗',
      KNIGHT: '♘',
      PAWN: '♙'
    },
    BLACK: {
      KING: '♚',
      QUEEN: '♛',
      ROOK: '♜',
      BISHOP: '♝',
      KNIGHT: '♞',
      PAWN: '♟'
    }
  };
  
  class PreGameUI {
    constructor(gameController) {
      this.gameController = gameController;
      this.modal = document.getElementById('pre-game-modal');
      this.startButton = document.getElementById('start-game-btn');
      
      // Default settings
      this.settings = {
        whitePlayer: 'human',
        blackPlayer: 'computer',
        difficulty: 'easy'
      };
      
      this.setupEventListeners();
    }
    
    setupEventListeners() {
      // Player type selection
      document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', () => {
          const player = option.dataset.player;
          const type = option.dataset.type;
          
          // Update active state
          document.querySelectorAll(`.avatar-option[data-player="${player}"]`).forEach(opt => {
            opt.classList.remove('active');
          });
          option.classList.add('active');
          
          // Update settings
          this.settings[`${player}Player`] = type;
          
          // If both players are computer, ensure difficulty is visible
          this.updateDifficultyVisibility();
        });
      });
      
      // Difficulty selection
      document.querySelectorAll('.difficulty-option').forEach(option => {
        option.addEventListener('click', () => {
          document.querySelectorAll('.difficulty-option').forEach(opt => {
            opt.classList.remove('active');
          });
          option.classList.add('active');
          this.settings.difficulty = option.dataset.difficulty;
        });
      });
      
      // Start game button
      this.startButton.addEventListener('click', () => {
        this.startGame();
      });
    }
    
    updateDifficultyVisibility() {
      const difficultySection = document.querySelector('.difficulty-selector');
      if (this.settings.whitePlayer === 'computer' || this.settings.blackPlayer === 'computer') {
        difficultySection.style.display = 'block';
      } else {
        difficultySection.style.display = 'none';
      }
    }
    
    startGame() {
      // Apply settings to game
      this.gameController.game.computerPlaysWhite = this.settings.whitePlayer === 'computer';
      this.gameController.game.computerPlaysBlack = this.settings.blackPlayer === 'computer';
      
      // Set difficulty
      const difficultySelect = document.getElementById('difficulty');
      if (difficultySelect) {
        difficultySelect.value = this.settings.difficulty;
      }
      
      // Hide modal
      this.modal.style.display = 'none';
      
      // Initialize game
      this.gameController.game.initializeBoard();
      this.gameController.renderBoard();
      this.gameController.updateGameInfo();
      
      // If computer plays first, start its move
      if ((this.gameController.game.turn === 'white' && this.gameController.game.computerPlaysWhite) ||
        (this.gameController.game.turn === 'black' && this.gameController.game.computerPlaysBlack)) {
        this.gameController.handleComputerTurn();
      }
    }
  }
  
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
      this.positionCounts = {};
      this.moveHistoryForRepetition = [];
      this.halfMoveClock = 0;
      this.fullMoveNumber = 1;
    }
    
    initializeBoard() {
      // Clear the board
      this.board = Array(8).fill().map(() => Array(8).fill(null));
      
      // Set up pawns
      for (let i = 0; i < 8; i++) {
        this.board[1][i] = { type: 'pawn', color: 'black', symbol: PIECES.BLACK.PAWN, hasMoved: false };
        this.board[6][i] = { type: 'pawn', color: 'white', symbol: PIECES.WHITE.PAWN, hasMoved: false };
      }
      
      // Set up rooks
      this.board[0][0] = { type: 'rook', color: 'black', symbol: PIECES.BLACK.ROOK, hasMoved: false };
      this.board[0][7] = { type: 'rook', color: 'black', symbol: PIECES.BLACK.ROOK, hasMoved: false };
      this.board[7][0] = { type: 'rook', color: 'white', symbol: PIECES.WHITE.ROOK, hasMoved: false };
      this.board[7][7] = { type: 'rook', color: 'white', symbol: PIECES.WHITE.ROOK, hasMoved: false };
      
      // Set up knights
      this.board[0][1] = { type: 'knight', color: 'black', symbol: PIECES.BLACK.KNIGHT };
      this.board[0][6] = { type: 'knight', color: 'black', symbol: PIECES.BLACK.KNIGHT };
      this.board[7][1] = { type: 'knight', color: 'white', symbol: PIECES.WHITE.KNIGHT };
      this.board[7][6] = { type: 'knight', color: 'white', symbol: PIECES.WHITE.KNIGHT };
      
      // Set up bishops
      this.board[0][2] = { type: 'bishop', color: 'black', symbol: PIECES.BLACK.BISHOP };
      this.board[0][5] = { type: 'bishop', color: 'black', symbol: PIECES.BLACK.BISHOP };
      this.board[7][2] = { type: 'bishop', color: 'white', symbol: PIECES.WHITE.BISHOP };
      this.board[7][5] = { type: 'bishop', color: 'white', symbol: PIECES.WHITE.BISHOP };
      
      // Set up queens
      this.board[0][3] = { type: 'queen', color: 'black', symbol: PIECES.BLACK.QUEEN };
      this.board[7][3] = { type: 'queen', color: 'white', symbol: PIECES.WHITE.QUEEN };
      
      // Set up kings
      this.board[0][4] = { type: 'king', color: 'black', symbol: PIECES.BLACK.KING, hasMoved: false };
      this.board[7][4] = { type: 'king', color: 'white', symbol: PIECES.WHITE.KING, hasMoved: false };
      
      this.resetGameState();
    }
    
    resetGameState() {
      this.turn = 'white';
      this.selectedSquare = null;
      this.possibleMoves = [];
      this.check = false;
      this.checkmate = false;
      this.stalemate = false;
      this.lastCapture = null;
      this.enPassantTarget = null;
      this.castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };
      // New properties
      this.positionCounts = {};
      this.moveHistoryForRepetition = [];
      this.halfMoveClock = 0;
      this.fullMoveNumber = 1;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol, promotionType = 'queen') {
      const piece = this.board[fromRow][fromCol];
      let capturedPiece = this.board[toRow][toCol];
      let isEnPassant = false;
      let isCastling = false;
      let castleRookFrom = null;
      let castleRookTo = null;
      
      // Handle en passant
      if (piece.type === 'pawn' && toCol !== fromCol && !capturedPiece) {
        if (this.enPassantTarget && this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol) {
          capturedPiece = this.board[fromRow][toCol];
          this.board[fromRow][toCol] = null;
          isEnPassant = true;
        }
      }
      
      // Handle castling
      if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
        isCastling = true;
        const kingside = toCol > fromCol;
        const rookCol = kingside ? 7 : 0;
        const newRookCol = kingside ? toCol - 1 : toCol + 1;
        
        castleRookFrom = { row: fromRow, col: rookCol };
        castleRookTo = { row: fromRow, col: newRookCol };
        
        // Move the rook
        this.board[fromRow][newRookCol] = this.board[fromRow][rookCol];
        this.board[fromRow][rookCol] = null;
      }
      
      // Record the move
      const moveNotation = this.getMoveNotation(fromRow, fromCol, toRow, toCol, capturedPiece, isCastling);
      this.moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: { ...piece },
        captured: capturedPiece ? { ...capturedPiece } : null,
        notation: moveNotation,
        isEnPassant,
        isCastling,
        castleRookFrom,
        castleRookTo,
        promotionType: piece.type === 'pawn' && (toRow === 0 || toRow === 7) ? promotionType : null
      });
      
      // Update the board
      this.board[toRow][toCol] = { ...piece, hasMoved: true };
      this.board[fromRow][fromCol] = null;
      
      // Handle pawn promotion
      if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
        this.promotePawn(toRow, toCol, piece.color, promotionType);
      }
      
      if (piece.type === 'king') {
        this.castlingRights[piece.color].kingside = false;
        this.castlingRights[piece.color].queenside = false;
      } else if (piece.type === 'rook') {
        if (fromCol === 0) {
          this.castlingRights[piece.color].queenside = false;
        } else if (fromCol === 7) {
          this.castlingRights[piece.color].kingside = false;
        }
      }
      
      this.enPassantTarget = null;
      if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
        this.enPassantTarget = {
          row: fromRow + (toRow - fromRow) / 2,
          col: fromCol
        };
      }
      
      const positionHash = this.getPositionHash();
      this.moveHistoryForRepetition.push(positionHash);
      this.positionCounts[positionHash] = (this.positionCounts[positionHash] || 0) + 1;
      
      if (piece.type === 'pawn' || capturedPiece) {
        this.halfMoveClock = 0;
      } else {
        this.halfMoveClock++;
      }
      
      if (this.turn === 'black') {
        this.fullMoveNumber++;
      }
      
      this.turn = this.turn === 'white' ? 'black' : 'white';
      
      this.checkGameStatus();
      
      if (this.uiController) {
        this.uiController.updateGameInfo();
      }
    }
    
    promotePawn(row, col, color, promotionType = 'queen') {
      const type = promotionType.toLowerCase();
      this.board[row][col].type = type;
      
      switch (type) {
        case 'queen':
          this.board[row][col].symbol = color === 'white' ? PIECES.WHITE.QUEEN : PIECES.BLACK.QUEEN;
          break;
        case 'rook':
          this.board[row][col].symbol = color === 'white' ? PIECES.WHITE.ROOK : PIECES.BLACK.ROOK;
          break;
        case 'bishop':
          this.board[row][col].symbol = color === 'white' ? PIECES.WHITE.BISHOP : PIECES.BLACK.BISHOP;
          break;
        case 'knight':
          this.board[row][col].symbol = color === 'white' ? PIECES.WHITE.KNIGHT : PIECES.BLACK.KNIGHT;
          break;
      }
    }
    
    undoMove() {
      if (this.moveHistory.length === 0) return;
      
      const lastMove = this.moveHistory.pop();
      
      // Restore the board state
      this.board[lastMove.from.row][lastMove.from.col] = { ...lastMove.piece };
      this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured ? { ...lastMove.captured } : null;
      
      // Handle en passant undo
      if (lastMove.isEnPassant) {
        this.board[lastMove.from.row][lastMove.to.col] = { ...lastMove.captured };
      }
      
      // Handle castling undo
      if (lastMove.isCastling) {
        // Move rook back
        this.board[lastMove.castleRookFrom.row][lastMove.castleRookFrom.col] =
          this.board[lastMove.castleRookTo.row][lastMove.castleRookTo.col];
        this.board[lastMove.castleRookTo.row][lastMove.castleRookTo.col] = null;
      }
      
      // Restore promotion
      if (lastMove.promotionType) {
        this.board[lastMove.from.row][lastMove.from.col].type = 'pawn';
        this.board[lastMove.from.row][lastMove.from.col].symbol =
          lastMove.piece.color === 'white' ? PIECES.WHITE.PAWN : PIECES.BLACK.PAWN;
      }
      
      // Switch turns back
      this.turn = this.turn === 'white' ? 'black' : 'white';
      
      // Clear selection
      this.selectedSquare = null;
      this.possibleMoves = [];
      
      // Reset game status
      this.check = false;
      this.checkmate = false;
      this.stalemate = false;
    }
    
    checkGameStatus() {
      const kingPos = this.findKing(this.turn);
      if (!kingPos) return;
      
      const opponentColor = this.turn === 'white' ? 'black' : 'white';
      this.check = this.isSquareAttacked(kingPos.row, kingPos.col, opponentColor);
      
      // Check automatic draws first
      if (this.isFivefoldRepetition() || this.isSeventyFiveMoveRule()) {
        this.stalemate = true;
        return { check: false, checkmate: false, stalemate: true };
      }
      
      // Check other draw conditions
      if (this.isInsufficientMaterial() ||
        this.isThreefoldRepetition() ||
        this.isFiftyMoveRuleDraw()) {
        this.stalemate = true;
        return { check: false, checkmate: false, stalemate: true };
      }
      
      // Original checkmate/stalemate logic
      let hasLegalMoves = false
      
      outerLoop: for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece && piece.color === this.turn) {
            const moves = this.getPossibleMoves(row, col);
            for (const move of moves) {
              // Test if the move would get out of check
              const result = this.testMove(row, col, move.row, move.col);
              if (result.legal) {
                hasLegalMoves = true;
                break outerLoop;
              }
            }
          }
        }
      }
      
      if (!hasLegalMoves) {
        if (this.check) {
          this.checkmate = true;
        } else {
          this.stalemate = true;
        }
      } else {
        // Reset these flags if there are legal moves
        this.checkmate = false;
        this.stalemate = false;
      }
      
      return {
        check: this.check,
        checkmate: this.checkmate,
        stalemate: this.stalemate
      };
    }
    
    testMove(fromRow, fromCol, toRow, toCol) {
      // Save the current board state
      const tempBoard = JSON.parse(JSON.stringify(this.board));
      const tempTurn = this.turn;
      const tempCheck = this.check;
      const tempEnPassantTarget = this.enPassantTarget;
      
      // Make the move
      const piece = this.board[fromRow][fromCol];
      const capturedPiece = this.board[toRow][toCol];
      
      // Update board temporarily
      this.board[toRow][toCol] = { ...piece };
      this.board[fromRow][fromCol] = null;
      
      // Handle en passant capture
      let enPassantCapture = false;
      if (piece.type === 'pawn' && toCol !== fromCol && !capturedPiece) {
        if (this.enPassantTarget && this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol) {
          this.board[fromRow][toCol] = null; // Remove the captured pawn
          enPassantCapture = true;
        }
      }
      
      // Check if king is in check after this move
      const kingPos = this.findKing(this.turn);
      const opponentColor = this.turn === 'white' ? 'black' : 'white';
      const inCheck = kingPos ? this.isSquareAttacked(kingPos.row, kingPos.col, opponentColor) : false;
      
      // Restore the board state
      this.board = tempBoard;
      this.turn = tempTurn;
      this.check = tempCheck;
      this.enPassantTarget = tempEnPassantTarget;
      
      return {
        legal: !inCheck,
        enPassantCapture
      };
    }
    
    getPossibleMoves(row, col) {
      const piece = this.board[row][col];
      if (!piece || piece.color !== this.turn) return [];
      
      const moves = [];
      
      switch (piece.type) {
        case 'pawn':
          this.getPawnMoves(row, col, piece.color, moves);
          break;
        case 'rook':
          this.getRookMoves(row, col, piece.color, moves);
          break;
        case 'knight':
          this.getKnightMoves(row, col, piece.color, moves);
          break;
        case 'bishop':
          this.getBishopMoves(row, col, piece.color, moves);
          break;
        case 'queen':
          this.getRookMoves(row, col, piece.color, moves);
          this.getBishopMoves(row, col, piece.color, moves);
          break;
        case 'king':
          this.getKingMoves(row, col, piece.color, moves);
          this.getCastlingMoves(row, col, piece.color, moves);
          break;
      }
      
      // Filter out moves that would leave the king in check
      return moves.filter(move => {
        // Simulate the move
        const originalPiece = this.board[move.row][move.col];
        const originalEnPassant = this.enPassantTarget;
        const originalCastlingRights = JSON.parse(JSON.stringify(this.castlingRights));
        
        // Handle special moves in simulation
        let capturedPiece = originalPiece;
        if (piece.type === 'pawn' && move.col !== col && !originalPiece && this.enPassantTarget &&
          this.enPassantTarget.row === move.row && this.enPassantTarget.col === move.col) {
          capturedPiece = this.board[row][move.col];
          this.board[row][move.col] = null;
        }
        
        this.board[move.row][move.col] = { ...piece };
        this.board[row][col] = null;
        
        // Check if the king is in check after the move
        const kingPos = piece.type === 'king' ? { row: move.row, col: move.col } : this.findKing(piece.color);
        const isInCheck = kingPos && this.isSquareAttacked(kingPos.row, kingPos.col, piece.color === 'white' ? 'black' : 'white');
        
        // Revert the simulated move
        this.board[row][col] = { ...piece };
        this.board[move.row][move.col] = originalPiece;
        
        // Restore en passant captured pawn if needed
        if (piece.type === 'pawn' && move.col !== col && !originalPiece && capturedPiece) {
          this.board[row][move.col] = capturedPiece;
        }
        
        this.enPassantTarget = originalEnPassant;
        this.castlingRights = originalCastlingRights;
        
        return !isInCheck;
      });
    }
    
    getCastlingMoves(row, col, color, moves) {
      if (this.check) return; // Can't castle while in check
      
      const kingside = this.castlingRights[color].kingside;
      const queenside = this.castlingRights[color].queenside;
      
      if (kingside) {
        // Check if squares between king and rook are empty and not attacked
        if (!this.board[row][5] && !this.board[row][6]) {
          if (!this.isSquareAttacked(row, 4, color === 'white' ? 'black' : 'white') &&
            !this.isSquareAttacked(row, 5, color === 'white' ? 'black' : 'white') &&
            !this.isSquareAttacked(row, 6, color === 'white' ? 'black' : 'white')) {
            moves.push({ row, col: col + 2, isCastling: true });
          }
        }
      }
      
      if (queenside) {
        // Check if squares between king and rook are empty and not attacked
        if (!this.board[row][3] && !this.board[row][2] && !this.board[row][1]) {
          if (!this.isSquareAttacked(row, 4, color === 'white' ? 'black' : 'white') &&
            !this.isSquareAttacked(row, 3, color === 'white' ? 'black' : 'white') &&
            !this.isSquareAttacked(row, 2, color === 'white' ? 'black' : 'white')) {
            moves.push({ row, col: col - 2, isCastling: true });
          }
        }
      }
    }
    
    getPawnMoves(row, col, color, moves) {
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      
      // Forward move
      if (this.isValidSquare(row + direction, col) && !this.board[row + direction][col]) {
        moves.push({ row: row + direction, col });
        
        // Double move from starting position
        if (row === startRow && !this.board[row + 2 * direction][col]) {
          moves.push({ row: row + 2 * direction, col });
        }
      }
      
      // Capture moves
      for (const colOffset of [-1, 1]) {
        const newCol = col + colOffset;
        if (this.isValidSquare(row + direction, newCol)) {
          const targetPiece = this.board[row + direction][newCol];
          if (targetPiece && targetPiece.color !== color) {
            moves.push({ row: row + direction, col: newCol });
          }
          // En passant
          else if (!targetPiece && this.enPassantTarget &&
            this.enPassantTarget.row === row + direction &&
            this.enPassantTarget.col === newCol) {
            const adjacentPawn = this.board[row][newCol];
            if (adjacentPawn && adjacentPawn.type === 'pawn' && adjacentPawn.color !== color) {
              moves.push({ row: row + direction, col: newCol, isEnPassant: true });
            }
          }
        }
      }
    }
    
    getRookMoves(row, col, color, moves) {
      const directions = [
        { dr: -1, dc: 0 }, // up
        { dr: 1, dc: 0 }, // down
        { dr: 0, dc: -1 }, // left
        { dr: 0, dc: 1 } // right
      ];
      
      this.getSlidingMoves(row, col, color, directions, moves);
    }
    
    getBishopMoves(row, col, color, moves) {
      const directions = [
        { dr: -1, dc: -1 }, // up-left
        { dr: -1, dc: 1 }, // up-right
        { dr: 1, dc: -1 }, // down-left
        { dr: 1, dc: 1 } // down-right
      ];
      
      this.getSlidingMoves(row, col, color, directions, moves);
    }
    
    getKnightMoves(row, col, color, moves) {
      const knightMoves = [
        { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
        { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
        { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
        { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
      ];
      
      for (const move of knightMoves) {
        const newRow = row + move.dr;
        const newCol = col + move.dc;
        
        if (this.isValidSquare(newRow, newCol)) {
          const targetPiece = this.board[newRow][newCol];
          if (!targetPiece || targetPiece.color !== color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    }
    
    getKingMoves(row, col, color, moves) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          
          const newRow = row + dr;
          const newCol = col + dc;
          
          if (this.isValidSquare(newRow, newCol)) {
            const targetPiece = this.board[newRow][newCol];
            if (!targetPiece || targetPiece.color !== color) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    }
    
    getSlidingMoves(row, col, color, directions, moves) {
      for (const dir of directions) {
        let newRow = row + dir.dr;
        let newCol = col + dir.dc;
        
        while (this.isValidSquare(newRow, newCol)) {
          const targetPiece = this.board[newRow][newCol];
          
          if (!targetPiece) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (targetPiece.color !== color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
          
          newRow += dir.dr;
          newCol += dir.dc;
        }
      }
    }
    
    isValidSquare(row, col) {
      return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    findKing(color) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece && piece.type === 'king' && piece.color === color) {
            return { row, col };
          }
        }
      }
      return null;
    }
    
    isSquareAttacked(row, col, byColor) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = this.board[r][c];
          if (piece && piece.color === byColor) {
            const moves = [];
            
            switch (piece.type) {
              case 'pawn':
                // Pawns attack diagonally
                const direction = piece.color === 'white' ? -1 : 1;
                for (const colOffset of [-1, 1]) {
                  if (r + direction === row && c + colOffset === col) {
                    return true;
                  }
                }
                break;
              case 'knight':
                this.getKnightMoves(r, c, piece.color, moves);
                break;
              case 'bishop':
                this.getBishopMoves(r, c, piece.color, moves);
                break;
              case 'rook':
                this.getRookMoves(r, c, piece.color, moves);
                break;
              case 'queen':
                this.getRookMoves(r, c, piece.color, moves);
                this.getBishopMoves(r, c, piece.color, moves);
                break;
              case 'king':
                this.getKingMoves(r, c, piece.color, moves);
                break;
            }
            
            if (moves.some(m => m.row === row && m.col === col)) {
              return true;
            }
          }
        }
      }
      return false;
    }
    
    getMoveNotation(fromRow, fromCol, toRow, toCol, capturedPiece, isCastling) {
      const piece = this.board[fromRow][fromCol];
      let notation = '';
      
      // Handle castling notation
      if (isCastling) {
        return toCol > fromCol ? 'O-O' : 'O-O-O';
      }
      
      // Piece letter (except pawn)
      if (piece.type !== 'pawn') {
        notation = piece.type === 'knight' ? 'N' : piece.type[0].toUpperCase();
      }
      
      // Disambiguation for pieces that can move to the same square
      if (piece.type !== 'pawn' && !isCastling) {
        let samePieces = 0;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = this.board[r][c];
            if (p && p.type === piece.type && p.color === piece.color &&
              !(r === fromRow && c === fromCol)) {
              const moves = this.getPossibleMoves(r, c);
              if (moves.some(m => m.row === toRow && m.col === toCol)) {
                samePieces++;
                break;
              }
            }
          }
        }
        
        if (samePieces > 0) {
          // If pieces are in the same column, use row disambiguation
          const sameColumn = Array(8).fill().some((_, r) => {
            const p = this.board[r][fromCol];
            return r !== fromRow && p && p.type === piece.type && p.color === piece.color;
          });
          
          if (sameColumn) {
            notation += String.fromCharCode(97 + fromCol);
          } else {
            notation += (8 - fromRow);
          }
        }
      }
      
      // Capture
      if (capturedPiece) {
        if (piece.type === 'pawn') {
          notation += String.fromCharCode(97 + fromCol);
        }
        notation += 'x';
      }
      
      // Destination square
      notation += String.fromCharCode(97 + toCol) + (8 - toRow);
      
      // Check/checkmate
      const opponentColor = piece.color === 'white' ? 'black' : 'white';
      const kingPos = this.findKing(opponentColor);
      if (kingPos && this.isSquareAttacked(kingPos.row, kingPos.col, piece.color)) {
        // Simulate the move to see if it's checkmate
        const originalBoard = JSON.parse(JSON.stringify(this.board));
        this.board[toRow][toCol] = { ...piece };
        this.board[fromRow][fromCol] = null;
        
        let hasLegalMoves = false;
        outerLoop: for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = this.board[r][c];
            if (p && p.color === opponentColor) {
              const moves = this.getPossibleMoves(r, c);
              if (moves.length > 0) {
                hasLegalMoves = true;
                break outerLoop;
              }
            }
          }
        }
        
        // Restore board
        this.board = originalBoard;
        
        notation += hasLegalMoves ? '+' : '#';
      }
      
      return notation;
    }
    
    isInsufficientMaterial() {
      const pieces = { white: [], black: [] };
      
      // Count all pieces
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece) {
            pieces[piece.color].push(piece.type);
          }
        }
      }
      
      // Check all insufficient material scenarios
      const insufficient = (pieces) => {
        // King vs King
        if (pieces.length === 1 && pieces[0] === 'king') return true;
        
        // King + bishop vs King
        if (pieces.length === 2 && pieces.includes('king') && pieces.includes('bishop')) return true;
        
        // King + knight vs King
        if (pieces.length === 2 && pieces.includes('king') && pieces.includes('knight')) return true;
        
        // King + bishop vs King + bishop with bishops on same color
        if (pieces.filter(p => p === 'bishop').length === 2) {
          const bishops = [];
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              const piece = this.board[row][col];
              if (piece && piece.type === 'bishop') {
                bishops.push((row + col) % 2 === 0 ? 'light' : 'dark');
              }
            }
          }
          if (bishops.length === 2 && bishops[0] === bishops[1]) return true;
        }
        
        return false;
      };
      
      return insufficient(pieces.white) && insufficient(pieces.black);
    }
    
    getPositionHash() {
      let hash = '';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          hash += piece ?
            `${piece.color[0]}${piece.type[0]}${piece.hasMoved ? '1' : '0'}` :
            '---';
        }
      }
      hash += this.turn[0];
      hash += this.castlingRights.white.kingside ? '1' : '0';
      hash += this.castlingRights.white.queenside ? '1' : '0';
      hash += this.castlingRights.black.kingside ? '1' : '0';
      hash += this.castlingRights.black.queenside ? '1' : '0';
      hash += this.enPassantTarget ? `${this.enPassantTarget.row}${this.enPassantTarget.col}` : '--';
      return hash;
    }
    
    isThreefoldRepetition() {
      const currentPosition = this.getPositionHash();
      return (this.positionCounts[currentPosition] || 0) >= 3;
    }
    
    isFiftyMoveRuleDraw() {
      return this.halfMoveClock >= 50;
    }
    
    isFivefoldRepetition() {
      const currentPosition = this.getPositionHash();
      return (this.positionCounts[currentPosition] || 0) >= 5;
    }
    
    isSeventyFiveMoveRule() {
      return this.halfMoveClock >= 75;
    }
    
    async playComputerMove(difficulty = 'medium') {
      if (this.checkmate || this.stalemate) return null;
      if (this.turn === 'white' && !this.computerPlaysWhite) return null;
      if (this.turn === 'black' && !this.computerPlaysBlack) return null;
      
      this.isComputerThinking = true;
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const move = await this.findBestMove(difficulty);
        return move;
      } finally {
        this.isComputerThinking = false;
      }
    }
    
    async findBestMove(difficulty) {
      return new Promise(resolve => {
        setTimeout(() => {
          const validMoves = this.getAllValidMoves();
          if (validMoves.length === 0) return resolve(null);
          
          // Convert numeric difficulty to corresponding algorithm
          let difficultyLevel;
          
          // Ensure the difficulty is properly normalized to avoid octal interpretation
          let diffNum;
          if (typeof difficulty === 'string') {
            // Remove any leading zeros to avoid octal interpretation
            const normalizedDiff = difficulty.replace(/^0+/, '') || '0';
            diffNum = parseInt(normalizedDiff, 10);
          } else {
            diffNum = difficulty;
          }
          
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
            difficultyLevel = typeof difficulty === 'string' && ['random', 'easy', 'medium', 'hard', 'advanced'].includes(difficulty) ?
              difficulty : 'medium'; // Default to medium if not recognized
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
    
    randomMove(validMoves) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    captureOrRandomMove(validMoves, captureProbability) {
      const captures = validMoves.filter(move => move.capture);
      if (captures.length > 0 && Math.random() < captureProbability) {
        return this.randomMove(captures);
      }
      return this.randomMove(validMoves);
    }
    
    captureCheckOrRandomMove(validMoves, goodMoveProbability) {
      const checksAndCaptures = validMoves.filter(move =>
        move.capture || this.moveGivesCheck(move)
      );
      
      if (checksAndCaptures.length > 0 && Math.random() < goodMoveProbability) {
        return this.randomMove(checksAndCaptures);
      }
      return this.randomMove(validMoves);
    }
    
    moveGivesCheck(move) {
      // Simulate the move
      const originalBoard = JSON.parse(JSON.stringify(this.board));
      this.board[move.to.row][move.to.col] = { ...move.piece };
      this.board[move.from.row][move.from.col] = null;
      
      // Check if opponent is in check
      const opponentColor = this.turn === 'white' ? 'black' : 'white';
      const kingPos = this.findKing(opponentColor);
      const givesCheck = kingPos && this.isSquareAttacked(kingPos.row, kingPos.col, this.turn);
      
      // Restore board
      this.board = originalBoard;
      
      return givesCheck;
    }
    
    basicMaterialMove(validMoves, depth) {
      if (depth === 0) {
        return this.randomMove(validMoves);
      }
      
      let bestScore = -Infinity;
      let bestMoves = [];
      
      for (const move of validMoves) {
        // Make the move
        this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
        
        // Evaluate the position
        let score = this.evaluateMaterial();
        
        if (depth > 1) {
          // Consider opponent's best response
          const opponentMoves = this.getAllValidMoves();
          let opponentBestScore = Infinity;
          
          for (const oppMove of opponentMoves) {
            this.makeMove(oppMove.from.row, oppMove.from.col, oppMove.to.row, oppMove.to.col);
            const oppScore = this.evaluateMaterial();
            this.undoMove();
            
            if (oppScore < opponentBestScore) {
              opponentBestScore = oppScore;
            }
          }
          
          score -= opponentBestScore * 0.5;
        }
        
        // Undo the move
        this.undoMove();
        
        // Track best moves
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }
      
      return this.randomMove(bestMoves);
    }
    
    evaluateMaterial() {
      let score = 0;
      const pieceValues = {
        pawn: 1,
        knight: 3,
        bishop: 3.2, // Slight bishop bonus
        rook: 5,
        queen: 9,
        king: 0
      };
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece) {
            const value = pieceValues[piece.type] || 0;
            score += piece.color === this.turn ? value : -value;
          }
        }
      }
      return score;
    }
    
    minimaxMove(validMoves, depth) {
      let bestScore = -Infinity;
      let bestMoves = [];
      
      for (const move of validMoves) {
        this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
        const score = -this.minimax(depth - 1, -Infinity, Infinity, false);
        this.undoMove();
        
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }
      
      return this.randomMove(bestMoves);
    }
    
    minimax(depth, alpha, beta, isMaximizing) {
      if (depth === 0) {
        return this.evaluatePosition();
      }
      
      const validMoves = this.getAllValidMoves();
      
      if (validMoves.length === 0) {
        const kingPos = this.findKing(this.turn);
        if (kingPos && this.isSquareAttacked(kingPos.row, kingPos.col,
            this.turn === 'white' ? 'black' : 'white')) {
          return isMaximizing ? -Infinity : Infinity; // Checkmate
        }
        return 0; // Stalemate
      }
      
      if (isMaximizing) {
        let maxScore = -Infinity;
        for (const move of validMoves) {
          this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
          const score = this.minimax(depth - 1, alpha, beta, false);
          this.undoMove();
          
          maxScore = Math.max(maxScore, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break;
        }
        return maxScore;
      } else {
        let minScore = Infinity;
        for (const move of validMoves) {
          this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
          const score = this.minimax(depth - 1, alpha, beta, true);
          this.undoMove();
          
          minScore = Math.min(minScore, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
        return minScore;
      }
    }
    
    alphaBetaMove(depth) {
      let bestScore = -Infinity;
      let bestMoves = [];
      let alpha = -Infinity;
      let beta = Infinity;
      
      // Sort moves to improve alpha-beta efficiency
      const sortedMoves = this.orderMoves(this.getAllValidMoves());
      
      for (const move of sortedMoves) {
        this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
        const score = -this.alphaBeta(depth - 1, -beta, -alpha, false);
        this.undoMove();
        
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
          alpha = Math.max(alpha, score);
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }
      
      return this.randomMove(bestMoves);
    }
    
    alphaBeta(depth, alpha, beta, isMaximizing) {
      if (depth === 0) {
        return this.quiescenceSearch(alpha, beta, isMaximizing);
      }
      
      const validMoves = this.getAllValidMoves();
      
      if (validMoves.length === 0) {
        const kingPos = this.findKing(this.turn);
        if (kingPos && this.isSquareAttacked(kingPos.row, kingPos.col,
            this.turn === 'white' ? 'black' : 'white')) {
          return isMaximizing ? -Infinity : Infinity; // Checkmate
        }
        return 0; // Stalemate
      }
      
      const sortedMoves = this.orderMoves(validMoves);
      let bestScore = isMaximizing ? -Infinity : Infinity;
      
      for (const move of sortedMoves) {
        this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
        const score = -this.alphaBeta(depth - 1, -beta, -alpha, !isMaximizing);
        this.undoMove();
        
        if (isMaximizing) {
          bestScore = Math.max(bestScore, score);
          alpha = Math.max(alpha, score);
        } else {
          bestScore = Math.min(bestScore, score);
          beta = Math.min(beta, score);
        }
        
        if (beta <= alpha) {
          break;
        }
      }
      
      return bestScore;
    }
    
    quiescenceSearch(alpha, beta, isMaximizing) {
      const standPat = this.evaluatePosition();
      
      if (standPat >= beta) {
        return beta;
      }
      
      if (alpha < standPat) {
        alpha = standPat;
      }
      
      // Only consider captures
      const captureMoves = this.getAllValidMoves().filter(move => move.capture);
      const sortedCaptures = this.orderMoves(captureMoves);
      
      for (const move of sortedCaptures) {
        // Delta pruning - skip if the capture can't possibly raise alpha
        const capturedValue = this.getPieceValue(this.board[move.to.row][move.to.col]);
        const movingValue = this.getPieceValue(move.piece);
        if (standPat + capturedValue - movingValue + 200 < alpha) {
          continue;
        }
        
        this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
        const score = -this.quiescenceSearch(-beta, -alpha, !isMaximizing);
        this.undoMove();
        
        if (score >= beta) {
          return beta;
        }
        if (score > alpha) {
          alpha = score;
        }
      }
      
      return alpha;
    }
    
    orderMoves(moves) {
      // Sort moves to improve alpha-beta efficiency
      return moves.sort((a, b) => {
        // Captures first (MVV-LVA - most valuable victim, least valuable attacker)
        if (a.capture && b.capture) {
          const aVictim = this.board[a.to.row][a.to.col];
          const bVictim = this.board[b.to.row][b.to.col];
          const aScore = this.getPieceValue(aVictim) - this.getPieceValue(a.piece) / 10;
          const bScore = this.getPieceValue(bVictim) - this.getPieceValue(b.piece) / 10;
          return bScore - aScore;
        }
        if (a.capture) return -1;
        if (b.capture) return 1;
        
        // Then checks
        const aCheck = this.moveGivesCheck(a);
        const bCheck = this.moveGivesCheck(b);
        if (aCheck && !bCheck) return -1;
        if (bCheck && !aCheck) return 1;
        
        // Then promotions
        if (a.special === 'promotion' && b.special !== 'promotion') return -1;
        if (b.special === 'promotion' && a.special !== 'promotion') return 1;
        
        // Then castling
        if (a.special && a.special.startsWith('castle') &&
          !(b.special && b.special.startsWith('castle'))) {
          return -1;
        }
        if (b.special && b.special.startsWith('castle') &&
          !(a.special && a.special.startsWith('castle'))) {
          return 1;
        }
        
        return 0;
      });
    }
    
    evaluatePosition() {
      let score = 0;
      
      // Material
      score += this.evaluateMaterial();
      
      // Piece-square tables (encourages pieces to good squares)
      score += this.evaluatePieceSquareTables();
      
      // Mobility - number of legal moves
      const currentTurn = this.turn;
      const opponentColor = currentTurn === 'white' ? 'black' : 'white';
      
      this.turn = currentTurn;
      const mobility = this.getAllValidMoves().length;
      score += mobility * 0.1;
      
      this.turn = opponentColor;
      const opponentMobility = this.getAllValidMoves().length;
      score -= opponentMobility * 0.1;
      
      this.turn = currentTurn;
      
      // King safety
      score += this.evaluateKingSafety();
      
      // Pawn structure
      score += this.evaluatePawnStructure();
      
      // Center control
      score += this.evaluateCenterControl();
      
      return score;
    }
    
    evaluatePieceSquareTables() {
      // Piece-square tables for each piece type (values from - to 0.5)
      const tables = {
        pawn: [
          [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
          [0.1, 0.1, 0.1, 0.2, 0.2, 0.1, 0.1, 0.1],
          [0.1, 0.0, 0.0, 0.3, 0.3, 0.0, 0.0, 0.1],
          [0.1, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.1],
          [0.2, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.2],
          [0.3, 0.3, 0.4, 0.5, 0.5, 0.4, 0.3, 0.3],
          [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
          [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        ],
        knight: [
          [0.0, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0.0],
          [0.1, 0.3, 0.4, 0.4, 0.4, 0.4, 0.3, 0.1],
          [0.2, 0.4, 0.5, 0.5, 0.5, 0.5, 0.4, 0.2],
          [0.2, 0.4, 0.5, 0.5, 0.5, 0.5, 0.4, 0.2],
          [0.2, 0.4, 0.5, 0.5, 0.5, 0.5, 0.4, 0.2],
          [0.2, 0.4, 0.5, 0.5, 0.5, 0.5, 0.4, 0.2],
          [0.1, 0.3, 0.4, 0.4, 0.4, 0.4, 0.3, 0.1],
          [0.0, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0.0]
        ],
        bishop: [
          [0.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.0],
          [0.1, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1],
          [0.1, 0.2, 0.3, 0.3, 0.3, 0.3, 0.2, 0.1],
          [0.1, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.1],
          [0.1, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.1],
          [0.1, 0.2, 0.3, 0.3, 0.3, 0.3, 0.2, 0.1],
          [0.1, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1],
          [0.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.0]
        ],
        rook: [
          [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
          [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
          [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
          [0.3, 0.3, 0.3, 0.4, 0.4, 0.3, 0.3, 0.3]
        ],
        queen: [
          [0.0, 0.1, 0.1, 0.2, 0.2, 0.1, 0.1, 0.0],
          [0.1, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1],
          [0.1, 0.2, 0.3, 0.3, 0.3, 0.3, 0.2, 0.1],
          [0.2, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.2],
          [0.2, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.2],
          [0.1, 0.2, 0.3, 0.3, 0.3, 0.3, 0.2, 0.1],
          [0.1, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1],
          [0.0, 0.1, 0.1, 0.2, 0.2, 0.1, 0.1, 0.0]
        ],
        king: {
          midgame: [
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.1, 0.1],
            [0.2, 0.3, 0.1, 0.0, 0.0, 0.1, 0.3, 0.2]
          ],
          endgame: [
            [0.3, 0.4, 0.4, 0.3, 0.3, 0.4, 0.4, 0.3],
            [0.4, 0.5, 0.5, 0.4, 0.4, 0.5, 0.5, 0.4],
            [0.4, 0.5, 0.5, 0.4, 0.4, 0.5, 0.5, 0.4],
            [0.3, 0.4, 0.4, 0.3, 0.3, 0.4, 0.4, 0.3],
            [0.2, 0.3, 0.3, 0.2, 0.2, 0.3, 0.3, 0.2],
            [0.1, 0.2, 0.2, 0.1, 0.1, 0.2, 0.2, 0.1],
            [0.0, 0.1, 0.1, 0.0, 0.0, 0.1, 0.1, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
          ]
        }
      };
      
      let score = 0;
      const isEndgame = this.isEndgamePosition();
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece) {
            let table;
            if (piece.type === 'king') {
              table = isEndgame ? tables.king.endgame : tables.king.midgame;
            } else {
              table = tables[piece.type];
            }
            
            if (table) {
              const tableRow = piece.color === 'white' ? 7 - row : row;
              const tableCol = piece.color === 'white' ? col : 7 - col;
              const value = table[tableRow][tableCol];
              score += piece.color === this.turn ? value : -value;
            }
          }
        }
      }
      return score;
    }
    
    isEndgamePosition() {
      
      let queenCount = 0;
      let rookCount = 0;
      let minorPieceCount = 0;
      let totalPieceCount = 0;
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece) {
            totalPieceCount++;
            if (piece.type === 'queen') queenCount++;
            if (piece.type === 'rook') rookCount++;
            if (piece.type === 'bishop' || piece.type === 'knight') minorPieceCount++;
          }
        }
      }
      
      return (queenCount === 0 ||
        totalPieceCount <= 10 ||
        (queenCount <= 2 && (rookCount + minorPieceCount) <= 4));
    }
    
    evaluateKingSafety() {
      let score = 0;
      const kingPos = this.findKing(this.turn);
      const opponentColor = this.turn === 'white' ? 'black' : 'white';
      
      if (kingPos) {
        // Penalize king in the center in the opening/middlegame
        const centerDistance = Math.max(
          Math.abs(kingPos.row - 3.5),
          Math.abs(kingPos.col - 3.5)
        );
        score -= centerDistance * 0.1;
        
        // Penalize if king is attacked
        const isAttacked = this.isSquareAttacked(kingPos.row, kingPos.col, opponentColor);
        if (isAttacked) {
          score -= 0.5;
        }
      }
      
      return score;
    }
    
    evaluatePawnStructure() {
      let score = 0;
      const pawnCount = { white: 0, black: 0 };
      const doubledPawns = { white: 0, black: 0 };
      const isolatedPawns = { white: 0, black: 0 };
      const passedPawns = { white: 0, black: 0 };
      
      // Count pawns and check for doubled pawns
      for (let col = 0; col < 8; col++) {
        let whitePawnsInFile = 0;
        let blackPawnsInFile = 0;
        
        for (let row = 0; row < 8; row++) {
          const piece = this.board[row][col];
          if (piece && piece.type === 'pawn') {
            if (piece.color === 'white') {
              whitePawnsInFile++;
              pawnCount.white++;
            } else {
              blackPawnsInFile++;
              pawnCount.black++;
            }
          }
        }
        
        if (whitePawnsInFile > 1) doubledPawns.white += whitePawnsInFile - 1;
        if (blackPawnsInFile > 1) doubledPawns.black += blackPawnsInFile - 1;
      }
      
      // Check for isolated and passed pawns
      for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 8; row++) {
          const piece = this.board[row][col];
          if (piece && piece.type === 'pawn') {
            // Check if pawn is isolated (no friendly pawns on adjacent files)
            let hasAdjacentPawn = false;
            for (const adjCol of [col - 1, col + 1]) {
              if (adjCol >= 0 && adjCol < 8) {
                for (let r = 0; r < 8; r++) {
                  const adjPiece = this.board[r][adjCol];
                  if (adjPiece && adjPiece.type === 'pawn' &&
                    adjPiece.color === piece.color) {
                    hasAdjacentPawn = true;
                    break;
                  }
                }
              }
            }
            
            if (!hasAdjacentPawn) {
              if (piece.color === 'white') {
                isolatedPawns.white++;
              } else {
                isolatedPawns.black++;
              }
            }
            
            // Check if pawn is passed (no enemy pawns in front or on adjacent files)
            let isPassed = true;
            const direction = piece.color === 'white' ? -1 : 1;
            const startRow = piece.color === 'white' ? row - 1 : row + 1;
            const endRow = piece.color === 'white' ? 0 : 7;
            
            for (let r = startRow; r !== endRow + direction; r += direction) {
              // Check current file
              const frontPiece = this.board[r][col];
              if (frontPiece && frontPiece.type === 'pawn' &&
                frontPiece.color !== piece.color) {
                isPassed = false;
                break;
              }
              
              // Check adjacent files
              for (const adjCol of [col - 1, col + 1]) {
                if (adjCol >= 0 && adjCol < 8) {
                  const adjPiece = this.board[r][adjCol];
                  if (adjPiece && adjPiece.type === 'pawn' &&
                    adjPiece.color !== piece.color) {
                    isPassed = false;
                    break;
                  }
                }
              }
              if (!isPassed) break;
            }
            
            if (isPassed) {
              if (piece.color === 'white') {
                passedPawns.white++;
              } else {
                passedPawns.black++;
              }
            }
          }
        }
      }
      
      // Apply penalties and bonuses
      if (this.turn === 'white') {
        score -= doubledPawns.white * 0.5;
        score -= isolatedPawns.white * 0.5;
        score += passedPawns.white * 1.0;
        score += doubledPawns.black * 0.5;
        score += isolatedPawns.black * 0.5;
        score -= passedPawns.black * 1.0;
      } else {
        score += doubledPawns.white * 0.5;
        score += isolatedPawns.white * 0.5;
        score -= passedPawns.white * 1.0;
        score -= doubledPawns.black * 0.5;
        score -= isolatedPawns.black * 0.5;
        score += passedPawns.black * 1.0;
      }
      
      return score;
    }
    
    evaluateCenterControl() {
      const centerSquares = [
        { row: 3, col: 3 }, { row: 3, col: 4 },
        { row: 4, col: 3 }, { row: 4, col: 4 }
      ];
      
      let score = 0;
      
      for (const square of centerSquares) {
        const piece = this.board[square.row][square.col];
        if (piece) {
          if (piece.color === this.turn) {
            score += 0.2;
          } else {
            score -= 0.2;
          }
        }
      }
      
      return score;
    }
    
    getAllValidMoves() {
      const validMoves = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece && piece.color === this.turn) {
            const moves = this.getPossibleMoves(row, col);
            for (const move of moves) {
              // Test if this move would be legal (doesn't leave king in check)
              const result = this.testMove(row, col, move.row, move.col);
              if (result.legal) {
                validMoves.push({
                  from: { row, col },
                  to: { row: move.row, col: move.col },
                  piece: piece,
                  // Include additional information if needed
                  capture: this.board[move.row][move.col] ? true : result.enPassantCapture,
                  special: this.getSpecialMoveType(piece, row, col, move.row, move.col)
                });
              }
            }
          }
        }
      }
      return validMoves;
    }
    
    getSpecialMoveType(piece, fromRow, fromCol, toRow, toCol) {
      // Castling
      if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
        return toCol > fromCol ? 'castle-kingside' : 'castle-queenside';
      }
      
      // En passant
      if (piece.type === 'pawn' && toCol !== fromCol && !this.board[toRow][toCol]) {
        if (this.enPassantTarget && this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol) {
          return 'en-passant';
        }
      }
      
      // Pawn promotion
      if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
        return 'promotion';
      }
      
      return null;
    }
    
    evaluateBoard() {
      let score = 0;
      const pieceValues = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 0
      };
      
      // Material score
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece) {
            const value = pieceValues[piece.type] || 0;
            score += piece.color === this.turn ? value : -value;
          }
        }
      }
      
      // Mobility score
      const currentTurn = this.turn;
      const opponentColor = currentTurn === 'white' ? 'black' : 'white';
      
      this.turn = currentTurn;
      score += this.getAllValidMoves().length * 0.05;
      
      this.turn = opponentColor;
      score -= this.getAllValidMoves().length * 0.05;
      
      this.turn = currentTurn;
      
      // King safety
      const kingPos = this.findKing(this.turn);
      if (kingPos) {
        const centerDistance = Math.max(
          Math.abs(kingPos.row - 3.5),
          Math.abs(kingPos.col - 3.5)
        );
        score -= centerDistance * 0.1;
      }
      
      // Pawn structure
      for (let col = 0; col < 8; col++) {
        let pawnCount = 0;
        for (let row = 0; row < 8; row++) {
          const piece = this.board[row][col];
          if (piece && piece.type === 'pawn' && piece.color === this.turn) {
            pawnCount++;
          }
        }
        if (pawnCount > 1) {
          score -= 0.5 * (pawnCount - 1);
        }
      }
      
      return score;
    }
    
    getPieceValue(piece) {
      const values = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 0
      };
      return values[piece.type] || 0;
    }
  }
  
  class ChessUIController {
    constructor(game) {
      this.game = game;
      this.chessboard = document.getElementById('chessboard');
      this.turnIndicator = document.getElementById('turn-indicator');
      this.gameStatus = document.getElementById('game-status');
      this.moveHistory = document.getElementById('move-history');
      this.undoBtn = document.getElementById('undo-btn');
      this.flipBoardBtn = document.getElementById('flip-board');
      this.newGameBtn = document.getElementById('new-game');
      this.computerWhiteCheckbox = document.getElementById('computer-white');
      this.computerBlackCheckbox = document.getElementById('computer-black');
      this.difficultySelect = document.getElementById('difficulty');
      this.cloneExists = false;
      
      // Sound initialization with fallbacks
      this.moveSound = { play: () => {} };
      this.captureSound = { play: () => {} };
      this.checkSound = { play: () => {} };
      this.gameEndSound = { play: () => {} };
      
      try {
        this.moveSound = new Audio('/move-self.mp3');
        this.captureSound = new Audio('/capture.mp3');
        this.checkSound = new Audio('/move-check.mp3');
        this.gameEndSound = new Audio('/notify.mp3');
        
        // Preload sounds
        [this.moveSound, this.captureSound, this.checkSound, this.gameEndSound].forEach(sound => {
          sound.load().catch(e => console.error("Sound load error:", e));
        });
      } catch (e) {
        console.error("Sound initialization failed:", e);
      }
      
      this.setupEventListeners();
    }
    
    setupEventListeners() {
      this.undoBtn.addEventListener('click', () => {
        this.game.undoMove();
        this.renderBoard();
        this.updateGameInfo();
      });
      
      this.flipBoardBtn.addEventListener('click', () => {
        this.game.boardOrientation = this.game.boardOrientation === 'white' ? 'black' : 'white';
        this.renderBoard();
      });
      
      this.newGameBtn.addEventListener('click', () => {
        this.game.initializeBoard();
        this.renderBoard();
        this.updateGameInfo();
        this.game.moveHistory = [];
        this.moveHistory.innerHTML = '';
      });
      
      if (this.computerWhiteCheckbox) {
        this.computerWhiteCheckbox.addEventListener('change', (e) => {
          this.game.computerPlaysWhite = e.target.checked;
          this.handleComputerTurn();
        });
      }
      
      if (this.computerBlackCheckbox) {
        this.computerBlackCheckbox.addEventListener('change', (e) => {
          this.game.computerPlaysBlack = e.target.checked;
          this.handleComputerTurn();
        });
      }
      
      // Add touch event listeners for mobile
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }
    
    renderBoard() {
      this.chessboard.innerHTML = '';
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const square = document.createElement('div');
          square.className = 'square';
          
          // Alternate square colors
          if ((row + col) % 2 === 0) {
            square.classList.add('light');
          } else {
            square.classList.add('dark');
          }
          
          // Add coordinates
          if (this.game.boardOrientation === 'white') {
            if (row === 7) {
              const file = document.createElement('span');
              file.className = 'coordinate file';
              file.textContent = String.fromCharCode(97 + col);
              square.appendChild(file);
            }
            if (col === 0) {
              const rank = document.createElement('span');
              rank.className = 'coordinate rank';
              rank.textContent = 8 - row;
              square.appendChild(rank);
            }
          } else {
            if (row === 0) {
              const file = document.createElement('span');
              file.className = 'coordinate file';
              file.textContent = String.fromCharCode(97 + (7 - col));
              square.appendChild(file);
            }
            if (col === 7) {
              const rank = document.createElement('span');
              rank.className = 'coordinate rank';
              rank.textContent = row + 1;
              square.appendChild(rank);
            }
          }
          
          // Add piece if present
          const piece = this.game.board[row][col];
          if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'piece';
            pieceElement.dataset.row = row;
            pieceElement.dataset.col = col;
            pieceElement.textContent = piece.symbol;
            
            // Highlight last moved piece
            if (this.game.moveHistory.length > 0) {
              const lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];
              if (lastMove.to.row === row && lastMove.to.col === col) {
                pieceElement.classList.add('last-moved');
              }
            }
            
            // Highlight captured piece (for animation)
            if (this.game.lastCapture && this.game.lastCapture.row === row && this.game.lastCapture.col === col) {
              pieceElement.classList.add('captured');
            }
            
            // Add drag events for desktop
            pieceElement.draggable = true;
            pieceElement.addEventListener('dragstart', this.handleDragStart.bind(this));
            pieceElement.addEventListener('dragend', this.handleDragEnd.bind(this));
            
            // Add touch events for mobile
            pieceElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            
            square.appendChild(pieceElement);
          }
          
          // Highlight selected square
          if (this.game.selectedSquare && this.game.selectedSquare.row === row && this.game.selectedSquare.col === col) {
            square.classList.add('highlight');
          }
          
          // Highlight possible moves
          if (this.game.possibleMoves.some(move => move.row === row && move.col === col)) {
            const targetPiece = this.game.board[row][col];
            if (targetPiece) {
              square.classList.add('capture-hint');
            } else {
              square.classList.add('move-hint');
            }
          }
          
          // Highlight king in check
          if (this.game.check) {
            const kingPos = this.game.findKing(this.game.turn);
            if (kingPos && kingPos.row === row && kingPos.col === col) {
              square.classList.add('check');
            }
          }
          
          // Add click event
          square.dataset.row = row;
          square.dataset.col = col;
          square.addEventListener('click', this.handleSquareClick.bind(this));
          square.addEventListener('dragover', this.handleDragOver.bind(this));
          square.addEventListener('drop', this.handleDrop.bind(this));
          square.addEventListener('dragenter', this.handleDragEnter.bind(this));
          square.addEventListener('dragleave', this.handleDragLeave.bind(this));
          
          this.chessboard.appendChild(square);
        }
      }
      
      // Flip board if needed
      if (this.game.boardOrientation === 'black') {
        this.chessboard.style.transform = 'rotate(180deg)';
        Array.from(this.chessboard.children).forEach(square => {
          square.style.transform = 'rotate(180deg)';
        });
      } else {
        this.chessboard.style.transform = '';
        Array.from(this.chessboard.children).forEach(square => {
          square.style.transform = '';
        });
      }
    }
    
    updateGameInfo() {
      if (this.game.checkmate) {
        const winner = this.game.turn === 'white' ? 'Black' : 'White';
        this.turnIndicator.textContent = `Game Over - ${winner} Wins!`;
        this.turnIndicator.className = `turn-${winner.toLowerCase()}`;
        this.gameStatus.textContent = `Checkmate! ${winner} wins!`;
        this.gameStatus.className = 'status-checkmate';
        this.playSound(this.gameEndSound);
        return;
      }
      
      if (this.game.stalemate) {
        this.turnIndicator.textContent = 'Game Over - Draw!';
        this.turnIndicator.className = 'turn-draw';
        this.gameStatus.textContent = 'Stalemate! Game drawn.';
        this.gameStatus.className = 'status-stalemate';
        this.playSound(this.gameEndSound);
        return;
      }
      
      this.turnIndicator.textContent = `${this.game.turn === 'white' ? 'White' : 'Black'}'s Turn`;
      this.turnIndicator.className = `turn-${this.game.turn}`;
      
      if (this.game.check) {
        this.gameStatus.textContent = 'Check!';
        this.gameStatus.className = 'status-check';
        this.playSound(this.checkSound);
      } else {
        this.gameStatus.textContent = 'Game in progress';
        this.gameStatus.className = 'status-normal';
      }
    }
    
    updateMoveHistory() {
      this.moveHistory.innerHTML = '';
      
      // Group moves into pairs (white and black)
      for (let i = 0; i < this.game.moveHistory.length; i += 2) {
        const moveEntry = document.createElement('div');
        moveEntry.className = 'move-entry';
        
        const whiteMove = this.game.moveHistory[i];
        const whiteMoveSpan = document.createElement('span');
        whiteMoveSpan.textContent = `${i / 2 + 1}. ${whiteMove.notation}`;
        moveEntry.appendChild(whiteMoveSpan);
        
        if (i + 1 < this.game.moveHistory.length) {
          const blackMove = this.game.moveHistory[i + 1];
          const blackMoveSpan = document.createElement('span');
          blackMoveSpan.textContent = blackMove.notation;
          moveEntry.appendChild(blackMoveSpan);
        }
        
        this.moveHistory.appendChild(moveEntry);
      }
      
      // Scroll to bottom
      this.moveHistory.scrollTop = this.moveHistory.scrollHeight;
    }
    
    async handleSquareClick(e) {
      if (this.game.isComputerThinking) return;
      
      const row = parseInt(e.currentTarget.dataset.row);
      const col = parseInt(e.currentTarget.dataset.col);
      const piece = this.game.board[row][col];
      
      if (this.game.selectedSquare && this.game.possibleMoves.some(move => move.row === row && move.col === col)) {
        const isCapture = !!this.game.board[row][col];
        
        // Play capture sound immediately if needed
        if (isCapture) {
          this.captureSound.play().catch(e => console.log("Audio play failed:", e));
          this.game.lastCapture = { row, col };
        } else {
          this.moveSound.play().catch(e => console.log("Audio play failed:", e));
        }
        
        // Make the move
        this.game.makeMove(this.game.selectedSquare.row, this.game.selectedSquare.col, row, col);
        this.game.selectedSquare = null;
        this.game.possibleMoves = [];
        this.renderBoard();
        this.updateGameInfo();
        this.updateMoveHistory();
        
        await this.handleComputerTurn();
        return;
      }
      
      // If clicking on a piece of the current turn's color
      if (piece && piece.color === this.game.turn) {
        // If clicking the same piece again, deselect it
        if (this.game.selectedSquare && this.game.selectedSquare.row === row && this.game.selectedSquare.col === col) {
          this.game.selectedSquare = null;
          this.game.possibleMoves = [];
        } else {
          this.game.selectedSquare = { row, col };
          this.game.possibleMoves = this.game.getPossibleMoves(row, col);
          // Play selection sound
          this.moveSound.play().catch(e => console.log("Audio play failed:", e));
        }
        this.renderBoard();
      }
    }
    
    handleDragStart(e) {
      const pieceElement = e.target;
      pieceElement.classList.add('dragging');
      
      const row = parseInt(pieceElement.dataset.row);
      const col = parseInt(pieceElement.dataset.col);
      const piece = this.game.board[row][col];
      
      // Only allow dragging pieces of the current turn's color
      if (piece.color !== this.game.turn) {
        e.preventDefault();
        return;
      }
      
      this.game.selectedSquare = { row, col };
      this.game.possibleMoves = this.game.getPossibleMoves(row, col);
      this.renderBoard();
      
      // Set drag image to a transparent image
      const dragImage = new Image();
      dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Store the piece data
      e.dataTransfer.setData('text/plain', JSON.stringify({
        row,
        col
      }));
    }
    
    async handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('highlight');
      
      if (this.game.isComputerThinking) return;
      
      const fromData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const toRow = parseInt(e.currentTarget.dataset.row);
      const toCol = parseInt(e.currentTarget.dataset.col);
      
      // Immediate capture detection
      const isCapture = !!this.game.board[toRow][toCol];
      
      // Check if the move is valid
      const isValidMove = this.game.possibleMoves.some(
        move => move.row === toRow && move.col === toCol
      );
      
      if (isValidMove) {
        // Immediate capture feedback
        if (isCapture) {
          this.game.lastCapture = { row: toRow, col: toCol };
          this.renderBoard(); // Show capture immediately
          this.captureSound.play().catch(e => console.log("Audio play failed:", e));
          await new Promise(resolve => setTimeout(resolve, 50)); // Minimal delay
        }
        
        this.game.makeMove(fromData.row, fromData.col, toRow, toCol);
        this.game.selectedSquare = null;
        this.game.possibleMoves = [];
        this.renderBoard();
        this.updateGameInfo();
        this.updateMoveHistory();
        
        await this.handleComputerTurn();
      }
    }
    
    async handleComputerTurn() {
      if (this.game.isComputerThinking) return;
      
      const difficulty = this.difficultySelect ? this.difficultySelect.value : 'medium';
      this.showComputerThinking(true);
      
      try {
        const move = await this.game.playComputerMove(difficulty);
        
        if (move) {
          const isCapture = !!this.game.board[move.to.row][move.to.col];
          
          if (isCapture) {
            this.captureSound.play().catch(e => console.log("Audio play failed:", e));
            this.game.lastCapture = { row: move.to.row, col: move.to.col };
          } else {
            this.moveSound.play().catch(e => console.log("Audio play failed:", e));
          }
          
          this.game.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
          this.renderBoard();
          this.updateGameInfo();
          this.updateMoveHistory();
          
          // Check if computer should move again
          this.handleComputerTurn();
        }
      } finally {
        this.showComputerThinking(false);
      }
    }
    
    showComputerThinking(show) {
      this.game.isComputerThinking = show;
      const indicator = document.getElementById('computer-thinking');
      
      if (show) {
        if (!indicator) {
          const newIndicator = document.createElement('div');
          newIndicator.id = 'computer-thinking';
          newIndicator.textContent = 'Computer is thinking...';
          newIndicator.style.position = 'fixed';
          newIndicator.style.width = '200px';
          newIndicator.style.bottom = '100px';
          newIndicator.style.left = '50%';
          newIndicator.style.transform = 'translateX(-50%)';
          newIndicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
          newIndicator.style.color = 'white';
          newIndicator.style.padding = '10px 20px';
          newIndicator.style.borderRadius = '20px';
          newIndicator.style.zIndex = '1000';
          newIndicator.style.fontFamily = "'Comic Neue', cursive";
          document.body.appendChild(newIndicator);
        }
      } else if (indicator) {
        indicator.remove();
      }
    }
    
    handleDragEnd(e) {
      e.target.classList.remove('dragging');
    }
    
    handleDragOver(e) {
      e.preventDefault();
    }
    
    handleDragEnter(e) {
      e.preventDefault();
      const row = parseInt(e.currentTarget.dataset.row);
      const col = parseInt(e.currentTarget.dataset.col);
      
      // Highlight the square if it's a valid move
      if (this.game.possibleMoves.some(move => move.row === row && move.col === col)) {
        e.currentTarget.classList.add('highlight');
      }
    }
    
    handleDragLeave(e) {
      e.currentTarget.classList.remove('highlight');
    }
    
    handleTouchStart(e) {
      e.preventDefault();
      const pieceElement = e.target.closest('.piece');
      if (!pieceElement || this.cloneExists) return;
      
      const row = parseInt(pieceElement.dataset.row);
      const col = parseInt(pieceElement.dataset.col);
      const piece = this.game.board[row][col];
      
      if (piece.color !== this.game.turn) return;
      
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      
      this.game.draggedPiece = pieceElement;
      this.game.draggedPieceClone = pieceElement.cloneNode(true);
      this.game.draggedPieceClone.classList.add('dragging', 'touch-drag');
      this.updateDraggedPiecePosition(this.touchStartX, this.touchStartY);
      document.body.appendChild(this.game.draggedPieceClone);
      this.cloneExists = true;
      
      this.game.draggedPiece.style.opacity = '0.4';
      
      this.game.selectedSquare = { row, col };
      this.game.possibleMoves = this.game.getPossibleMoves(row, col);
      this.renderBoard();
    }
    
    handleTouchMove(e) {
      if (!this.game.draggedPieceClone) return;
      e.preventDefault();
      this.updateDraggedPiecePosition(e.touches[0].clientX, e.touches[0].clientY);
      
      // Highlight potential drop target
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const square = element?.closest('.square');
      
      if (square) {
        // Remove highlight from all squares first
        document.querySelectorAll('.square.highlight').forEach(el => {
          el.classList.remove('highlight');
        });
        
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // Highlight if it's a valid move
        if (this.game.possibleMoves.some(move => move.row === row && move.col === col)) {
          square.classList.add('highlight');
        }
      }
    }
    
    async handleTouchEnd(e) {
      if (!this.game.draggedPieceClone) return;
      e.preventDefault();
      
      if (this.game.isComputerThinking) {
        this.cleanupTouchDrag();
        return;
      }
      
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const square = element?.closest('.square');
      
      if (square && this.game.draggedPiece) {
        const fromRow = parseInt(this.game.draggedPiece.dataset.row);
        const fromCol = parseInt(this.game.draggedPiece.dataset.col);
        const toRow = parseInt(square.dataset.row);
        const toCol = parseInt(square.dataset.col);
        
        const isValidMove = this.game.possibleMoves.some(
          move => move.row === toRow && move.col === toCol
        );
        
        if (isValidMove) {
          const isCapture = !!this.game.board[toRow][toCol];
          
          if (isCapture) {
            this.captureSound.play().catch(err => console.log("Audio play failed:", err));
            this.game.lastCapture = { row: toRow, col: toCol };
          } else {
            this.moveSound.play().catch(err => console.log("Audio play failed:", err));
          }
          
          this.game.makeMove(fromRow, fromCol, toRow, toCol);
        }
      }
      
      this.cleanupTouchDrag();
      this.game.selectedSquare = null;
      this.game.possibleMoves = [];
      this.renderBoard();
      this.updateGameInfo();
      this.updateMoveHistory();
      
      await this.handleComputerTurn();
    }
    
    updateDraggedPiecePosition(x, y) {
      if (this.game.draggedPieceClone) {
        this.game.draggedPieceClone.style.left = `${x - 30}px`;
        this.game.draggedPieceClone.style.top = `${y - 30}px`;
      }
    }
    
    cleanupTouchDrag() {
      if (this.game.draggedPieceClone) {
        this.game.draggedPieceClone.remove();
        this.game.draggedPieceClone = null;
      }
      
      if (this.game.draggedPiece) {
        this.game.draggedPiece.style.opacity = '1';
        this.game.draggedPiece = null;
      }
      
      this.cloneExists = false;
      document.querySelectorAll('.square.highlight').forEach(el => {
        el.classList.remove('highlight');
      });
    }
    
    playSound(sound) {
      if (!sound || typeof sound.play !== 'function') return;
      
      try {
        sound.currentTime = 0; // Rewind to start if already playing
        sound.play().catch(e => {
          console.error("Failed to play sound:", e);
          // Implement fallback notification if needed
          if (sound === this.gameEndSound) {
            if (this.game.checkmate) {
              const winner = this.game.turn === 'white' ? 'Black' : 'White';
              alert(`Checkmate! ${winner} wins!`);
            } else if (this.game.stalemate) {
              alert('Stalemate! Game drawn.');
            }
          }
        });
      } catch (e) {
        console.error("Sound play error:", e);
      }
    }
  }
  
  const chessGame = new ChessGame();
  const uiController = new ChessUIController(chessGame);
  chessGame.uiController = uiController;
  const preGameUI = new PreGameUI(uiController);
  
  chessGame.initializeBoard();
  uiController.renderBoard();
  uiController.updateGameInfo();
});
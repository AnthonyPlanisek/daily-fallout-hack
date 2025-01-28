import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})

export class MainPageComponent implements OnInit {
  characters: string[][] = [];
  correctWord: string = '';
  gridWidth = 12;
  gridHeight = 17;
  symbols = ['<', '>', '{', '}', '(', ')', ',', '=', '$', "'", ';', '"', '!', '[', ']', '%', '?', '+', '*', '^', '@', '\\', '/', '#'];
  words: string[] = [];
  selectedPositions: Set<string> = new Set();
  debugMode = true; // Add this for debugging

  ngOnInit() {
    console.log('Component initializing...');
    this.initializeGame();
  }

  initializeGame() {
    try {
      // Initialize the grid first
      this.characters = Array(this.gridHeight).fill(null)
        .map(() => Array(this.gridWidth).fill('.'));

      // Get words
      this.words = this.extractWords();
      console.log('Available words:', this.words);

      // Select words
      const selectedWords = this.getRandomWords(15);
      this.correctWord = selectedWords[Math.floor(Math.random() * selectedWords.length)];
      console.log('Selected words:', selectedWords);
      console.log('Correct word:', this.correctWord);

      // Place content
      this.placeContent(selectedWords);
    } catch (error) {
      console.error('Error in initializeGame:', error);
      // Fallback to simple grid if placement fails
      this.createFallbackGrid();
    }
  }

  createFallbackGrid() {
    // Create a simple working grid if the main logic fails
    this.characters = Array(this.gridHeight).fill(null)
      .map(() => Array(this.gridWidth).fill('.'));
    // Place at least one word
    const word = this.words[0] || 'TEST';
    this.correctWord = word;
    this.placeWord(0, 0, word);
    // Fill rest with random symbols
    this.fillWithSymbols();
  }

  extractWords(): string[] {
    // Filter to ensure words will fit in grid width
    return ['STORY', 'PLAYER', 'WEAPON', 'VAULT', 'DESERT', 'WATER', 'QUEST', 'WORLD', 
            'POWER', 'HUMAN', 'ROBOT', 'TRIBE', 'GUARD', 'TRADE', 'RUINS', 'TOWN', 
            'SKILL', 'MAP', 'DOG', 'CAT']
            .filter(word => word.length <= this.gridWidth);
  }

  getRandomWords(count: number): string[] {
    const shuffled = [...this.words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.words.length));
  }

  placeContent(words: string[]) {
    // Place words first
    words.forEach(word => {
      let attempts = 0;
      let placed = false;
      while (!placed && attempts < 50) { // Limit attempts
        const row = Math.floor(Math.random() * this.gridHeight);
        const col = Math.floor(Math.random() * (this.gridWidth - word.length + 1));
        
        if (this.canPlaceWord(row, col, word)) {
          this.placeWord(row, col, word);
          placed = true;
        }
        attempts++;
      }
      if (!placed && this.debugMode) {
        console.log(`Failed to place word: ${word}`);
      }
    });

    // Fill remaining spaces with symbols
    this.fillWithSymbols();

    // Add some matching brackets
    this.addMatchingBrackets();
  }

  fillWithSymbols() {
    for (let i = 0; i < this.gridHeight; i++) {
      for (let j = 0; j < this.gridWidth; j++) {
        if (this.characters[i][j] === '.') {
          this.characters[i][j] = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        }
      }
    }
  }

  canPlaceWord(row: number, col: number, word: string): boolean {
    if (col + word.length > this.gridWidth) return false;
    
    for (let i = 0; i < word.length; i++) {
      if (this.characters[row][col + i] !== '.') return false;
    }
    return true;
  }

  placeWord(row: number, col: number, word: string) {
    for (let i = 0; i < word.length; i++) {
      this.characters[row][col + i] = word[i];
    }
  }

  addMatchingBrackets() {
    const bracketPairs = ['()', '[]', '{}', '<>'];
    let attempts = 0;
    let pairsPlaced = 0;
    
    while (pairsPlaced < 3 && attempts < 50) {
      const pair = bracketPairs[Math.floor(Math.random() * bracketPairs.length)];
      const row = Math.floor(Math.random() * this.gridHeight);
      const col1 = Math.floor(Math.random() * (this.gridWidth - 3));
      const col2 = col1 + 2;
      
      if (this.characters[row][col1] === '.' && this.characters[row][col2] === '.') {
        this.characters[row][col1] = pair[0];
        this.characters[row][col2] = pair[1];
        pairsPlaced++;
      }
      attempts++;
    }
  }

  isLetter(char: string): boolean {
    return /[A-Z]/.test(char);
  }

  onCharacterClick(row: number, col: number) {
    try {
      const char = this.characters[row][col];
      
      if (this.isLetter(char)) {
        let word = this.getWordAtPosition(row, col);
        if (word === this.correctWord) {
          alert('Congratulations! You found the correct word!');
          this.initializeGame();
        }
      } else {
        this.checkForMatchingBrackets(row, col);
      }
    } catch (error) {
      console.error('Error in onCharacterClick:', error);
    }
  }

  getWordAtPosition(row: number, col: number): string {
    let word = '';
    let startCol = col;
    
    // Find start of word
    while (startCol > 0 && this.isLetter(this.characters[row][startCol - 1])) {
      startCol--;
    }
    
    // Build word
    while (startCol < this.gridWidth && this.isLetter(this.characters[row][startCol])) {
      word += this.characters[row][startCol];
      startCol++;
    }
    
    return word;
  }

  checkForMatchingBrackets(row: number, clickedCol: number) {
    const char = this.characters[row][clickedCol];
    const pairs: { [key: string]: string } = {
      '(': ')', '[': ']', '{': '}', '<': '>'
    };
    
    if (pairs[char]) {
      for (let col = clickedCol + 1; col < this.gridWidth; col++) {
        if (this.characters[row][col] === pairs[char]) {
          this.removeRandomWordBetweenBrackets(row, clickedCol, col);
          break;
        }
      }
    }
  }

  removeRandomWordBetweenBrackets(row: number, start: number, end: number) {
    let words: { start: number, length: number }[] = [];
    let currentWord = { start: -1, length: 0 };
    
    for (let i = start + 1; i < end; i++) {
      if (this.isLetter(this.characters[row][i])) {
        if (currentWord.start === -1) currentWord.start = i;
        currentWord.length++;
      } else if (currentWord.start !== -1) {
        words.push({ ...currentWord });
        currentWord = { start: -1, length: 0 };
      }
    }
    
    if (words.length > 0) {
      const wordToRemove = words[Math.floor(Math.random() * words.length)];
      for (let i = 0; i < wordToRemove.length; i++) {
        this.characters[row][wordToRemove.start + i] = '.';
      }
    }
  }
}
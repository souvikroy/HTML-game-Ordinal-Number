/**
 * Ordinal Odyssey: Race for the Golden Grid
 * Game JavaScript
 */

// Game state
const gameState = {
    currentLevel: 0,
    unlockedLevels: 1,
    points: 0,
    currentScreen: 'start-screen',
    levelData: {
        1: {
            correctOrder: [1, 2, 3, 4, 5],
            partsPlaced: [0, 0, 0, 0, 0],
            completed: false
        },
        2: {
            solution: {
                '2': 'blue',
                '3': 'yellow',
                '5': 'red'
            },
            racersPlaced: {},
            completed: false
        }
    }
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Navigation buttons
    const startButton = document.getElementById('start-button');
    const howToPlayButton = document.getElementById('how-to-play-button');
    const backToStartButton = document.getElementById('back-to-start');
    const backFromHelpButton = document.getElementById('back-from-help');
    const levelBackButtons = document.querySelectorAll('.level-back-button');
    
    // Level buttons
    const levelCards = document.querySelectorAll('.level-card');
    const level1CheckButton = document.getElementById('level1-check');
    const level2CheckButton = document.getElementById('level2-check');
    
    // Modal elements
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackMessage = document.getElementById('feedback-message');
    const nextLevelButton = document.getElementById('next-level-button');
    const retryLevelButton = document.getElementById('retry-level-button');
    
    // Set up event listeners
    setupNavigation();
    setupDragAndDrop();
    setupLevelLogic();
    
    /**
     * Sets up navigation between screens
     */
    function setupNavigation() {
        // Start screen navigation
        startButton.addEventListener('click', () => {
            changeScreen('start-screen', 'level-select-screen');
        });
        
        howToPlayButton.addEventListener('click', () => {
            changeScreen('start-screen', 'how-to-play-screen');
        });
        
        // Back buttons
        backToStartButton.addEventListener('click', () => {
            changeScreen('level-select-screen', 'start-screen');
        });
        
        backFromHelpButton.addEventListener('click', () => {
            changeScreen('how-to-play-screen', 'start-screen');
        });
        
        // Level back buttons
        levelBackButtons.forEach(button => {
            button.addEventListener('click', () => {
                changeScreen(`level-${gameState.currentLevel}`, 'level-select-screen');
            });
        });
        
        // Level selection
        levelCards.forEach(card => {
            card.addEventListener('click', () => {
                const levelNum = parseInt(card.dataset.level);
                
                // Only allow access to unlocked levels
                if (levelNum <= gameState.unlockedLevels) {
                    gameState.currentLevel = levelNum;
                    changeScreen('level-select-screen', `level-${levelNum}`);
                } else {
                    // Shake animation for locked levels
                    card.classList.add('shake');
                    setTimeout(() => {
                        card.classList.remove('shake');
                    }, 500);
                }
            });
        });
        
        // Modal navigation
        nextLevelButton.addEventListener('click', () => {
            hideModal();
            if (gameState.currentLevel < 10) {
                changeScreen(`level-${gameState.currentLevel}`, `level-${gameState.currentLevel + 1}`);
                gameState.currentLevel++;
            } else {
                // End of game
                changeScreen(`level-${gameState.currentLevel}`, 'level-select-screen');
            }
        });
        
        retryLevelButton.addEventListener('click', () => {
            hideModal();
            resetLevel(gameState.currentLevel);
        });
    }
    
    /**
     * Sets up drag and drop functionality for the game
     */
    function setupDragAndDrop() {
        // Level 1: Car Parts
        const parts = document.querySelectorAll('.part');
        const slots = document.querySelectorAll('.part-slot');
        
        parts.forEach(part => {
            part.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', part.dataset.part);
                setTimeout(() => {
                    part.style.opacity = '0.4';
                }, 0);
            });
            
            part.addEventListener('dragend', () => {
                part.style.opacity = '1';
            });
        });
        
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('highlight');
            });
            
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('highlight');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('highlight');
                
                const partId = parseInt(e.dataTransfer.getData('text/plain'));
                const slotId = parseInt(slot.dataset.slot);
                
                // Check if the part is placed in the correct slot
                if (partId === slotId) {
                    slot.innerHTML = '';
                    const partClone = document.querySelector(`[data-part="${partId}"]`).cloneNode(true);
                    partClone.setAttribute('draggable', 'false');
                    slot.appendChild(partClone);
                    
                    // Update game state
                    gameState.levelData[1].partsPlaced[slotId - 1] = partId;
                    
                    // Check if all parts are placed correctly
                    checkLevel1Completion();
                } else {
                    // Wrong placement feedback
                    showWrongPlacementFeedback(slot);
                }
            });
        });
        
        // Level 2: Racers
        const racers = document.querySelectorAll('.racer');
        const gridPositions = document.querySelectorAll('.grid-position');
        
        racers.forEach(racer => {
            racer.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', racer.dataset.racer);
                setTimeout(() => {
                    racer.style.opacity = '0.4';
                }, 0);
            });
            
            racer.addEventListener('dragend', () => {
                racer.style.opacity = '1';
            });
        });
        
        gridPositions.forEach(position => {
            position.addEventListener('dragover', (e) => {
                e.preventDefault();
                position.classList.add('highlight');
            });
            
            position.addEventListener('dragleave', () => {
                position.classList.remove('highlight');
            });
            
            position.addEventListener('drop', (e) => {
                e.preventDefault();
                position.classList.remove('highlight');
                
                const racerId = e.dataTransfer.getData('text/plain');
                const positionId = position.dataset.position;
                
                // Remove racer from previous position if it exists
                Object.keys(gameState.levelData[2].racersPlaced).forEach(pos => {
                    if (gameState.levelData[2].racersPlaced[pos] === racerId) {
                        delete gameState.levelData[2].racersPlaced[pos];
                        document.querySelector(`.grid-position[data-position="${pos}"]`).innerHTML = pos + getOrdinalSuffix(parseInt(pos));
                    }
                });
                
                // Place racer in new position
                position.innerHTML = '';
                const racerClone = document.querySelector(`.racer.${racerId}`).cloneNode(true);
                racerClone.setAttribute('draggable', 'false');
                position.appendChild(racerClone);
                
                // Update game state
                gameState.levelData[2].racersPlaced[positionId] = racerId;
                
                // Check if level 2 can be completed
                checkLevel2Completion();
            });
        });
    }
    
    /**
     * Sets up level-specific logic
     */
    function setupLevelLogic() {
        // Level 1 check button
        level1CheckButton.addEventListener('click', () => {
            // Check if all parts are in correct order
            if (areArraysEqual(gameState.levelData[1].partsPlaced, gameState.levelData[1].correctOrder)) {
                gameState.levelData[1].completed = true;
                gameState.unlockedLevels = Math.max(gameState.unlockedLevels, 2);
                updateUnlockedLevels();
                showFeedback(true, "Amazing Work!", "You've built your race car with all parts in the right order. You're a natural with ordinal numbers!");
            } else {
                showFeedback(false, "Not Quite Right", "Check the order of your parts. Remember, we need to start with the 1st part and go in order.");
            }
        });
        
        // Level 2 check button
        level2CheckButton.addEventListener('click', () => {
            // Check if racers are placed correctly according to the clues
            const solution = gameState.levelData[2].solution;
            const racersPlaced = gameState.levelData[2].racersPlaced;
            let isCorrect = true;
            
            // Check specific positions from clues
            Object.keys(solution).forEach(position => {
                if (racersPlaced[position] !== solution[position]) {
                    isCorrect = false;
                }
            });
            
            if (isCorrect) {
                gameState.levelData[2].completed = true;
                gameState.unlockedLevels = Math.max(gameState.unlockedLevels, 3);
                updateUnlockedLevels();
                showFeedback(true, "Race Grid Mastered!", "You've correctly arranged the racers based on their positions. Great job understanding ordinal positions!");
            } else {
                showFeedback(false, "Not Quite Right", "Check the positions of your racers. Remember the clues: Yellow is 3rd, Blue is just ahead of Yellow, and Red is 5th.");
            }
        });
    }
    
    /**
     * Helper function to change between screens
     */
    function changeScreen(fromScreen, toScreen) {
        document.getElementById(fromScreen).classList.remove('active');
        document.getElementById(toScreen).classList.add('active');
        gameState.currentScreen = toScreen;
    }
    
    /**
     * Check if Level 1 can be completed
     */
    function checkLevel1Completion() {
        // Check if all slots have parts
        const allPartsPlaced = gameState.levelData[1].partsPlaced.every(part => part !== 0);
        level1CheckButton.disabled = !allPartsPlaced;
    }
    
    /**
     * Check if Level 2 can be completed
     */
    function checkLevel2Completion() {
        // Enable check button if at least the required positions are filled
        const solutionPositions = Object.keys(gameState.levelData[2].solution);
        const requiredPositionsFilled = solutionPositions.every(pos => 
            gameState.levelData[2].racersPlaced[pos] !== undefined
        );
        
        level2CheckButton.disabled = !requiredPositionsFilled;
    }
    
    /**
     * Show feedback modal
     */
    function showFeedback(isSuccess, title, message) {
        feedbackTitle.textContent = title;
        feedbackMessage.textContent = message;
        
        // Set up stars based on success
        const stars = document.querySelectorAll('.star');
        if (isSuccess) {
            stars.forEach(star => star.classList.add('active'));
            nextLevelButton.style.display = 'inline-block';
            retryLevelButton.style.display = 'none';
        } else {
            stars[0].classList.add('active');
            stars[1].classList.remove('active');
            stars[2].classList.remove('active');
            nextLevelButton.style.display = 'none';
            retryLevelButton.style.display = 'inline-block';
        }
        
        feedbackModal.style.display = 'flex';
    }
    
    /**
     * Hide the feedback modal
     */
    function hideModal() {
        feedbackModal.style.display = 'none';
    }
    
    /**
     * Update unlocked levels in UI
     */
    function updateUnlockedLevels() {
        levelCards.forEach(card => {
            const levelNum = parseInt(card.dataset.level);
            if (levelNum <= gameState.unlockedLevels) {
                card.classList.remove('locked');
            }
        });
    }
    
    /**
     * Reset a level to its initial state
     */
    function resetLevel(levelNum) {
        if (levelNum === 1) {
            // Reset Level 1
            gameState.levelData[1].partsPlaced = [0, 0, 0, 0, 0];
            const slots = document.querySelectorAll('.part-slot');
            slots.forEach(slot => {
                slot.innerHTML = '';
            });
            level1CheckButton.disabled = true;
        } else if (levelNum === 2) {
            // Reset Level 2
            gameState.levelData[2].racersPlaced = {};
            const positions = document.querySelectorAll('.grid-position');
            positions.forEach(position => {
                const posNum = position.dataset.position;
                position.innerHTML = posNum + getOrdinalSuffix(parseInt(posNum));
            });
            level2CheckButton.disabled = true;
        }
    }
    
    /**
     * Show wrong placement feedback
     */
    function showWrongPlacementFeedback(element) {
        element.classList.add('wrong');
        setTimeout(() => {
            element.classList.remove('wrong');
        }, 500);
    }
    
    /**
     * Utility function to check if arrays are equal
     */
    function areArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }
    
    /**
     * Get ordinal suffix for a number
     */
    function getOrdinalSuffix(number) {
        if (number === 1) return 'st';
        if (number === 2) return 'nd';
        if (number === 3) return 'rd';
        return 'th';
    }
});

/**
 * Add shake animation for CSS
 */
document.head.appendChild(document.createElement('style')).innerHTML = `
    .shake {
        animation: shake 0.5s;
    }
    
    .wrong {
        animation: wrong 0.5s;
        border: 2px solid #E74C3C !important;
    }
    
    @keyframes shake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
    }
    
    @keyframes wrong {
        0% { background-color: rgba(231, 76, 60, 0.3); }
        100% { background-color: rgba(255, 255, 255, 0.6); }
    }
`;

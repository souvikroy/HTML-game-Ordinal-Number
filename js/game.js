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
        
        // Initialize level 1 visual feedback
        updateInstructionText('level1-instructions', 'Place car parts in order! Start with 1st and go to 5th.', true);
        
        parts.forEach(part => {
            part.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', part.dataset.part);
                setTimeout(() => {
                    part.style.opacity = '0.4';
                }, 0);
                
                // Update instruction text when dragging
                const partId = part.dataset.part;
                const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
                updateInstructionText('level1-instructions', `Great! Moving the ${ordinals[partId]} part. Find the right spot!`);
            });
            
            part.addEventListener('dragend', () => {
                part.style.opacity = '1';
                
                // Reset message if no drop occurred
                setTimeout(() => {
                    updateInstructionText('level1-instructions', 'Place car parts in order! Start with 1st and go to 5th.');
                }, 500);
            });
            
            // Add touch support for mobile
            part.addEventListener('touchstart', (e) => {
                const touchObj = e.changedTouches[0];
                part.dataset.touchId = touchObj.identifier;
                part.dataset.touchStartX = touchObj.clientX;
                part.dataset.touchStartY = touchObj.clientY;
                part.classList.add('dragging');
                e.preventDefault();
            }, {passive: false});
            
            part.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = Array.from(e.changedTouches).find(t => t.identifier === parseInt(part.dataset.touchId));
                if (!touch) return;
                
                const x = touch.clientX - part.dataset.touchStartX;
                const y = touch.clientY - part.dataset.touchStartY;
                
                part.style.transform = `translate(${x}px, ${y}px)`;
            }, {passive: false});
            
            part.addEventListener('touchend', (e) => {
                const touch = Array.from(e.changedTouches).find(t => t.identifier === parseInt(part.dataset.touchId));
                if (!touch) return;
                
                part.style.transform = '';
                part.classList.remove('dragging');
                
                // Find the slot under touch position
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const slot = el.closest('.part-slot');
                
                if (slot) {
                    const partId = parseInt(part.dataset.part);
                    const slotId = parseInt(slot.dataset.slot);
                    
                    handlePartPlacement(partId, slotId, slot, part);
                }
                
                e.preventDefault();
            }, {passive: false});
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
                
                handlePartPlacement(partId, slotId, slot);
            });
        });
        
        // Helper function for both touch and drag events
        function handlePartPlacement(partId, slotId, slot, draggedPart = null) {
            // Clear any existing part in this slot
            const existingPart = slot.querySelector('.part');
            if (existingPart) {
                slot.removeChild(existingPart);
                // Reset the corresponding position in the game state
                gameState.levelData[1].partsPlaced[slotId - 1] = 0;
            }
            
            // Check if the part is placed in the correct slot
            if (partId === slotId) {
                // Get part element to clone (either from drag or directly for touch)
                const sourceElement = draggedPart || document.querySelector(`[data-part="${partId}"]`);
                const partClone = sourceElement.cloneNode(true);
                
                partClone.setAttribute('draggable', 'false');
                partClone.classList.add('placed-part');
                partClone.style.width = '100%';
                partClone.style.height = '100%';
                slot.appendChild(partClone);
                
                // Update game state
                gameState.levelData[1].partsPlaced[slotId - 1] = partId;
                
                // Show correct placement feedback
                slot.classList.add('correct');
                updateInstructionText('level1-instructions', `Perfect! You placed the ${getOrdinalWord(partId)} part correctly!`);
                setTimeout(() => {
                    slot.classList.remove('correct');
                }, 1000);
                
                // Check if all parts are placed correctly
                checkLevel1Completion();
            } else {
                // Wrong placement feedback
                showWrongPlacementFeedback(slot);
                updateInstructionText('level1-instructions', `Not quite right. Place the ${getOrdinalWord(slotId)} part here.`);
            }
        }
        
        // Helper function to convert number to word
        function getOrdinalWord(num) {
            const words = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
            return words[num] || num + getOrdinalSuffix(num);
        }
        
        // Add click event to check button
        document.getElementById('level1-check').addEventListener('click', function() {
            this.classList.add('button-pressed');
            setTimeout(() => {
                this.classList.remove('button-pressed');
            }, 200);
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
        element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(0)' }
        ], { 
            duration: 500,
            easing: 'ease-in-out'
        });
        
        setTimeout(() => {
            element.classList.remove('wrong');
        }, 500);
    }
    
    /**
     * Update instruction panel text with optional animation
     */
    function updateInstructionText(elementId, message, withAnimation = false) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        if (withAnimation) {
            element.style.opacity = '0';
            setTimeout(() => {
                element.textContent = message;
                element.style.opacity = '1';
            }, 300);
        } else {
            element.style.opacity = '0.7';
            element.textContent = message;
            
            // Flash effect
            setTimeout(() => {
                element.style.opacity = '1';
            }, 50);
        }
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
    
    .correct {
        animation: correct 0.5s;
        border: 2px solid #2ECC71 !important;
    }
    
    .placed-part {
        margin: 0 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
    }
    
    .button-pressed {
        transform: translateY(4px) !important;
        box-shadow: 0 1px 0 darken(var(--primary-color), 10%) !important;
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
        100% { background-color: rgba(255, 255, 255, 0.2); }
    }
    
    @keyframes correct {
        0% { background-color: rgba(46, 204, 113, 0.3); }
        50% { background-color: rgba(46, 204, 113, 0.5); }
        100% { background-color: rgba(255, 255, 255, 0.2); }
    }
    
    #level1-instructions {
        transition: opacity 0.3s ease;
    }
    
    .dragging {
        opacity: 0.6;
        z-index: 1000;
    }
`;

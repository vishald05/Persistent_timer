document.addEventListener("DOMContentLoaded", () => {
    const timers = JSON.parse(localStorage.getItem("timers")) || [];
    const completedTimers = JSON.parse(localStorage.getItem("completedTimers")) || [];
    
    function saveTimers() {
        localStorage.setItem("timers", JSON.stringify(timers));
        localStorage.setItem("completedTimers", JSON.stringify(completedTimers));
    }
    
    function createTimer(name, duration) {
        const startTime = Date.now();
        const endTime = startTime + duration * 60000;
        timers.push({ name, duration, startTime, endTime, paused: false, elapsed: 0 });
        saveTimers();
        renderTimers();
        showNotification(`Timer "${name}" started for ${duration} minutes!`);
        
        // Clear form inputs
        document.getElementById("timer-name").value = "";
        document.getElementById("timer-duration").value = "";
    }
    
    function renderTimers() {
        const runningTimersContainer = document.getElementById("running-timers");
        const completedTimersContainer = document.getElementById("completed-timers");
        const searchQuery = document.getElementById("search-timer").value.toLowerCase();
        const runningCount = document.getElementById("running-count");
        const completedCount = document.getElementById("completed-count");
        
        runningTimersContainer.innerHTML = "";
        completedTimersContainer.innerHTML = "";
        
        let filteredTimers = timers.filter(timer => 
            !searchQuery || timer.name.toLowerCase().includes(searchQuery)
        );
        
        // Update counters
        runningCount.textContent = filteredTimers.length;
        completedCount.textContent = completedTimers.length;
        
        // Handle completed timers first (iterate backwards to avoid index issues)
        for (let i = timers.length - 1; i >= 0; i--) {
            const timer = timers[i];
            const elapsed = timer.paused ? timer.elapsed : Math.floor((Date.now() - timer.startTime) / 1000);
            
            if (elapsed >= timer.duration * 60) {
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                completedTimers.push({ 
                    name: timer.name, 
                    time: `${minutes}m ${seconds}s`, 
                    class: "completed-red",
                    completedAt: Date.now()
                });
                timers.splice(i, 1);
                showNotification(`⏰ Timer "${timer.name}" has completed!`);
            }
        }
        
        // Render running timers
        filteredTimers.forEach((timer, index) => {
            const elapsed = timer.paused ? timer.elapsed : Math.floor((Date.now() - timer.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const remaining = (timer.duration * 60) - elapsed;
            const remainingMinutes = Math.floor(remaining / 60);
            const remainingSeconds = remaining % 60;
            
            const timerCard = document.createElement("div");
            timerCard.className = "timer-card";
            
            timerCard.innerHTML = `
                <div class="timer-info">
                    <div class="timer-name">${timer.name}</div>
                    <div class="timer-time">${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}</div>
                </div>
                <div class="timer-actions">
                    <button class="btn btn-small btn-secondary pause-btn">
                        <i class="fas fa-${timer.paused ? 'play' : 'pause'}"></i>
                        ${timer.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button class="btn btn-small btn-success complete-btn">
                        <i class="fas fa-check"></i>
                        Complete
                    </button>
                    <button class="btn btn-small btn-danger delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const pauseBtn = timerCard.querySelector('.pause-btn');
            const completeBtn = timerCard.querySelector('.complete-btn');
            const deleteBtn = timerCard.querySelector('.delete-btn');
            
            pauseBtn.onclick = () => toggleTimer(timer);
            completeBtn.onclick = () => completeTimer(timer, index);
            deleteBtn.onclick = () => deleteTimer(index);
            
            runningTimersContainer.appendChild(timerCard);
        });
        
        // Show empty state for running timers
        if (filteredTimers.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            emptyState.innerHTML = `
                <i class="fas fa-clock"></i>
                <p>${searchQuery ? 'No timers match your search' : 'No active timers'}</p>
            `;
            runningTimersContainer.appendChild(emptyState);
        }
        
        // Render completed timers
        completedTimers.forEach((timer, index) => {
            const completedElement = document.createElement("div");
            completedElement.className = timer.class;
            completedElement.innerHTML = `
                <div>
                    <strong>${timer.name}</strong><br>
                    <small>${timer.time}</small>
                </div>
                <button class="btn btn-small btn-danger">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            const deleteBtn = completedElement.querySelector('button');
            deleteBtn.onclick = () => {
                completedTimers.splice(index, 1);
                saveTimers();
                renderTimers();
            };
            
            completedTimersContainer.appendChild(completedElement);
        });
        
        // Show empty state for completed timers
        if (completedTimers.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            emptyState.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <p>No completed timers yet</p>
            `;
            completedTimersContainer.appendChild(emptyState);
        }
        
        saveTimers();
    }
    
    function toggleTimer(timer) {
        if (timer.paused) {
            timer.startTime = Date.now() - timer.elapsed * 1000;
        } else {
            timer.elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        }
        timer.paused = !timer.paused;
        saveTimers();
        renderTimers();
        showNotification(`Timer "${timer.name}" ${timer.paused ? 'paused' : 'resumed'}`);
    }
    
    function completeTimer(timer, index) {
        timer.elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        const minutes = Math.floor(timer.elapsed / 60);
        const seconds = timer.elapsed % 60;
        completedTimers.push({ 
            name: timer.name, 
            time: `${minutes}m ${seconds}s`, 
            class: "completed-green",
            completedAt: Date.now()
        });
        timers.splice(index, 1);
        saveTimers();
        renderTimers();
        showNotification(`✅ Timer "${timer.name}" marked as complete!`);
    }
    
    function deleteTimer(index) {
        const timer = timers[index];
        timers.splice(index, 1);
        saveTimers();
        renderTimers();
        showNotification(`🗑️ Timer "${timer.name}" deleted`);
    }
    
    function showNotification(message) {
        const notification = document.getElementById("notification");
        const notificationText = document.getElementById("notification-text");
        
        notificationText.textContent = message;
        notification.classList.remove("hidden");
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.add("hidden");
        }, 3000);
    }
    
    window.hideNotification = function() {
        document.getElementById("notification").classList.add("hidden");
    }
    
    window.quickTimer = function(name, duration) {
        createTimer(name, duration);
    }
    
    // Form submission handler
    document.getElementById("timer-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("timer-name").value.trim();
        const duration = parseInt(document.getElementById("timer-duration").value, 10);
        
        if (name && duration > 0) {
            createTimer(name, duration);
        } else {
            showNotification("Please enter a valid team name and duration");
        }
    });
    
    // Clear completed timers button
    document.getElementById("clear-completed").addEventListener("click", () => {
        if (completedTimers.length > 0 && confirm("Are you sure you want to clear all completed timers?")) {
            completedTimers.length = 0;
            saveTimers();
            renderTimers();
            showNotification("All completed timers cleared");
        }
    });
    
    // Auto-save and update every second
    setInterval(renderTimers, 1000);
    
    // Initial render
    renderTimers();
});
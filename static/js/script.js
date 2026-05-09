document.addEventListener('DOMContentLoaded', function() {
    
    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const htmlEl = document.documentElement;
            const icon = themeToggleBtn.querySelector('i');
            
            if (htmlEl.getAttribute('data-bs-theme') === 'dark') {
                htmlEl.setAttribute('data-bs-theme', 'light');
                icon.classList.remove('bi-moon-fill');
                icon.classList.add('bi-sun-fill');
                localStorage.setItem('theme', 'light');
            } else {
                htmlEl.setAttribute('data-bs-theme', 'dark');
                icon.classList.remove('bi-sun-fill');
                icon.classList.add('bi-moon-fill');
                localStorage.setItem('theme', 'dark');
            }
            
            // Check if charts exist and update them
            updateChartsTheme(htmlEl.getAttribute('data-bs-theme'));
            updateParticlesTheme(htmlEl.getAttribute('data-bs-theme'));
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            themeToggleBtn.querySelector('i').classList.replace('bi-moon-fill', 'bi-sun-fill');
        }
    }

    // Typing Animation for Header
    const typingElement = document.getElementById('typing-text');
    if (typingElement) {
        const text = "AI-Powered Message Security";
        typingElement.innerHTML = '';
        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                typingElement.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            } else {
                typingElement.innerHTML += '<span class="typed-cursor">|</span>';
            }
        }
        setTimeout(typeWriter, 500);
    }

    // Character Counter
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    if (messageInput && charCount) {
        messageInput.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }

    // Form Submission & Prediction
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        predictionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const message = document.getElementById('messageInput').value.trim();
            if (!message) return;

            const btn = document.getElementById('predictBtn');
            const loading = document.getElementById('loadingIndicator');
            const resultSection = document.getElementById('resultSection');
            const progressContainer = document.getElementById('progressContainer');
            
            // UI State: Loading
            btn.disabled = true;
            loading.classList.remove('d-none');
            resultSection.classList.add('d-none');
            
            // Reset Progress Bar
            if(progressContainer) {
                const progressBar = progressContainer.querySelector('.progress-bar');
                progressBar.style.width = '0%';
            }

            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showResult(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while connecting to the server.');
            } finally {
                // Restore UI State
                btn.disabled = false;
                loading.classList.add('d-none');
            }
        });
    }

    function showResult(data) {
        const resultSection = document.getElementById('resultSection');
        const resultCard = document.getElementById('resultCard');
        const resultTitle = document.getElementById('resultTitle');
        const resultConfidence = document.getElementById('resultConfidence');
        const keywordsSection = document.getElementById('keywordsSection');
        const keywordsList = document.getElementById('keywordsList');
        const progressBar = document.getElementById('confidenceProgress');
        
        // Reset classes
        resultCard.className = 'card';
        progressBar.className = 'progress-bar';
        
        if (data.is_spam) {
            resultCard.classList.add('result-spam');
            resultTitle.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2 fs-2 align-middle"></i>SCAM / SPAM DETECTED';
            progressBar.classList.add('progress-spam');
        } else {
            resultCard.classList.add('result-ham');
            resultTitle.innerHTML = '<i class="bi bi-shield-fill-check me-2 fs-2 align-middle"></i>SAFE MESSAGE';
            progressBar.classList.add('progress-ham');
        }
        
        resultConfidence.innerHTML = `Confidence Score: <strong>${data.confidence}%</strong>`;
        
        // Animate Progress Bar
        setTimeout(() => {
            progressBar.style.width = `${data.confidence}%`;
        }, 300);
        
        // Handle keywords
        if (data.keywords && data.keywords.length > 0) {
            keywordsSection.classList.remove('d-none');
            keywordsList.innerHTML = '';
            data.keywords.forEach((kw, index) => {
                const span = document.createElement('span');
                span.className = 'keyword-badge';
                span.style.animationDelay = `${index * 0.1}s`;
                span.textContent = kw;
                keywordsList.appendChild(span);
            });
        } else {
            keywordsSection.classList.add('d-none');
        }
        
        resultSection.classList.remove('d-none');
        
        // Add to history list in UI
        updateHistoryUI(data);
    }
    
    function updateHistoryUI(data) {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (historyList.children.length === 1 && historyList.children[0].textContent.includes('No recent')) {
            historyList.innerHTML = '';
        }
        
        const isSpamClass = data.is_spam ? 'text-danger' : 'text-success';
        const isSpamText = data.is_spam ? '<i class="bi bi-shield-x me-1"></i>SPAM' : '<i class="bi bi-shield-check me-1"></i>SAFE';
        
        const itemHtml = `
            <div class="list-group-item list-group-item-action bg-transparent text-light border-secondary fade-in-up">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1 text-truncate" style="max-width: 70%;">${data.message}</h6>
                    <small class="${isSpamClass} fw-bold">${isSpamText}</small>
                </div>
                <small class="text-muted">Confidence: ${data.confidence}%</small>
                <div class="progress mt-2" style="height: 4px; background-color: rgba(255,255,255,0.05);">
                    <div class="progress-bar ${data.is_spam ? 'progress-spam' : 'progress-ham'}" role="progressbar" style="width: ${data.confidence}%"></div>
                </div>
            </div>
        `;
        
        historyList.insertAdjacentHTML('afterbegin', itemHtml);
        
        if (historyList.children.length > 5) {
            historyList.removeChild(historyList.lastElementChild);
        }
    }

    // Chart.js Rendering for Dashboard
    if (document.getElementById('ratioChart')) {
        renderCharts();
    }
    
    let ratioChartInstance = null;
    let wordsChartInstance = null;
    
    function renderCharts() {
        const textColor = document.documentElement.getAttribute('data-bs-theme') === 'light' ? '#1e293b' : '#E2E8F0';
        const gridColor = document.documentElement.getAttribute('data-bs-theme') === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Inter', sans-serif";
        
        const ctxRatio = document.getElementById('ratioChart').getContext('2d');
        ratioChartInstance = new Chart(ctxRatio, {
            type: 'doughnut',
            data: {
                labels: ['Spam/Scam', 'Safe'],
                datasets: [{
                    data: [typeof spamCount !== 'undefined' ? spamCount : 0, typeof hamCount !== 'undefined' ? hamCount : 0],
                    backgroundColor: ['#FF003C', '#00FF66'],
                    borderColor: ['rgba(255, 0, 60, 0.5)', 'rgba(0, 255, 102, 0.5)'],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20 } },
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 33, 0.9)',
                        titleFont: { size: 14, family: "'Poppins', sans-serif" },
                        bodyFont: { size: 14 },
                        padding: 12,
                        borderColor: 'rgba(0, 240, 255, 0.3)',
                        borderWidth: 1
                    }
                },
                cutout: '70%'
            }
        });

        if (typeof topWordsKeys !== 'undefined' && topWordsKeys.length > 0) {
            const ctxWords = document.getElementById('wordsChart').getContext('2d');
            
            // Create gradient for bars
            let gradient = ctxWords.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, '#00F0FF');
            gradient.addColorStop(1, '#0055FF');

            wordsChartInstance = new Chart(ctxWords, {
                type: 'bar',
                data: {
                    labels: topWordsKeys,
                    datasets: [{
                        label: 'Frequency',
                        data: topWordsValues,
                        backgroundColor: gradient,
                        borderColor: '#00F0FF',
                        borderWidth: 1,
                        borderRadius: 6,
                        hoverBackgroundColor: '#00F0FF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(13, 17, 33, 0.9)',
                            padding: 12,
                            borderColor: 'rgba(0, 240, 255, 0.3)',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: gridColor, drawBorder: false }
                        },
                        x: {
                            grid: { display: false, drawBorder: false }
                        }
                    }
                }
            });
        }
    }
    
    function updateChartsTheme(theme) {
        if (!ratioChartInstance) return;
        
        const textColor = theme === 'light' ? '#1e293b' : '#E2E8F0';
        const gridColor = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
        
        Chart.defaults.color = textColor;
        ratioChartInstance.update();
        
        if (wordsChartInstance) {
            wordsChartInstance.options.scales.y.grid.color = gridColor;
            wordsChartInstance.update();
        }
    }

    // Initialize Particles.js if available
    function initParticles() {
        if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
            const isLight = document.documentElement.getAttribute('data-bs-theme') === 'light';
            const color = isLight ? '#0033CC' : '#00F0FF';
            const particleOpacity = isLight ? 0.6 : 0.4;
            const lineOpacity = isLight ? 0.3 : 0.2;

            particlesJS("particles-js", {
                "particles": {
                    "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": color },
                    "shape": { "type": "circle" },
                    "opacity": { "value": particleOpacity, "random": true },
                    "size": { "value": 3, "random": true },
                    "line_linked": { "enable": true, "distance": 150, "color": color, "opacity": lineOpacity, "width": isLight ? 1.5 : 1 },
                    "move": { "enable": true, "speed": 1.5, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                    "modes": { "grab": { "distance": 140, "line_linked": { "opacity": isLight ? 0.9 : 0.8 } }, "push": { "particles_nb": 4 } }
                },
                "retina_detect": true
            });
        }
    }

    function updateParticlesTheme(theme) {
        initParticles(); // Re-init with new colors
    }

    // Initialize
    initParticles();
});

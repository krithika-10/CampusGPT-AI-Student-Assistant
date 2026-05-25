// Gemini API Configuration
const API_KEY = "AIzaSyCOISzlrF7qnEhn2_G4A27kJuKVaUInKhg";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupSmoothScrolling();
    initializeParticles();
    initializeMobileMenu();
});

    // Navbar scroll behavior: add .scrolled when user scrolls past 40px
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

// Setup Event Listeners
function setupEventListeners() {
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
}

// Setup Smooth Scrolling for Navigation Links
function setupSmoothScrolling() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                // close mobile menu if open
                const navList = document.querySelector('.nav-links');
                if (navList && navList.classList.contains('open')) {
                    navList.classList.remove('open');
                    const toggle = document.querySelector('.nav-toggle');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}

// Mobile menu toggle
function initializeMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-links');
    if (!toggle || !navList) return;

    toggle.addEventListener('click', () => {
        const open = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // close on outside click
    document.addEventListener('click', (e) => {
        if (!navList.contains(e.target) && !toggle.contains(e.target)) {
            if (navList.classList.contains('open')) {
                navList.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        }
    });
}

// Initialize Particles
function initializeParticles() {
    // Add subtle mouse tracking effect
    document.addEventListener('mousemove', function(e) {
        const orbs = document.querySelectorAll('.orb');
        orbs.forEach(orb => {
            const x = (e.clientX / window.innerWidth) * 20;
            const y = (e.clientY / window.innerHeight) * 20;
            orb.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
}

// Send Message Handler
async function handleSendMessage() {
    const message = userInput.value.trim();

    // Validation
    if (!message) {
        return;
    }

    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
        showErrorMessage("⚠️ Please set your Gemini API key in script.js before using the chatbot.");
        return;
    }

    // Add user message to chat
    addMessageToChat(message, 'user');
    userInput.value = '';
    sendButton.disabled = true;

    // Show thinking animation
    showThinkingAnimation();

    try {
        // Call Gemini API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            }),
        });

        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json();
            removeThinkingAnimation();
            if (response.status === 401) {
                showErrorMessage("❌ Invalid API key. Please check your Gemini API key configuration.");
            } else if (response.status === 429) {
                showErrorMessage("⏱️ Rate limit exceeded. Please try again in a moment.");
            } else {
                showErrorMessage(`❌ Error: ${errorData.error?.message || 'Failed to get response'}`);
            }
            console.error('API Error:', errorData);
            return;
        }

        // Parse response
        const data = await response.json();
        const aiMessage = data.candidates[0].content.parts[0].text;

        // Remove thinking animation and add AI response with typing effect
        removeThinkingAnimation();
        addMessageToChat(aiMessage, 'ai', true);

    } catch (error) {
        console.error('Error:', error);
        removeThinkingAnimation();
        showErrorMessage(`❌ Connection error: ${error.message}`);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Add Message to Chat
function addMessageToChat(message, sender, useTyping = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'ai-message'}`;

    if (sender === 'ai') {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        messageDiv.appendChild(avatar);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    if (useTyping && sender === 'ai') {
        // Typing effect for AI messages
        typeMessage(message, contentDiv);
    } else {
        // Parse and format message
        contentDiv.innerHTML = formatMessage(message);
    }

    // Auto-scroll to latest message
    scrollToBottom();
}

// Typing Effect
function typeMessage(message, element) {
    const formattedMessage = formatMessage(message);
    let index = 0;
    const characters = message.split('');
    
    function type() {
        if (index < characters.length) {
            element.textContent += characters[index];
            index++;
            setTimeout(type, 15); // Adjust typing speed
        } else {
            element.innerHTML = formatMessage(message);
        }
    }
    
    type();
    scrollToBottom();
}

// Show Thinking Animation
function showThinkingAnimation() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.id = 'thinking-animation';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    messageDiv.appendChild(avatar);

    const thinkingContent = document.createElement('div');
    thinkingContent.className = 'typing-indicator';

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        thinkingContent.appendChild(dot);
    }

    messageDiv.appendChild(thinkingContent);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Remove Thinking Animation
function removeThinkingAnimation() {
    const thinkingAnimation = document.getElementById('thinking-animation');
    if (thinkingAnimation) {
        thinkingAnimation.remove();
    }
}

// Show Error Message
function showErrorMessage(errorMessage) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '⚠️';
    messageDiv.appendChild(avatar);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = errorMessage;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    scrollToBottom();
}

// Format Message (Handle line breaks and basic formatting)
function formatMessage(message) {
    return message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: rgba(0, 217, 255, 0.2); padding: 0.3em 0.6em; border-radius: 4px; color: #00f0ff; font-weight: 500;">$1</code>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul style="margin-left: 1.5rem; margin-top: 0.5rem;">$1</ul>')
        .replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>')
        .replace(/(<li>)/g, (match, offset, str) => {
            if (offset > 0 && str[offset - 1] !== '>') return '<ol style="margin-left: 1.5rem; margin-top: 0.5rem;"><li>';
            return match;
        });
}

// Auto-scroll to Bottom
function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 0);
}

// Keyboard Navigation for Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        userInput.blur();
    }
});

// Smooth scroll on page load
window.addEventListener('load', function() {
    scrollToBottom();
});

console.log('🚀 CampusGPT Premium Edition Initialized! Powered by Gemini AI');
 

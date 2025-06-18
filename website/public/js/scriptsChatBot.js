document.addEventListener("DOMContentLoaded", function () {
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatLog = document.getElementById('chat-log');
    const buttonContainer = document.getElementById('button-container');
    const body = document.body;
    const isAdminPage = body.dataset.isAdmin === "true";

    if (isAdminPage) {
        toggleChatbotVisibility(false);
    } else {
        toggleChatbotVisibility(true);
    }

    function toggleChatbot() {
        chatbotContainer.classList.toggle('open');
    }

    function toggleChatbotVisibility(isVisible) {
        if (chatbotIcon) {
        chatbotIcon.style.display = isVisible ? "block" : "none";
        }
        if (chatbotContainer) {
        chatbotContainer.style.display = isVisible ? "block" : "none";
        }
    }
    
    function addMessage(message, isBot) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isBot ? 'bot-message' : 'user-message');
        messageElement.innerHTML = message;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function displayButtons(buttons) {
        buttonContainer.innerHTML = '';
        buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.classList.add('btn', 'btn-primary', 'btn-sm');
        buttonElement.textContent = button.label;
        buttonElement.addEventListener('click', () => {
            sendMessageToServer(button.action);
        });
        buttonContainer.appendChild(buttonElement);
        });
    }

    function sendMessageToServer(action) {
        let userMessage;
        if (action === 'consult') {
        userMessage = 'Консультация';
        } else if (action === 'prices') {
        userMessage = 'Цены';
        } else if (action === 'about') {
        userMessage = 'О компании';
        } else {
        userMessage = action;
        }
        addMessage(userMessage, false);

        fetch('/chatbot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: action })
        })
        .then(response => response.json())
        .then(data => {
        addMessage(data.message, true);
        if (data.buttons) {
            displayButtons(data.buttons);
        }
        });
    }

    chatbotIcon.addEventListener('click', toggleChatbot);

    addMessage('Здравствуйте! Чем я могу Вам помочь?', true);
    const initialButtons = [
        { label: 'Консультация', action: 'consult' },
        { label: 'Цены', action: 'prices' },
        { label: 'О компании', action: 'about' }
    ];
    displayButtons(initialButtons);
});
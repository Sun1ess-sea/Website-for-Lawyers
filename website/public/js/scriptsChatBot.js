document.addEventListener("DOMContentLoaded", function () {
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatLog = document.getElementById('chat-log');
    const buttonContainer = document.getElementById('button-container');
    const body = document.body;
    const isAdminPage = body.dataset.isAdmin === "true";

    if (isAdminPage) {
        // Если это страница администратора, скрываем чат-бота
        toggleChatbotVisibility(false);
    } else {
        // Иначе (если это не страница администратора), показываем чат-бота
        toggleChatbotVisibility(true);
    }

    // Функция для переключения видимости чат-бота
    function toggleChatbot() {
        chatbotContainer.classList.toggle('open');
    }

    // Функция для скрытия/отображения чат-бота
    function toggleChatbotVisibility(isVisible) {
        if (chatbotIcon) {
        chatbotIcon.style.display = isVisible ? "block" : "none";
        }
        if (chatbotContainer) {
        chatbotContainer.style.display = isVisible ? "block" : "none";
        }
    }
    
    // Функция для добавления сообщения в чат
    function addMessage(message, isBot) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isBot ? 'bot-message' : 'user-message');
        messageElement.textContent = message;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Функция для отображения кнопок
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

    // Функция для отправки сообщения на сервер
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

    // Обработчик клика на иконку чат-бота
    chatbotIcon.addEventListener('click', toggleChatbot);

    // Инициализация чат-бота
    addMessage('Здравствуйте! Чем я могу вам помочь?', true);
    const initialButtons = [
        { label: 'Консультация', action: 'consult' },
        { label: 'Цены', action: 'prices' },
        { label: 'О компании', action: 'about' }
    ];
    displayButtons(initialButtons);
});
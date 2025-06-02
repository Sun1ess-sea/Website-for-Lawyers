require('dotenv').config();
const express = require('express');
const exphbs = require('express-handlebars');
const router = require('./routes/routes');
const Handlebars = require('handlebars');

// Сессия + вход + маршруты админа
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 2888;

const hbs = exphbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: 'views/layouts',
    partialsDir: 'views/partials',
    helpers: {
    gt: (a, b) => a > b,

    lt: (a, b) => a < b,

    add: (a, b) => a + b,

    subtract: (a, b) => a - b,

    pagination: (totalPages, currentPage) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({
        number: i,
        active: i === currentPage
        });
    }
    return pages;
    },

    nl2br: function (text) {
      if (!text) return '';
      const escapedText = Handlebars.escapeExpression(text);
      const withBr = escapedText.replace(/\n/g, '<br>');
      return new Handlebars.SafeString(withBr);
    },

    nl2brList: function (text) {
        if (!text) return '';
        const items = text
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => `<li>${Handlebars.escapeExpression(item)}</li>`)
            .join('');
        return new Handlebars.SafeString(`<ul class="custom-dots">${items}</ul>`);
    },

    json: function (context) {
      return JSON.stringify(context);
    }

  }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Структура данных для хранения информации и кнопок чат-бота--------------------------------------------
const responses = {
    'consult': {
        'message': 'Пожалуйста, свяжитесь с нами по телефону +7-900-000-000',
        'buttons': [
            {label: 'Консультация', action: 'consult'},
            {label: 'Цены', action: 'prices'},
            {label: 'О компании', action: 'about'}
        ]
    },
    'prices': {
        'message': 'Стоимость наших услуг зависит от сложности дела...',
        'buttons': [
            {label: 'Консультация', action: 'consult'},
            {label: 'Цены', action: 'prices'},
            {label: 'О компании', action: 'about'}
        ]
    },
    'about': {
        'message': 'Мы - коллегия адвокатов с многолетним опытом...',
        'buttons': [
            {label: 'Консультация', action: 'consult'},
            {label: 'Цены', action: 'prices'},
            {label: 'О компании', action: 'about'}
        ]
    }
};

const initialButtons = [
    {label: 'Консультация', action: 'consult'},
    {label: 'Цены', action: 'prices'},
    {label: 'О компании', action: 'about'}
];

app.post('/chatbot', (req, res) => {
    const action = req.body.action;
    let response;

    if (action in responses) {
        response = responses[action];
    } else {
        response = {message: 'Я не понимаю ваш запрос.', buttons: initialButtons};
    }

    res.json(response);
});
// ---------------------------------------------------------------------------------------------------------

app.use('/', router)

app.use(session({
    secret: 'super-secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

app.use(flash());

app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});

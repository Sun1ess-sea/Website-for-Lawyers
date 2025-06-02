***сайт***
бд
create table admins (
    admin_id PK,
    admin_login,
    admin_password,
    admin_name
);

create table lawyer (
    lawyer_id PK,
    admin_id FK,
    lawyer_image,
    lawyer_fullname,
    lawyer_title,
    lawyer_description,
    lawyer_experience,
    lawyer_awards
);

create table news (
    news_id PK,
    admin_id FK,
    news_image,
    news_date,
    news_title,
    news_description,
    news_author (admin_id по сути дела вроде бы)
);

create table reviews (
    review_id PK,
    admin_id FK,
    review_image,
    review_title,
    review_description
);

create table legal_specialization ( // таблица со специализациями  и их описанием
    ls_id PK,
    spec_name,
    spec_description
);

create table lawyers_specialization (
    lawyer_id FK,
    ls_id FK
);

create table legal_services ( // услуги
    service_id PK,
    service_name,
    service_description,
    service_price
);

create table lawyers_services (
    ls_id FK,
    service_id FK
);

create table feedback (
    feedback_id,
    feedback_email,
    feedback_phone,
    feedback_fullname,
    feedback_problem
);

create table booking (
    booking_id PK,
    lawyer_id FK,
    ls_id FK, // выбранная специализация    
    booking_date,
    email_client,
    phone_client,
    name_client,

);

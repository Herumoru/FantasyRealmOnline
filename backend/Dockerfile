# Image PHP + Apache avec les extensions necessaires (pdo_mysql + mongodb)
FROM php:8.1-apache

# Extensions systeme necessaires a la compilation de l'extension mongodb
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Extension MySQL (PDO) - deja disponible via docker-php-ext-install
RUN docker-php-ext-install pdo pdo_mysql

# Extension MongoDB via PECL (necessaire car pas incluse par defaut dans PHP)
RUN pecl install mongodb && docker-php-ext-enable mongodb

# Composer (pour installer la librairie mongodb/mongodb)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Apache : le docroot de l'application est le dossier public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN a2enmod rewrite

WORKDIR /var/www/html

# Copie du code de l'application
COPY . /var/www/html

# Installation des dependances PHP (mongodb/mongodb)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Droits d'ecriture (utile si des logs/fichiers sont ecrits localement)
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

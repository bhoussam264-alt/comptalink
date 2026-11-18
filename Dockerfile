FROM php:8.2-apache

RUN apt-get update && apt-get install -y libzip-dev zip unzip git && docker-php-ext-install pdo_mysql zip

RUN a2enmod rewrite

RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' /etc/apache2/sites-available/000-default.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY backend/ /var/www/html/

WORKDIR /var/www/html

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

RUN mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

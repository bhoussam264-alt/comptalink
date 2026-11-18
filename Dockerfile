FROM php:8.2-apache
RUN apt-get update && apt-get install -y libzip-dev zip unzip && docker-php-ext-install pdo_mysql zip
RUN a2enmod rewrite
COPY backend/ /var/www/html/
WORKDIR /var/www/html
RUN mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true
EXPOSE 80

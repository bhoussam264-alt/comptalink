FROM php:8.2-apache
RUN apt-get update && apt-get install -y libzip-dev zip unzip && docker-php-ext-install pdo_mysql zip
RUN a2enmod rewrite
COPY . /var/www/html/
WORKDIR /var/www/html
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
EXPOSE 80


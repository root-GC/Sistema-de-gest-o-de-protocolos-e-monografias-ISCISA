FROM php:8.3-cli

# Dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install \
        gd \
        pdo_pgsql \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Primeiro dependências, para aproveitar cache do Docker
COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts

# Agora o restante da aplicação
COPY . .

# Permissões do Laravel
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Porta fornecida pelo Railway
CMD php artisan serve \
    --host=0.0.0.0 \
    --port=${PORT:-8080}
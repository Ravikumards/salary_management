# syntax=docker/dockerfile:1
# Single image: Rails serves the API and the Vite-built React app.
# Use a patched Ruby 3.3 (>= 3.3.14, see docs/TRADEOFFS.md).
ARG RUBY_VERSION=3.3
FROM ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails
ENV RAILS_ENV=production BUNDLE_DEPLOYMENT=1 BUNDLE_PATH=/usr/local/bundle BUNDLE_WITHOUT="development:test"
RUN apt-get update -qq && apt-get install --no-install-recommends -y default-mysql-client libjemalloc2 && rm -rf /var/lib/apt/lists/*

FROM base AS build
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential default-libmysqlclient-dev git pkg-config libyaml-dev curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
COPY Gemfile Gemfile.lock ./
RUN bundle install && rm -rf ~/.bundle "${BUNDLE_PATH}"/ruby/*/cache && bundle exec bootsnap precompile --gemfile
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN bundle exec bootsnap precompile app/ lib/ && \
    SECRET_KEY_BASE_DUMMY=1 bin/rails assets:precompile && \
    rm -rf node_modules

FROM base
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails
RUN groupadd --system --gid 1000 rails && useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    mkdir -p log tmp && chown -R rails:rails log tmp
USER 1000:1000
ENV RAILS_SERVE_STATIC_FILES=1
EXPOSE 3000
# db:prepare creates/migrates the database on boot; seed separately with `bin/rails db:seed`.
CMD ["sh", "-c", "bin/rails db:prepare && bin/rails server -b 0.0.0.0 -p ${PORT:-3000}"]

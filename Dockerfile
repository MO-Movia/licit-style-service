FROM node:alpine
# Create app folder tree and grant permissions to node user.
RUN mkdir -p /app/service /app/data/ \
 && chown -R node:node /app

WORKDIR /app/service
USER node:node

# Sets port and data file name.
# These are the defaults that will be used if not supplied.
ENV HTTP_PORT=3000 DATA_ROOT=/app/data SAVE_SECONDS=30 LOG_LEVEL=info NO_UPDATE_NOTIFIER=true

# Creates volume for container data.
VOLUME ${DATA_ROOT}
EXPOSE ${HTTP_PORT}

# Load source into container and build.
COPY --chown=node:node . /app/service/
RUN \
  npm ci \
  && npm run build \
  && npm ci --only-production \
  && npm cache clean --force

# Run the service
CMD node .

# Monitor express listener
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget http://localhost:3000/status -q -O - > /dev/null 2>&1

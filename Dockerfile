FROM node:alpine

USER node:node
WORKDIR /app/service/
COPY --chown=node:node . /app/service/

# Creates direcotry for data
# Builds the applciation from source
RUN mkdir -p /app/data \
  && npm ci \
  && npm run build

# Sets port and data file name.
# These are the defaults that will be used if not supplied.
ENV HTTP_PORT=3000 DATA_ROOT=/app/data
# Creates volume for container data.
VOLUME ${DATA_ROOT}
EXPOSE ${HTTP_PORT}
# Run the service
CMD node .

FROM python:3.8.13-bullseye

RUN apt-get update && apt-get install -y iputils-ping libpq-dev python3-dev

ARG NEW_BUILD
ENV NODE_VERSION=16.14.2
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:/root/.local/bin:${PATH}"
RUN node --version
RUN npm --version

RUN curl -sSL https://install.python-poetry.org | python3 -

COPY . /new-train-tracker
WORKDIR /new-train-tracker
RUN chmod 755 wait-for-it.sh
RUN npm install

EXPOSE 5001/tcp
CMD ["/bin/bash", "wait-for-it.sh"]

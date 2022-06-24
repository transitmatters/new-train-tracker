FROM python:3.8

RUN apt-get update && apt-get install -y iputils-ping

ARG NEW_BUILD
ENV NODE_VERSION=16.14.2
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

RUN pip3 install pipenv

COPY . /new-train-tracker
WORKDIR /new-train-tracker
RUN npm install
# needs to be run within the terminal after startup.
# RUN npm run create-history-db

EXPOSE 5001/tcp
CMD ["/usr/local/bin/pipenv", "run", "gunicorn", "-b", "localhost:5001", "-w", "1", "server.application:application"]

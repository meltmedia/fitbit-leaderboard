FROM totem/nodejs-base:0.10.29-trusty

WORKDIR /opt/fitbit

RUN npm install -g grunt-cli bower

ADD package.json npm-shrinkwrap.json /opt/fitbit/
RUN rm -rf ./node_modules && npm install

ADD bower.json /opt/fitbit
RUN /usr/bin/bower --allow-root install

ADD . /opt/fitbit

EXPOSE 5455

ENV DISCOVER fitbit-leaderboard:5455

ENTRYPOINT ["/usr/bin/grunt"]
CMD ["--help"]

FROM totem/nodejs-base:0.10.29-trusty

ADD . /opt/fitbit

RUN npm install -g grunt-cli bower
RUN cd /opt/fitbit && npm install && /usr/bin/bower --allow-root install

EXPOSE 5455

ENV DISCOVER fitbit-leaderboard:5455

WORKDIR /opt/fitbit

ENTRYPOINT ["/usr/bin/grunt"]
CMD ["--help"]

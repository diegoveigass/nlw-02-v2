import nodemailer from 'nodemailer';

import mailConfig from '../config/mail';

const { host, pass, port, user } = mailConfig;

const transport = nodemailer.createTransport({
  host,
  port,
  auth: {
    user,
    pass,
  },
});

export default transport;

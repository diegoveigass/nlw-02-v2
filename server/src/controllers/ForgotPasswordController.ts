import { Request, Response } from 'express';
import crypto from 'crypto';
import { format } from 'date-fns';
import Mailer from '../modules/mailer';

import db from '../database/connection';

export default class ForgotPasswordController {
  async create(request: Request, response: Response) {
    const { email } = request.body;

    const userExists = await db('users')
      .where('email', '=', email)
      .select(['users.*']);

    if (userExists.length === 0) {
      return response.status(400).json({ error: 'User not exists' });
    }

    const token = crypto.randomBytes(20).toString('hex');

    const now = new Date();
    now.setHours(now.getHours() + 1);

    const formattedDate = format(now, "HH:mm'h'");

    await db('users').where('email', '=', email).update({
      passwordResetToken: token,
      passwordResetExpires: now,
    });

    await Mailer.sendMail({
      to: userExists[0].email,
      from: 'proffy@proffy.com',
      subject: '@Proffy - Esqueci minha senha',
      html: `<h2>Olá, ${userExists[0].name}</h2>
      <p>Segue o link para reset de senha TOKEN: <b>${token}</b></p>
      <p>Ele expira às <b>${formattedDate}</b></p>
      <footer>
        <span>Equipe Proffy, sempre a disposição</span>
      </footer>
      `,
    });

    return response.status(200).send();
  }
}
